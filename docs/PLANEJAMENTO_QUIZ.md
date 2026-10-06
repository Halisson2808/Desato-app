# Desato App — Planejamento do quiz

Registrado em 01/10/2026 a pedido do usuário. Atualização de 06/10/2026: interface refeita como funil direto, com sete perguntas e cinco versões por links, sem catálogo ou navegação externa. Coleta no banco e checkout foram adiados expressamente pelo usuário; a interface atual não apresenta assinatura hipotética na comparação. Detalhes em [SITE_E_QUIZZES.md](SITE_E_QUIZZES.md). Os requisitos abaixo guardam o planejamento original e a base das fórmulas; não são todos requisitos da tela atual.

## Marca aprovada

- Nome principal: **Desato**.
- Nome para descoberta e pesquisa: **Desato App**.
- Usar Desato na interface e Desato App no título público, metadados, páginas de apresentação e descrição do produto, com escrita consistente.
- O objetivo é permitir que as pessoas pesquisem “Desato App”. Metadados locais não garantem indexação ou posição no Google. Ao definir o domínio e publicar a página pública, completar URL canônica, URLs de compartilhamento e os recursos de indexação correspondentes. Nenhum domínio foi presumido.

## Pedido que deve ser preservado

O quiz terá várias perguntas sobre a pessoa e seus hábitos. Dentro dele haverá duas perguntas financeiras consecutivas. Logo após a segunda, uma tela visual mostrará gasto médio diário e mensal, comparação com o custo do aplicativo e potencial de economia. Essa tela deve ajudar a pessoa a enxergar o impacto financeiro das saídas para beber.

O usuário sugeriu aproximadamente R$ 20 por mês, ou um pouco mais, para a assinatura. Esse valor é provisório e deve ser configurável, nunca espalhado como constante em várias telas.

## Pergunta 1 — Gasto por saída

Texto: **“Quando você sai para beber, quanto gasta, em média, por saída?”**

Incluir uma ajuda curta: “Informe o valor que costuma gastar nessas saídas.” Definir com consistência se o valor inclui apenas bebidas ou também outros gastos associados; não assumir que alimentação e transporte desapareceriam completamente se a pessoa deixasse de beber.

Proposta de entrada: campo em reais, com atalhos de **R$ 25, R$ 50, R$ 100, R$ 200 e R$ 500**, mais possibilidade de editar qualquer valor. Não deixar resposta preenchida sem escolha da pessoa.

Essa opção mantém a rapidez de botões e permite um cálculo mais preciso do que faixas amplas como R$ 100–500. Se o desenho final usar faixas, torná-las não sobrepostas, pedir confirmação do valor usado no cálculo e identificar o resultado como aproximado. Não tratar o limite máximo da faixa como gasto real.

Validação: valor monetário finito e não negativo, até duas casas decimais; formato pt-BR; permitir R$ 0; informar erro junto ao campo. Alinhar os limites com a API da calculadora existente.

## Pergunta 2 — Frequência

Texto: **“Em uma semana típica, quantas vezes você sai para beber?”**

Botões de **1 a 7 vezes por semana**, como solicitado. Acrescentar “Não saio toda semana” como alternativa para não forçar uma resposta falsa; essa alternativa poderá abrir frequência personalizada. Não confundir vezes com dias nem presumir que a pessoa só possa sair uma vez por dia.

Validação: frequência finita e não negativa. O caminho principal cobre 1–7; respostas personalizadas precisam de conversão consistente para frequência semanal, compatível com os limites da calculadora.

## Tela seguinte — Retrato financeiro visual

Não chamar de diagnóstico médico. Título sugerido: **“Veja quanto essas saídas representam no seu mês”**.

Mostrar, nesta ordem:

1. Gasto atual estimado por mês, em destaque.
2. Média diária e estimativa anual como dados secundários.
3. Comparação visual entre gasto atual, custo da assinatura e gasto projetado no cenário escolhido.
4. Economia potencial líquida, já descontando a assinatura.
5. Explicação curta das hipóteses e possibilidade de voltar e corrigir as respostas.

Usar barras comparáveis, valores escritos e rótulos claros, sem depender apenas das cores. Evitar transformar a estimativa em dívida, cobrança ou economia já conquistada.

## Fórmulas

Variáveis:

- `g`: gasto médio por saída, em reais.
- `f`: frequência semanal.
- `p`: preço mensal vigente ou provisório da assinatura, identificado na tela.
- `r`: proporção de redução considerada no cenário, de 0 a 1.

Usar a mesma base da calculadora existente:

- Gasto semanal: `g × f`.
- Gasto anual: `g × f × 52`.
- Gasto mensal médio: `g × f × 52 / 12`.
- Média diária: `g × f × 52 / 365`.
- Gasto mensal projetado com a redução: `gastoMensal × (1 − r)`.
- Total mensal projetado incluindo o aplicativo: `gastoMensal × (1 − r) + p`.
- Economia potencial líquida mensal: `gastoMensal × r − p`.

Arredondar apenas na apresentação, com duas casas decimais. Não misturar mês de quatro semanas com média de 52 semanas por ano. Não mostrar a média diária como se fosse uma compra feita todos os dias.

## Como apresentar a economia sem prometer resultado automático

As duas respostas calculam o gasto atual. Elas não dizem qual será a redução real da pessoa. Usar cenários explícitos, por exemplo **reduzir 25%, 50% ou 100% dessas saídas**, mantendo as duas perguntas e exibindo os cenários na própria tela de resultado.

Texto de comparação: “Se você reduzir essas saídas em 50%, o gasto estimado seria X. Incluindo o Desato App por P/mês, a economia potencial seria Y/mês.”

No cenário de 100%: “Se você evitar todas essas saídas, mantendo essa mudança, a economia potencial seria X por mês, já descontando a assinatura.” Não afirmar que pagar pelo aplicativo produz essa redução automaticamente.

Não ocultar resultados negativos: se a economia bruta for menor que a assinatura, informar que o cenário não cobre o custo do aplicativo somente pela economia financeira. Com gasto zero, não inventar economia.

## Exemplo para validar na implementação

Respostas: R$ 80 por saída, 2 saídas por semana. Assinatura hipotética: R$ 20/mês.

| Indicador | Valor |
| --- | --- |
| Gasto semanal atual | R$ 160,00 |
| Gasto mensal médio atual | R$ 693,33 |
| Média diária atual | R$ 22,79 |
| Gasto anual atual | R$ 8.320,00 |
| Cenário de redução de 50%: saídas + assinatura por mês | R$ 366,67 |
| Cenário de redução de 50%: economia líquida por mês | R$ 326,67 |
| Cenário de redução de 100%: saídas + assinatura por mês | R$ 20,00 |
| Cenário de redução de 100%: economia líquida por mês | R$ 673,33 |

São projeções, não valores garantidos nem registros de economia já realizada.

## Integração futura com o sistema

- Reutilizar as respostas em `money.spendPerOuting` e `money.outingsPerWeek`, evitando fazer a pessoa preencher novamente a calculadora do Início.
- Permitir revisar as respostas antes de gravar e posteriormente no aplicativo.
- Não registrar dias sem consumo automaticamente ao terminar o quiz.
- Separar a projeção do quiz da economia estimada pelo histórico de check-ins existente.
- Centralizar as fórmulas e a configuração de preço para evitar divergência entre quiz, oferta e painel.
- Se houver oferta paga depois do resultado, mostrar o preço real e as condições da assinatura. A estimativa de R$ 20 não autoriza integração de cobrança ou publicação de oferta.
- Vincular respostas à conta quando autenticação e isolamento por usuário estiverem implementados.

## Critérios de aceite para quando o quiz for criado

- As duas perguntas financeiras aparecem consecutivamente e são seguidas pelo resultado visual.
- Campo monetário editável, frequência e cenários funcionam com teclado e celular.
- Erros são explicados; não se avança com entrada inválida.
- Voltar permite corrigir as respostas e recalcula todos os valores.
- Fórmulas reproduzem o exemplo acima e tratam zero, decimais e economia negativa.
- Assinatura é descontada da economia líquida e a hipótese de redução fica visível.
- Respostas alimentam a calculadora, sem alterar histórico pessoal.
- Marca aparece como Desato ou Desato App conforme o contexto definido.
