# Assinatura (Cakto)

- Produto: **Desato App — Apoio para parar de beber** (`b3263e25-cc53-431a-a090-be0ccaf8d0c9`), R$ 29,90/mês.
- Checkout: https://pay.cakto.com.br/6fnsj7n (oferta `6fnsj7n`), usado no fim do quiz e na tela de bloqueio do app.

## Como funciona

1. A pessoa paga na Cakto. A Cakto chama a Edge Function `cakto-webhook`.
2. A função valida o `secret`, **reconsulta o pedido na API da Cakto** e grava `desato_subscriptions` por e-mail.
3. O servidor chama `desato_has_access()` a cada requisição autenticada. Sem assinatura ativa: HTTP 402 e tela "Ative sua assinatura".
4. A conta do app precisa usar o **mesmo e-mail** do pagamento (pode ser criada antes ou depois).

Regras: ativa (com 3 dias de tolerância), cancelada mantém acesso até o fim do período pago, reembolso/chargeback cortam na hora.
Eventos tratados: `purchase_approved`, `subscription_renewed`, `subscription_canceled`, `refund`, `chargeback`.

## Publicar (requer login na conta Supabase dona do projeto `szvxlhubtvhazlzohpse`)

```bash
npx supabase login
npx supabase link --project-ref szvxlhubtvhazlzohpse
npx supabase db push
npx supabase functions deploy cakto-webhook --no-verify-jwt
npx supabase secrets set CAKTO_CLIENT_ID=... CAKTO_CLIENT_SECRET=... CAKTO_WEBHOOK_SECRET=...
```

URL do webhook para cadastrar na Cakto: `https://szvxlhubtvhazlzohpse.supabase.co/functions/v1/cakto-webhook`.
O `CAKTO_WEBHOOK_SECRET` é o segredo exibido pela Cakto ao criar o webhook.

## Estado (11/10/2026)

Publicado: migração `20261011000200_subscriptions` (aplicada isoladamente; `20261006000200_funnel_responses` segue pendente de propósito), função `cakto-webhook`, secrets `CAKTO_CLIENT_ID`, `CAKTO_CLIENT_SECRET`, `CAKTO_WEBHOOK_SECRET`. Webhook Cakto id `73541` ("Desato App - Assinatura").
