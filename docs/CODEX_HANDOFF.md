# Handoff para Codex

## Estado atual

Pasta atual: `Desato App`. Documentação reunida em `docs`; README da raiz serve como índice. O site fica em `/`, os quizzes em `/quiz` e o aplicativo em `/app`. Não recriar a pasta com o nome antigo. O prompt em `docs/PROMPT_PARA_CODEX.txt` é histórico e contém premissas anteriores.

O projeto já é um MVP full-stack local funcional. Não reescreva a interface do zero.

### O que já está pronto

- SPA em HTML/CSS/JavaScript sem framework.
- Backend Node com API REST local.
- Persistência padrão no Supabase por conta. JSON apenas com `STORAGE_MODE=json` local.
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

## Site e quizzes implementados

Site público na raiz, funil direto em `/quiz` e aplicativo em `/app`. Atualização solicitada: header só com marca, apresentação com um botão, uma pergunta por tela, seleção única avança imediatamente e checklist usa Continuar. Sem catálogo, idade, rodapé, login, orientações clínicas ou links de saída no funil. São sete perguntas, terminando em gasto/frequência e resumo financeiro. Cinco versões disponíveis por links diretos, sem menu de escolha. Consultar `SITE_E_QUIZZES.md`. Não inventar diagnóstico, preço final, cobrança ou botão de checkout sem destino.

Coleta no banco foi explicitamente adiada pelo usuário para focar nas interfaces. Migração `20261006000200_funnel_responses.sql` preparada e testada localmente, mas não aplicada remotamente (CLI retornou permissão 403). `FUNNEL_ENABLED` fica desativado por padrão; não ativar nem retentar acesso remoto até retomar essa etapa. App mantém Supabase e isolamento por conta. Modelo/API de respostas v1 preservados, sem controles antigos no funil.

## Aba Apoio implementada

A aba **Apoio** substitui Perfil na navegação principal e está implementada com seis situações práticas, nove guias, favoritos e plano pessoal salvo. Perfil permanece pelo avatar. Conteúdo em `public/js/content/support-guides.js`; tela em `public/js/views/support.js`. A API migra arquivos antigos para `support` sem perder o histórico. Consultar `PLANEJAMENTO_APOIO.md` para detalhes. O SOS mantém seu fluxo linear.

## Prioridade para implementação real

Banco, autenticação e vínculo por `user_id` já foram implementados. Antes de priorizar cobrança, consultar `PESQUISA_E_PLANO_DESATO.md`: a pesquisa de 06/10/2026 recomenda reforçar o foco em vontade de beber, gatilhos, plano por situação, resultado do SOS e retomada após consumo. A navegação proposta e a redução do destaque de Alimentação são planejamento; ainda não foram implementadas. Manter os fluxos existentes até uma solicitação de implementação.

## Regra importante

Não volte a colocar no Perfil as funções removidas do MVP (contato de confiança, motivos, lembretes, exportação, restaurar dados e central de ajuda) sem solicitação explícita.

O SOS também deve continuar como **um fluxo linear**, e não voltar a ser uma grade de várias ferramentas.

## Supabase — 06/10/2026

Migração inicial aplicada no projeto `szvxlhubtvhazlzohpse` após autenticação da conta correta. Histórico de migrações e verificação remota confirmam 12 tabelas com RLS e trigger de cadastro. Oito testes SQL locais passaram. Consultar `SUPABASE_SETUP.md`. O aplicativo agora foi integrado ao banco com Supabase Auth; todas as rotas de dados exigem sessão no modo padrão. A configuração de login está em `config/supabase.json` e a implementação de persistência em `lib/supabase.cjs`. Não reaplicar o SQL inicial nem enviar dados locais sem definir a conta destinatária.

## Login — 06/10/2026

Tela de acesso simplificada a pedido do usuário: entrar, criar conta e esqueci a senha. Removidos reenvio de confirmação, bloco de apoio e atalhos públicos para SOS/orientações, inclusive na falha de inicialização. A confirmação de cadastro continua definida pelo Supabase; não desativar essa configuração apenas porque o botão foi removido. Recuperação de senha permanece funcional. As funções internas do aplicativo não foram removidas por esta alteração da tela de login.

Login, cadastro, recuperação, sessão persistente e saída implementados. Perfil inclui controles da conta; senhas ficam no Supabase Auth. O usuário informou que adicionou as duas URLs locais de redirecionamento. SDK do navegador empacotado em `public/vendor/supabase.js`. O histórico JSON antigo não foi importado. Nunca fazer fallback silencioso para JSON nem expor chave administrativa.
