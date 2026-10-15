import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Webhook da Cakto para a assinatura do Desato App.
 *
 * A Cakto não assina o payload: a origem é validada pelo campo `secret` do
 * corpo (CAKTO_WEBHOOK_SECRET, mostrado no painel ao criar o webhook). Por ser
 * uma validação fraca, o corpo só avisa que algo aconteceu: o status real é
 * sempre reconsultado na API autenticada da Cakto antes de liberar ou cortar.
 *
 * Secrets necessários na função: CAKTO_WEBHOOK_SECRET, CAKTO_CLIENT_ID,
 * CAKTO_CLIENT_SECRET. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem.
 */

const PRODUCT_ID = Deno.env.get("DESATO_CAKTO_PRODUCT_ID") ?? "b3263e25-cc53-431a-a090-be0ccaf8d0c9";
const API = "https://api.cakto.com.br/public_api";
const RECURRENCE_DAYS = 30;

type Json = Record<string, unknown>;
interface Order {
  id: string;
  status: string;
  product?: { id?: string } | null;
  subscription?: string | null;
  customer?: { email?: string | null } | null;
}
interface Subscription { id: string; status: string; next_payment_date?: string | null }

const log = (step: string, details: Json = {}) => console.log(`[cakto-webhook] ${step} ${JSON.stringify(details)}`);
const reply = (status: number, body: Json) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function timingSafeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

let token: { value: string; expiresAt: number } | null = null;
async function cakto<T>(path: string): Promise<T> {
  if (!token || token.expiresAt - 300_000 < Date.now()) {
    const res = await fetch(`${API}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: Deno.env.get("CAKTO_CLIENT_ID")!, client_secret: Deno.env.get("CAKTO_CLIENT_SECRET")! }),
    });
    if (!res.ok) throw new Error(`Cakto token ${res.status}`);
    const data = await res.json();
    token = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  }
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token.value}` } });
  if (!res.ok) throw new Error(`Cakto GET ${path} -> ${res.status}`);
  return res.json();
}

const idOf = (value: unknown) =>
  typeof value === "string" ? value : typeof (value as Json | null)?.id === "string" ? (value as { id: string }).id : undefined;
const emailOf = (value: unknown) => typeof value === "string" && value.includes("@") ? value.trim().toLowerCase() : undefined;

async function periodEnd(subscriptionId: string | null | undefined) {
  if (subscriptionId) {
    try {
      const sub = await cakto<Subscription>(`/subscriptions/${subscriptionId}/`);
      if (sub.next_payment_date) return new Date(sub.next_payment_date).toISOString();
    } catch (error) { log("subscription lookup failed", { subscriptionId, error: String(error) }); }
  }
  return new Date(Date.now() + RECURRENCE_DAYS * 86_400_000).toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  let body: Json;
  try { body = await req.json(); } catch { return reply(400, { error: "invalid_json" }); }

  const secret = Deno.env.get("CAKTO_WEBHOOK_SECRET");
  if (!secret || typeof body.secret !== "string" || !timingSafeEqual(body.secret, secret)) return reply(401, { error: "unauthorized" });

  const event = String(body.event ?? "");
  const data = (body.data ?? {}) as Json;
  const handled = ["purchase_approved", "subscription_renewed", "subscription_canceled", "refund", "chargeback"];
  if (!handled.includes(event)) return reply(200, { ok: true, skipped: event });

  const productId = idOf(data.product);
  if (productId && productId !== PRODUCT_ID) return reply(200, { ok: true, skipped: "other_product" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const orderId = idOf(data.id) ?? idOf(data.order);
  const period = typeof data.subscription_period === "number" ? `:${data.subscription_period}` : "";
  const eventKey = `${event}:${orderId ?? idOf(data.subscription) ?? "sem-id"}${period}`;

  const { error: dupError } = await supabase.from("desato_cakto_events").insert({ event_key: eventKey, event_type: event });
  if (dupError) {
    if (dupError.code === "23505") return reply(200, { ok: true, duplicate: true });
    log("dedup insert failed", { error: dupError.message });
    return reply(500, { error: "storage" });
  }

  try {
    if (event === "subscription_canceled") {
      const candidates = [idOf(data.subscription), orderId].filter((v): v is string => !!v);
      let subscriptionId: string | undefined;
      for (const id of candidates) {
        try { const sub = await cakto<Subscription>(`/subscriptions/${id}/`); if (["canceled", "inactive", "expired"].includes(sub.status)) { subscriptionId = sub.id; break; } } catch { /* tenta o próximo */ }
      }
      if (!subscriptionId) {
        log("cancel not confirmed by Cakto", { candidates });
        return reply(200, { ok: true, ignored: "not_confirmed" });
      }
      const { data: rows, error } = await supabase.from("desato_subscriptions")
        .update({ status: "canceled" }).eq("cakto_subscription_id", subscriptionId).eq("status", "active").select("email");
      if (error) throw error;
      log("canceled", { subscriptionId, matched: rows?.length ?? 0 });
      return reply(200, { ok: true });
    }

    if (!orderId) throw new Error("evento sem id do pedido");
    const order = await cakto<Order>(`/orders/${orderId}/`);
    if (order.product?.id !== PRODUCT_ID) return reply(200, { ok: true, skipped: "other_product" });
    const email = emailOf(order.customer?.email);
    if (!email) throw new Error("pedido sem e-mail");

    if (event === "purchase_approved" || event === "subscription_renewed") {
      if (order.status !== "paid") {
        log("order not paid", { orderId, status: order.status });
        return reply(200, { ok: true, ignored: "not_paid" });
      }
      const { error } = await supabase.from("desato_subscriptions").upsert({
        email,
        status: "active",
        cakto_subscription_id: order.subscription ?? null,
        cakto_order_id: order.id,
        current_period_end: await periodEnd(order.subscription),
      }, { onConflict: "email" });
      if (error) throw error;
      log("access granted", { orderId });
      return reply(200, { ok: true });
    }

    // refund / chargeback: só corta quando a Cakto confirma o estado final.
    const final = event === "refund" ? "refunded" : "chargedback";
    if (order.status !== final) {
      log("refund/chargeback not final", { orderId, status: order.status });
      await supabase.from("desato_cakto_events").delete().eq("event_key", eventKey);
      return reply(200, { ok: true, ignored: "not_final" });
    }
    const { error } = await supabase.from("desato_subscriptions")
      .update({ status: event === "refund" ? "refunded" : "chargeback" }).eq("email", email);
    if (error) throw error;
    log("access revoked", { orderId, event });
    return reply(200, { ok: true });
  } catch (error) {
    // Libera a chave para a Cakto reenviar e o evento ser processado de novo.
    await supabase.from("desato_cakto_events").delete().eq("event_key", eventKey);
    log("failed", { event, orderId, error: String(error) });
    return reply(500, { error: "processing_failed" });
  }
});
