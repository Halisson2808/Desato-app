# Site e funil — atualização de 06/10/2026

## Interface atual

`/quiz` abre diretamente a apresentação do funil principal. Não há catálogo, confirmação de idade, rodapé, login ou links de saída. O header contém apenas a logo e a marca Desato App.

A abertura tem título, subtítulo, ilustração leve feita com CSS e um único botão para começar. Depois há uma pergunta por tela:

1. Objetivo pessoal.
2–4. Perguntas da versão escolhida.
5. Checklist do que a pessoa quer recuperar no dia a dia.
6. Gasto médio com bebidas por saída.
7. Frequência semanal dessas saídas.

Seleção única avança imediatamente. Checklist permite várias escolhas e só habilita Continuar depois de uma seleção. Valores financeiros oferecem atalhos que avançam ao tocar e campos personalizados com validação. A seta interna permite corrigir etapas anteriores, preservando respostas.

O resultado mostra objetivo, escolhas, gasto médio mensal/diário/anual e cenários de economia. As contas são projeções pelas respostas, sem classificação clínica e sem garantia de redução do consumo. Nesta versão, não há preço ou assinatura no resumo financeiro: o checkout foi expressamente adiado pelo usuário.

As cinco versões continuam disponíveis para uso por links diretos: `/quiz/consumo`, `/quiz/vontade`, `/quiz/gatilhos`, `/quiz/impacto` e `/quiz/retomada`. `/quiz` usa consumo como padrão. Nenhuma versão passa por uma tela de seleção.

O código do BioPet-Nutri foi usado como referência para a estrutura: abertura, seleção única automática e checklist com confirmação. A pasta avo-yuki estava vazia no ambiente consultado. Nenhum dos projetos de referência foi alterado.

## Arquivos

- `public/quiz.html`: página sem navegação externa.
- `public/funnel.css`: visual próprio do funil, responsivo e com redução de movimento.
- `public/js/quiz.js`: etapas, respostas, validação e resumo.
- `public/js/quiz-model.js`: versões v2 e cálculos; modelo v1 preservado para compatibilidade com respostas anteriores.

Site público em `/` e aplicativo em `/app` continuam separados. Perfil contém link para responder ao funil. O aplicativo mantém a tela de acesso básica, sem reenvio de confirmação ou atalhos públicos de apoio.

## Banco e checkout: adiado pelo usuário

O usuário pediu foco na interface e deixou a coleta no banco para depois. O registro automático está **desativado por padrão**. O funil funciona sem login e sem enviar respostas quando `/api/config` não informa `funnelEnabled: true`. Não há alerta de falha de banco quando a coleta está desativada.

Foi preparada a migração `supabase/migrations/20261006000200_funnel_responses.sql`, mas ela **não foi aplicada remotamente**: a CLI recebeu erro de permissão 403 e o usuário adiou essa etapa. Não ativar `FUNNEL_ENABLED=true` antes de aplicar e verificar a migração no projeto correto.

O código preparado recebe respostas por `POST /api/funnel`, usando um identificador aleatório e um token de escrita. A tabela proposta `desato_funnel_responses` tem RLS, nenhuma leitura por visitantes/contas comuns e gravação por função controlada. Revisões antigas não substituem as novas; não há ligação automática com contas, e-mail ou telefone. IP é usado apenas em memória para limite de requisições, sem persistência nos registros. Conteúdo pessoal não é logado.

Quando for ativada, cada etapa confirmada e a conclusão poderão ser registradas no Supabase. O modo JSON continua apenas para desenvolvimento explicitamente configurado; não há fallback do banco para arquivos. A futura consulta administrativa e o encaminhamento ao checkout ainda precisam ser definidos. O evento `desato:quiz-complete` é apenas o ponto de integração, sem botão fictício ou destino inventado.

Resultados v1 por conta e a API `/api/quiz` foram preservados, mas os controles antigos de salvar/consultar resultados não aparecem no funil comercial.

## Verificação

54 testes passaram: navegação automática, checklist, valores personalizados, correções, cálculos, cinco links diretos, preservação do app e autenticação. Os testes de coleta usam banco/servidores de teste, sem gravar respostas de pessoas no projeto real. A migração foi validada localmente, incluindo bloqueio de leitura pública, token errado e revisões fora de ordem.

Não houve inspeção ou interação no navegador, conforme a preferência do usuário. Para carregar os arquivos novos em uma aba já aberta, usar Ctrl+F5.
