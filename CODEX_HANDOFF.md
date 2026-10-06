# Handoff para Codex

## Estado atual

O projeto já é um MVP full-stack local funcional. Não reescreva a interface do zero.

### O que já está pronto

- SPA em HTML/CSS/JavaScript sem framework.
- Backend Node com API REST local.
- Persistência em `data/store.json`.
- Layout responsivo real:
  - sidebar em desktop;
  - bottom navigation no mobile;
  - conteúdo com largura de web no computador.
- Navegação atual: Início, Rotina, SOS, Alimentação e Apoio. Perfil acessível pelo avatar no header.
- Calculadora de gasto/economia.
- Check-in diário e métricas.
- Rotina editável.
- SOS sequencial de 5 passos.
- Alimentação, hidratação, receitas e compras.
- Perfil enxuto.

## Nome do produto

A marca escolhida pelo usuário é **Desato**. Na interface, `APP_NAME = 'Desato'`; em títulos, manifesto e metadados de descoberta, usar **Desato App**. Manter a escrita consistente.

## Quiz a implementar

Antes de criar o quiz, consultar `PLANEJAMENTO_QUIZ.md`. O usuário pediu duas perguntas financeiras consecutivas (gasto médio por saída e frequência semanal), seguidas de uma comparação visual de gasto e economia projetada. A assinatura de aproximadamente R$ 20/mês é uma hipótese de planejamento, ainda não um preço final ou cobrança implementada.

## Aba Apoio implementada

A aba **Apoio** substitui Perfil na navegação principal e está implementada com seis situações práticas, nove guias, favoritos e plano pessoal salvo. Perfil permanece pelo avatar. Conteúdo em `public/js/content/support-guides.js`; tela em `public/js/views/support.js`. A API migra arquivos antigos para `support` sem perder o histórico. Consultar `PLANEJAMENTO_APOIO.md` para detalhes. O SOS mantém seu fluxo linear.

## Prioridade para implementação real

1. Trocar `data/store.json` por banco de dados.
2. Criar autenticação.
3. Vincular todos os dados a `user_id`.
4. Implementar assinatura/pagamento.
5. Criar ambiente de produção e variáveis de ambiente.
6. Manter o frontend e os fluxos existentes salvo instrução explícita para redesenhar.

## Regra importante

Não volte a colocar no Perfil as funções removidas do MVP (contato de confiança, motivos, lembretes, exportação, restaurar dados e central de ajuda) sem solicitação explícita.

O SOS também deve continuar como **um fluxo linear**, e não voltar a ser uma grade de várias ferramentas.

## Supabase — 06/10/2026

Migração inicial aplicada no projeto `szvxlhubtvhazlzohpse` após autenticação da conta correta. Histórico de migrações e verificação remota confirmam 12 tabelas com RLS e trigger de cadastro. Oito testes SQL locais passaram. Consultar `SUPABASE_SETUP.md`. O aplicativo ainda não foi adaptado ao banco: persistência atual continua JSON. Próxima etapa é integrar sessões autenticadas e adaptar as rotas. Não reaplicar o SQL inicial nem enviar dados locais sem definir a conta destinatária.
