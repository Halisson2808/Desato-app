# Oferta do Desato — 06/10/2026

## Direção da oferta

A promessa central é ajudar a pessoa a organizar os primeiros passos para mudar sua relação com o álcool. A economia reforça o valor da assinatura depois que o objetivo pessoal já foi identificado. O aplicativo não deve ser apresentado como uma garantia de redução do consumo.

Sequência implementada para avaliação:

1. **Abertura:** primeiro passo para deixar o álcool para trás. Sem dinheiro ou quantidade de perguntas no texto inicial.
2. **Perguntas pessoais:** objetivo, dificuldades e o que a pessoa deseja recuperar.
3. **Perguntas financeiras:** gasto por saída e frequência, no final.
4. **Tela de impacto:** gasto estimado mensal e anual, média diária secundária e ligação com o objetivo escolhido.
5. **Tela de oferta:** objetivo em destaque, benefícios concretos do Desato, preço de referência e comparação financeira.
6. **Checkout futuro:** depende das condições comerciais e da integração de pagamento; ainda não criado.

## Tela de impacto

Mensagem principal: “Essas saídas têm um custo que se acumula.”

Mostrar mês e ano com clareza, mantendo a base da estimativa visível. A ponte para a oferta é: “O dinheiro é uma parte. O seu objetivo é maior.” Em seguida, recuperar o objetivo escolhido e oferecer o botão “Conhecer meu próximo passo”.

Para quem informa gasto zero, a apresentação deve reconhecer essa resposta e continuar pelos benefícios pessoais, sem inventar perda financeira.

## Oferta: organizar o valor antes de mostrar o preço

O título usa a resposta da própria pessoa: “Recuperar o controle”, “Beber menos”, “Parar de beber” ou “Manter sua mudança”. A explicação é: “Tenha um lugar para organizar sua mudança e escolher o próximo passo, todos os dias.”

Benefícios apresentados, todos existentes no aplicativo:

| Necessidade | Entrega do Desato |
| --- | --- |
| Entender como os dias estão sendo | Check-in e histórico de dias com ou sem consumo |
| Preparar uma situação difícil | Plano pessoal com primeira ação, saída e pedido de apoio |
| Ter uma ação quando surgir vontade | SOS sequencial com cinco exercícios |
| Organizar o dia a dia | Rotina de hábitos editáveis |
| Saber o que fazer em momentos específicos | Guias sobre convites, festas, estresse e retomada |

As escolhas do checklist aparecem junto ao objetivo para relacionar esses benefícios ao que a pessoa quer recuperar. A oferta apresenta recursos de acompanhamento, sem afirmar resultados clínicos ou funcionalidades futuras como já disponíveis.

## Preço e comparação

O preço mensal definido pelo usuário é **R$ 29,90/mês**. `OFFER.priceConfirmed = true`, centralizado em `public/js/quiz-model.js`. A apresentação identifica o plano como assinatura mensal; o checkout continua pendente.

Exemplo de argumento, com gasto hipotético de R$ 200/mês:

| Item | Cenário mensal |
| --- | --- |
| Gasto atual com bebidas | R$ 200 |
| Gasto se houver redução de 50% | R$ 100 |
| Assinatura mensal | R$ 29,90 |
| Gasto com bebidas + assinatura | R$ 129,90 |
| Economia potencial líquida | R$ 70,10 |

Texto: “Nesse cenário, a redução do gasto cobriria a assinatura e ainda deixaria R$ 70,10 disponíveis por mês.”

Essa conta representa redução do gasto nas saídas, e não “50% de melhora do vício”. O cenário depende de mudança real, mantendo o gasto médio nas saídas restantes; não é um resultado automaticamente causado pelo aplicativo.

A tela permite comparar 25%, 50% e 100% de redução das saídas. Desconta o preço de referência da economia e mostra custo adicional quando a redução projetada não o cobre. Não apresenta economia negativa como benefício.

Comparação visual simplificada: três cartões verticais — gasto hoje, gasto no cenário já incluindo Desato e valor que poderia sobrar. Dentro do segundo cartão, separar bebidas + assinatura. Os controles usam “25% menos”, “Metade” e “Sem essas saídas”. Exemplo verificado: R$ 650 hoje → R$ 325 em bebidas + R$ 29,90 Desato = R$ 354,90 no cenário → R$ 295,10 de economia possível.

## Fechamento a definir

Quando a assinatura estiver pronta, a chamada recomendada é **“Quero começar com o Desato”**. Hoje a apresentação termina em “Assinatura em preparação”, sem pagamento ou botão que leve a um destino fictício.

Antes de transformar a proposta em venda, definir:

- Integrar o preço definido de R$ 29,90 por mês ao checkout.
- Recursos incluídos e eventual diferença entre planos.
- Condições de acesso, cancelamento e atendimento.
- Destino do checkout e confirmação do pagamento.

O preço foi definido; coleta de dados e checkout continuam adiados conforme o pedido do usuário. O próximo passo é definir as condições comerciais e integrar a cobrança.
