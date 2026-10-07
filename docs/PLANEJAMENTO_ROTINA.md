# Rotina → Meu plano: proposta para o Desato

Data: 06/10/2026. Escopo solicitado: análise e planejamento. Nenhuma tela, tarefa ou registro foi alterado nesta etapa.

## Decisão recomendada

Transformar a aba **Rotina** em **Meu plano**, com foco em preparar os momentos em que a pessoa costuma beber e executar ações concretas nesses momentos. A função merece permanecer na navegação se entregar essa preparação e esse acompanhamento.

O nome Meu plano descreve uma decisão pessoal e ajuda a compreender a tela na primeira visita. Uma lista genérica de hábitos oferece pouco valor específico para o objetivo do Desato.

## Problemas encontrados no código

- Manhã/Tarde/Noite escondem parte das tarefas em abas; a pessoa vê somente uma fração do dia.
- As mesmas tarefas aparecem na lista para concluir e novamente na lista inteira de gerenciamento.
- O destaque inicial é a porcentagem concluída, antes de explicar qual ação faz sentido hoje.
- Os seis hábitos iniciais são água, café da manhã, caminhada, ocupar a mente, jantar e desacelerar. São predominantemente autocuidado, sem preparação pessoal para situações de bebida.
- Criar um hábito pede título, período e até um ícone, mas não orienta a escolha de uma resposta para uma situação difícil.
- Há explicações gerais e avisos que aumentam o texto sem ajudar a escolher a próxima ação.

Arquivos analisados: `public/js/views/routine.js`, padrões de `server.js`, navegação de `public/js/app.js`, guias de Apoio e pesquisa já documentada no projeto.

## Papel de cada aba

| Área | Entrega principal |
| --- | --- |
| Início | Registrar consumo, calendário e evolução |
| Meu plano | Preparar um momento difícil e executar ações escolhidas |
| SOS | Conduzir exercícios quando surgir vontade de beber |
| Apoio | Ensinar estratégias por situações e orientar a preparação do plano |

Apoio já possui um plano pessoal com situação, primeira ação, saída e pedido de apoio. Esse conteúdo deve ser aproveitado como base de Meu plano. Apoio pode manter o atalho para preparar ou consultar o plano, direcionando à mesma informação e edição. Não criar dois planos concorrentes.

O SOS continua sequencial. Meu plano oferece acesso direto a ele quando essa for a ação escolhida; concluir um hábito ou abrir o SOS não registra automaticamente um dia sem consumo.

## Experiência de primeira visita

Título: **Prepare seu próximo passo**.

Texto: “Em qual momento costuma ficar mais difícil não beber?”

Oferecer opções reconhecíveis, por exemplo: depois do trabalho; festas/encontros; quando está sozinho; momentos de estresse; outro momento. Esta escolha orienta sugestões, sem atribuir uma causa ou gravidade à pessoa.

Em seguida, escolher **uma primeira ação**. Mostrar duas ou três sugestões relacionadas ao momento e permitir escrever outra. Terminar com **Salvar meu plano**. A pessoa já sai com algo utilizável; tarefas adicionais são opcionais.

Se houver plano salvo em Apoio, apresentá-lo diretamente com Editar meu plano. Não exigir preencher novamente. Não importar respostas anônimas do funil para uma conta; a coleta do funil continua adiada e não há vínculo automático autorizado.

## Tela de uso diário

### 1. Meu momento de hoje

Um card compacto com situação e primeira ação, em linguagem direta:

“Depois do trabalho, costumo pensar em beber.”

“Meu primeiro passo: tomar banho assim que chegar.”

Mostrar horário somente se a pessoa tiver informado. Botão de edição discreto. Sem várias perguntas, textos longos ou porcentagens nesse card.

### 2. Minhas ações

Uma lista visível, com **até três ações ativas** na proposta inicial. Cada item tem:

- Ação curta e concreta.
- Contexto ou horário secundário, quando houver.
- Um controle de conclusão fácil de entender.
- Menu discreto para editar/pausar, sem repetir a lista em outro bloco.

Organizar as ações para preparação, resposta e revisão, em uma única lista. Não criar novas abas Antes/Durante/Depois que voltem a esconder tarefas.

Exemplo para quem costuma beber depois do trabalho:

| Quando | Ação escolhida |
| --- | --- |
| Antes de sair | Preparar o que vou fazer ao chegar em casa |
| No horário difícil | Fazer a alternativa que escolhi; se precisar, abrir o SOS |
| Mais tarde | Revisar se meu plano fez sentido e ajustar uma coisa |

As alternativas devem ser escolhidas pela pessoa e conectadas à situação. Caminhar, conversar ou fazer uma atividade podem entrar quando fazem sentido no plano, com contexto explícito. Não repetir automaticamente a mesma rotina para todos.

### 3. Se meu plano não for suficiente

Um próximo passo pequeno, aproveitando a alternativa de saída e o pedido de apoio já salvos. Exemplo: “Se continuar difícil, vou mudar de ambiente ou conversar com a pessoa que escolhi.” O SOS pode ser um botão nessa área. Evitar transformar a tela em uma nova biblioteca de ferramentas.

### 4. Ajustar o plano

Link discreto para escolher outra ação ou rever a situação. Pausadas ficam na edição. O estado vazio explica o benefício e oferece um botão; não abre com uma grade sem conteúdo.

## Manter, tirar e acrescentar

| Manter | Tirar da tela principal | Acrescentar |
| --- | --- | --- |
| Ações pessoais editáveis | Lista de gerenciamento duplicada | Situação difícil e primeira ação visíveis |
| Conclusão por dia | Ícone como campo obrigatório de escolha | Sugestões relacionadas à situação |
| Pausar e reativar | Abas por período como navegação principal | Plano alternativo conectado ao existente |
| Histórico das tarefas | Porcentagem grande no topo | Primeira visita com uma escolha simples |
| Autocuidado escolhido pelo usuário | Seis hábitos genéricos obrigatórios | Acesso ao SOS quando fizer sentido |

Refeições e hidratação podem continuar como autocuidado secundário, quando escolhidas pela pessoa. Não são o centro da proposta desta aba.

## Conteúdo e qualidade

A pesquisa anterior do projeto já reuniu orientação sobre reconhecer situações, preparar estratégias e revisar respostas. Isso é uma base para a direção de produto; não comprova eficácia clínica da nova tela. [NIAAA: estratégias para vontade de beber](https://rethinkingdrinking.niaaa.nih.gov/tools/worksheets-more/how-stop-alcohol-cravings).

O conteúdo precisa ser específico, curto e executável. Usar “abrir meu plano antes do encontro” em vez de “cuidar de mim”; “combinar uma conversa no horário difícil” em vez de “ocupar a mente”. Não medir dependência pela conclusão da lista nem tratar tarefa concluída como comprovação de abstinência.

Orientações clínicas de interrupção do consumo, medicamentos ou manejo de abstinência não fazem parte desta rotina. Revisão profissional do conteúdo continua pertinente antes de divulgação ampla.

## Implementação proposta

**Primeira entrega:** simplificar a interface, aproveitar `support.plan`, apresentar tarefas ativas numa lista única, tirar duplicação e reduzir os campos de edição. Reutilizar as APIs existentes e não alterar banco apenas para mudar a organização visual.

**Entrega seguinte:** sugestões por situação e ações específicas de preparação/resposta/revisão. Definir persistência de campos novos, como horário opcional e resultado percebido da estratégia, antes de apresentá-los como salvos. O esquema atual das tarefas aceita somente manhã/tarde/noite: não gravar categorias novas nesse campo por conveniência.

**Depois de avaliar o uso:** revisão breve do que a pessoa tentou e do que quer ajustar; lembretes opcionais somente se houver implantação real de notificações. Não lançar novas funcionalidades como benefícios já disponíveis.

## Preservar dados existentes

Conservar títulos, tarefas personalizadas, estados pausados, histórico de conclusão e plano já salvo. Não substituir tarefas atuais em massa. Oferecer às contas existentes a escolha de adaptar o plano ou manter suas ações. As sugestões iniciais novas podem mudar para novos cadastros quando essa etapa for implementada.

A rotina do Início deve acompanhar o nome e os critérios novos para não mostrar números contraditórios. A oferta deve ser atualizada somente depois da implementação, descrevendo o que o produto realmente oferece.

## Como decidir se vale manter a aba

Observar se uma pessoa na primeira visita consegue responder: qual é meu momento difícil, qual ação vou tentar e como posso mudar meu plano. A tela deve permitir executar isso sem procurar em várias abas ou criar um hábito do zero sem orientação.

Testar tarefas de preparação, conclusão, edição e retomada com pessoas do público-alvo. Se a função continuar pouco utilizada ou duplicar Apoio, integrar o plano dentro de Apoio e retirar Rotina da navegação, preservando os dados.

Minha primeira escolha é manter a função como **Meu plano** e avaliar sua utilidade. A implementação atual permanece intacta até a próxima etapa solicitada.
