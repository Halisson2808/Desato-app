# Site e quizzes — 06/10/2026

## Rotas implementadas

- `/`: site público do Desato App, com apresentação, cinco caminhos, funções atuais e dúvidas frequentes.
- `/quiz`: seleção dos cinco quizzes e consulta de resultados salvos na conta.
- `/quiz/consumo`, `/quiz/vontade`, `/quiz/gatilhos`, `/quiz/impacto`, `/quiz/retomada`: acesso direto à versão correspondente, com confirmação de idade antes de iniciar.
- `/app`: aplicativo existente, com login e as abas atuais preservadas.

O site está no mesmo servidor do aplicativo; ainda não foi publicado em domínio externo. BAT e manifesto abrem `/app`. Links antigos de confirmação/recuperação do Supabase que chegam à raiz são encaminhados ao app preservando código, parâmetros e fragmento. Antigos fragmentos das abas também chegam ao app.

## Sete perguntas por versão

1. Sintomas quando fica sem beber/reduz, com orientação imediata se houver sinais de urgência.
2. Objetivo pessoal neste momento.
3–5. Três perguntas específicas do caminho escolhido: consumo/controle; vontade/resposta; gatilhos/pressão; impactos/apoio; ou tentativas/retomada.
6. Gasto médio com bebidas por saída, em reais, editável e com atalhos.
7. Saídas por semana: 0–7 como atalhos e frequência personalizada de 0 a 14, incluindo frações.

A tela seguinte traz o resultado. É possível voltar e corrigir sem perder as outras respostas. Nenhuma opção começa marcada. As respostas antigas não são transformadas em dias sem consumo.

## Resultado e limites

Não são AUDIT nem outro instrumento validado. Não atribuem diagnóstico, nível de alcoolismo, gravidade clínica ou probabilidade inventada. O resultado descreve situações relatadas e sugere próximos passos. Precisa de revisão profissional antes de divulgação ampla.

Sinais de urgência são destacados assim que selecionados, sem esperar a conclusão. No resultado de urgência, a comparação financeira fica oculta. Sintomas possíveis de abstinência geram orientação para avaliação antes de mudar o consumo; nenhum protocolo de desintoxicação ou redução doméstica foi criado.

A projeção considera apenas bebidas nas saídas, não consumo em casa, alimentação ou transporte. Mostra mês médio, média diária e ano, com cenários de redução de 25%, 50% ou 100% dessas saídas. A hipótese de assinatura é centralizada em `MONTHLY_PRICE`, no módulo do quiz; R$ 20 não é preço final, oferta nem cobrança. Economia líquida negativa é mostrada como custo adicional, sem ocultar o resultado.

Fórmulas: ano = gasto × frequência × 52; mês = ano ÷ 12; dia = ano ÷ 365; cenário = mês × (1 − redução) + assinatura; economia líquida = mês × redução − assinatura. Usar o app não garante redução ou economia. A simulação financeira não recomenda alterar consumo sem avaliação clínica.

## Salvamento e privacidade

Responder não exige login. As respostas ficam em memória durante o preenchimento; não são enviadas ao servidor ou guardadas automaticamente no armazenamento do navegador.

Ao solicitar salvar sem sessão, uma cópia temporária fica em `sessionStorage` da aba por até duas horas; o usuário entra em `/app?next=quiz`, retorna ao resultado e confirma o salvamento. A expiração é verificada ao carregar; o navegador também encerra esse armazenamento ao fechar a aba. Não há respostas em URLs, publicidade ou rastreamento.

`POST /api/quiz` valida as sete respostas no servidor e grava em `desato_quiz_answers`, tabela já existente com RLS. Há uma resposta mais recente por versão e conta; repetir substitui a resposta dessa versão. `GET /api/quiz` consulta somente os registros da conta autenticada. `user_id` e versão são definidos pelo servidor.

A calculadora do aplicativo só é atualizada se a pessoa marcar essa opção. Quiz e calculadora são duas gravações; se só a segunda falhar, a mensagem explica que o quiz foi salvo e a calculadora não foi atualizada. Não há alteração de check-ins ou importação do histórico local para uma conta.

## Arquivos e verificação

Páginas em `public/site.html` e `public/quiz.html`; estilos em `public/site.css`; conteúdo, validação e cálculos em `public/js/quiz-model.js`; fluxo em `public/js/quiz.js`. O mesmo modelo é usado na validação do servidor. Acesso pelo Perfil foi adicionado.

Verificações automatizadas incluem cálculos, zero/economia negativa, validação, sete perguntas nos cinco caminhos, urgência imediata, navegação/correção pelo DOM, rotas públicas, autenticação, isolamento de resultados e preservação dos dados atuais. Não foi feita inspeção visual no navegador, conforme preferência do usuário. Não houve envio de e-mails ou criação de usuários reais de teste.

Validação final: 49 testes passaram após renomear a pasta e simplificar a tela de acesso. Login/cadastro/recuperação não exibem reenvio de confirmação ou atalhos de apoio/SOS.
