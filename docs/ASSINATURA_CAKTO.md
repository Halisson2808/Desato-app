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

## Compra única + entrada só com e-mail (15/10/2026)

- **App básico:** pagamento único (R$ 29,90), produto `c39e10f4-71e0-4427-8e7b-1f1431102369`, checkout https://pay.cakto.com.br/wm4tnum (secret `DESATO_CAKTO_BASE_PRODUCT_ID` já definido). O webhook grava `desato_purchases` (e-mail, `paid`/`refunded`/`chargeback`) quando o pedido é do produto `DESATO_CAKTO_BASE_PRODUCT_ID` (secret da função; definir quando o produto for criado na Cakto).
- **Assinatura atual** (`PRODUCT_ID`) fica reservada para o Premium/upsell (R$ 59,90/mês, conteúdo a definir).
- **Acesso:** `desato_email_has_access(email)` = compra paga, assinatura válida ou administrador. `desato_has_access()` usa a mesma regra.
- **Entrada:** Edge Function `email-login` (sem JWT). A pessoa digita o e-mail; se houver acesso, a conta é criada já confirmada e a sessão volta na hora. Sem senha e sem e-mail. Limite: 20 tentativas por IP e 10 por e-mail a cada 15 min (`desato_login_attempts`).
- Cadastro público do Supabase Auth desligado (`disable_signup = true`); contas só nascem pela função.
- Risco aceito pelo dono do produto: quem souber o e-mail de um comprador entra na conta dele.

Deploy: `npm run sb -- functions deploy email-login --no-verify-jwt --use-api`.
