import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Entrada no Desato só com o e-mail da compra: sem senha e sem link mágico.
 *
 * Decisão do dono do produto: público mais velho, uma rotina por pessoa e sem
 * dados sensíveis além do e-mail. Quem souber o e-mail de um comprador entra na
 * conta dele, por isso a função limita tentativas e só aceita e-mails com
 * compra paga, assinatura válida ou administrador.
 *
 * Fluxo: confere o acesso no banco → cria a conta (e-mail já confirmado) se não
 * existir → gera um token de uso único no servidor e o troca por uma sessão,
 * sem enviar e-mail → devolve a sessão para o app.
 */

const MAX_PER_IP = 20;      // tentativas por IP em 15 minutos
const MAX_PER_EMAIL = 10;   // tentativas por e-mail em 15 minutos
const WINDOW_MS = 15 * 60_000;
const ALLOWED_ORIGINS = [
  "https://desato.com.br",
  "https://www.desato.com.br",
  "https://desatoapp.com.br",
  "https://www.desatoapp.com.br",
  "https://desato-app.vercel.app",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
];

// Desenvolvimento local: localhost e 127.0.0.1 em qualquer porta.
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
const allowed = (origin: string | null) => !!origin && (ALLOWED_ORIGINS.includes(origin) || LOCAL_ORIGIN.test(origin));
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": allowed(origin) ? origin! : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Vary": "Origin",
});

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return reply(405, { error: "Método não permitido." });

  let email = "";
  try { email = String((await req.json())?.email ?? "").trim().toLowerCase(); } catch { /* corpo inválido */ }
  if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(400, { error: "Digite um e-mail válido." });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim().slice(0, 64);

  // Limite só para tentativas recusadas (e-mail sem compra): entradas válidas nunca bloqueiam.
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const [byIp, byEmail] = await Promise.all([
    admin.from("desato_login_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).eq("allowed", false).gte("at", since),
    admin.from("desato_login_attempts").select("id", { count: "exact", head: true }).eq("email", email).eq("allowed", false).gte("at", since),
  ]);
  if ((byIp.count ?? 0) >= MAX_PER_IP || (byEmail.count ?? 0) >= MAX_PER_EMAIL) {
    return reply(429, { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." });
  }

  const { data: allowed, error: accessError } = await admin.rpc("desato_email_has_access", { p_email: email });
  await admin.from("desato_login_attempts").insert({ ip, email, allowed: allowed === true });
  if (accessError) {
    console.error("[email-login] access check failed", accessError.message);
    return reply(503, { error: "Não consegui verificar agora. Tente novamente." });
  }
  if (allowed !== true) {
    return reply(403, { error: "Não encontramos uma compra com este e-mail. Use o mesmo e-mail do pagamento." });
  }

  // Conta de administrador nunca entra só com e-mail: precisa da senha, pela área /admin.
  const { data: adminRows } = await admin.from("desato_user_roles").select("role, user_id").eq("role", "admin");
  if (adminRows?.length) {
    const ids = new Set(adminRows.map(row => row.user_id));
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (users?.users?.some(user => ids.has(user.id) && user.email?.toLowerCase() === email)) {
      return reply(409, { error: "Esta conta entra com senha pela área de administrador (/admin)." });
    }
  }

  // Cria a conta na primeira entrada; se já existe, segue.
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error && !/already|registered|exists/i.test(created.error.message)) {
    console.error("[email-login] create user failed", created.error.message);
    return reply(500, { error: "Não consegui preparar sua conta. Tente novamente." });
  }

  // Token de uso único gerado e trocado aqui mesmo: nenhum e-mail é enviado.
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) {
    console.error("[email-login] generate token failed", link.error?.message);
    return reply(500, { error: "Não consegui entrar agora. Tente novamente." });
  }
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await anon.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error || !data.session) {
    console.error("[email-login] verify failed", error?.message);
    return reply(500, { error: "Não consegui entrar agora. Tente novamente." });
  }

  return reply(200, { access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
