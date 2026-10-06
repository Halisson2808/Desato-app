# Desato: pesquisa e plano de foco do produto

Data: 06/10/2026. Avaliação pelo código e pesquisa científica e clínica. Nenhuma tela foi aberta ou alterada. As propostas abaixo ainda não foram implementadas e não representam validação clínica do Desato.

## Avaliação atual

O Desato tem uma boa base para evoluir: contas, dados separados por usuário, histórico editável, rotina personalizável, apoio por situações e SOS sequencial. Testes de software verificam funcionamento; não demonstram benefício para a saúde.

O foco do produto precisa melhorar. Alimentação ocupa uma das cinco abas principais, enquanto faltam registros estruturados da vontade de beber, seus gatilhos e dos resultados das estratégias. Minha recomendação é concentrar o produto nessas situações e manter alimentação como autocuidado secundário.

| Área no código | O que existe | Limitação para o objetivo do produto |
| --- | --- | --- |
| Início (`public/js/views/home.js`) | Consumi/não consumi, sequência, histórico, dinheiro e rotina | Não diferencia quantidade, contexto ou objetivo; a sequência domina a tela |
| Rotina | Hábitos editáveis por período | Padrões de organização e autocuidado; pouca ligação com situações pessoais de vontade de beber |
| SOS (`public/js/views/sos.js`) | Cinco passos em sequência | Salva intensidade fixa em 3 e `completed-flow`; não pergunta se ajudou |
| Final do SOS | Afirma que a pessoa já saiu do impulso inicial | Não há informação para afirmar isso; precisa verificar como ela está |
| Alimentação (`public/js/views/food.js`) | Refeições, quatro receitas, água e compras | Destaque maior que ferramentas específicas de mudança do consumo |
| Apoio | Situações, guias, favoritos e plano pessoal | Boa base, mas falta ligar planejamento, tentativa e revisão |
| Economia | Estimativa pelo gasto habitual e dias sem consumo | Não mede gasto real nem economia causada pelo aplicativo |

A avaliação não inclui observação de usuários ou uma auditoria visual em dispositivos. O público deste produto é álcool; referências a tabagismo não devem orientar os fluxos.

## Evidências e limites

### Comportamentos e situações ligados ao álcool

A NICE recomenda intervenções psicológicas voltadas a pensamentos, comportamentos, problemas e relações associados ao álcool, considerando necessidades e gravidade. Isso favorece um produto centrado na experiência de beber e tentar mudar. Exercícios do app não equivalem a uma terapia completa ministrada por profissionais. [NICE CG115](https://www.nice.org.uk/guidance/cg115/chapter/Recommendations).

### Gatilhos e estratégias práticas

O NIAAA orienta reconhecer gatilhos internos e externos, acompanhar vontades e preparar respostas. Inclui apoio de alguém de confiança, alternativas de atividade e saída de situações difíceis. Isso sustenta a direção de um registro breve ligado a um plano; não demonstra a eficácia de cada funcionalidade proposta. [NIAAA: vontade de beber](https://rethinkingdrinking.niaaa.nih.gov/tools/worksheets-more/how-stop-alcohol-cravings).

### Consumo e habilidades

O NIAAA apresenta acompanhamento de quantidade, objetivos e preparação para recusar ofertas. Para o Desato, proponho registros opcionais mais informativos e pequenos ensaios de situações reais, além de artigos. Medidas de bebida e conversões precisam de revisão para o público brasileiro: unidades britânicas e porções servidas não são intercambiáveis. [Estratégias de mudança](https://rethinkingdrinking.niaaa.nih.gov/thinking-about-change/tips-try), [ensaio de recusa](https://rethinkingdrinking.niaaa.nih.gov/tools/worksheets-more/building-your-drink-refusal-skills/script-your-no).

### Retomada após consumo

O NIAAA destaca progresso de longo prazo, redução da culpa, busca de apoio e aprendizado sobre o contexto. Isso favorece um fluxo de retomada, preservando o histórico. Orientações sobre parar de beber precisam respeitar a segurança clínica descrita adiante. [NIAAA: retomada](https://rethinkingdrinking.niaaa.nih.gov/tools/worksheets-more/recovering-drinking-episode-when-your-goal-quit).

### O que sabemos sobre ferramentas digitais

- Uma revisão de 2023 com 80 estudos encontrou reduções médias em medidas de consumo na população geral. Isso não estabelece que um aplicativo isolado trate dependência grave. [Revisão e meta-análise](https://pubmed.ncbi.nlm.nih.gov/37864535/).
- No ensaio Drink Less de 2024, com 5.602 participantes, a análise principal não encontrou diferença estatisticamente significativa; uma análise de sensibilidade encontrou benefício. O resultado não deve ser apresentado como sucesso sem ressalvas. [Ensaio Drink Less](https://pubmed.ncbi.nlm.nih.gov/38685934/).
- O A-CHESS apresentou benefícios em pessoas que saíam de tratamento residencial, como complemento ao cuidado usual. Esse contexto difere de baixar um app sem acompanhamento. [Ensaio A-CHESS](https://pmc.ncbi.nlm.nih.gov/articles/PMC4016167/).
- Uma revisão de 2025 sobre álcool e outras drogas encontrou resultados favoráveis para intervenções remotas como complemento ao atendimento presencial, com limitações de viés; a substituição teve evidência inconclusiva. [Revisão de 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12215248/).
- Uma revisão de 2025 em países de renda baixa e média encontrou resultados promissores, mas amostras pequenas, seguimento curto e generalização limitada impediram conclusões firmes. Resultados estrangeiros não validam automaticamente o Desato no Brasil. [Revisão contextual](https://pmc.ncbi.nlm.nih.gov/articles/PMC11932145/).

As prioridades abaixo são interpretação de produto baseada nas fontes e no código; não são um ranking científico de eficácia de funcionalidades isoladas.

## Alimentação e rotina

Alimentação importa no cuidado geral; desnutrição e complicações relacionadas ao álcool podem exigir avaliação e tratamento específicos. Receitas genéricas não atendem a essas necessidades clínicas. Recomendo refeições e hidratação em Autocuidado, dentro do plano, sem alegações de desintoxicação, prescrição de suplementos ou metas universais. [NICE: complicações físicas](https://www.nice.org.uk/guidance/cg100/chapter/recommendations).

Preservar registros, favoritos e compras ao reorganizar a navegação. A rotina permanece, mas deve se conectar a horários difíceis, situações e alternativas escolhidas pela pessoa.

## Estrutura proposta

| Aba | Principal função |
| --- | --- |
| Hoje | Como estou e qual ação faz sentido agora? |
| Meu plano | Preparar situações difíceis; rotina e autocuidado |
| SOS | Lidar com a vontade de beber no momento |
| Apoio | Treinar habilidades e encontrar apoio humano |
| Progresso | Perceber padrões e revisar o plano |

Perfil continua no avatar. Métricas e calculadora vão para Progresso. SOS permanece linear, com avaliação breve antes/depois e acesso a ajuda, sem virar uma grade de ferramentas.

Ciclo proposto: **situação → vontade → ação → resultado → revisão do plano**.

Exemplo: reconhecer a vontade depois do trabalho, preparar uma alternativa para esse horário, experimentar a estratégia e registrar se ajudou. Na semana seguinte, revisar o plano. O sistema apresenta padrões dos registros sem declarar causas nem diagnosticar.

## Lista priorizada de implementação

### Prioridade 0 — segurança e público

1. Definir inicialmente adultos que buscam mudar o consumo de álcool. Distinguir apoio cotidiano de tratamento clínico, sem prescrever interrupção ou redução por conta própria.
2. Revisar conteúdo com profissional experiente em álcool e dependência; manter fonte, responsável e data de revisão.
3. Separar vontade de beber de possível abstinência física ou emergência. Parar ou reduzir abruptamente pode ser perigoso na dependência; confusão, alucinações ou convulsões exigem atendimento urgente. O app orienta busca de atendimento, sem protocolo doméstico de desintoxicação. [NHS: dependência e abstinência](https://www.nhs.uk/conditions/alcohol-use-disorder/).
4. Corrigir garantias no SOS e na economia. Concluir exercícios não garante melhora; quiz financeiro é simulação, não diagnóstico ou economia garantida pela assinatura.

### Prioridade 1 — experiência central

5. **Registro de vontade:** intensidade antes/depois, situação opcional, estratégia e percepção do resultado. Poucos toques, opção de pular e nenhum relato longo obrigatório.
6. **Check-in ampliado:** manter registro rápido; quantidade, bebida, contexto e gasto real opcionais. Sem registro não significa sem consumo; não inventar informações para dias antigos.
7. **Plano por situação:** quando pode acontecer, resposta escolhida, alternativa, saída e apoio desejado. Aproveitar o plano existente em Apoio.
8. **SOS com resultado:** verificar como a pessoa está, conduzir os passos e perguntar ao final. Se persistir a vontade, oferecer outro próximo passo e acesso a apoio. Permitir sair ou buscar ajuda a qualquer momento.
9. **Retomada após consumo:** acolher, preservar histórico, identificar aprendizado opcional e ajustar o plano. Não chamar automaticamente todo episódio de recaída ou fracasso.
10. **Apoio humano:** informações verificadas sobre UBS, CAPS/CAPS AD e outras opções pertinentes. CAPS acolhem em regime de porta aberta; disponibilidade local varia. Não prometer vaga ou serviço sem verificação. [Ministério da Saúde: CAPS](https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps/caps).

Critério de conclusão: preparar uma situação, usar uma estratégia, registrar resultado e revisar o plano por conta, sem perder histórico; o SOS não confunde emergência com exercício de autocuidado.

### Prioridade 2 — continuidade

11. **Revisão semanal:** situações, estratégias percebidas como úteis e uma alteração pequena do plano. Avisar quando há poucos dados para sugerir padrões.
12. **Treino por situações:** recusa de ofertas, festas, estresse após trabalho e pedido de apoio; atividades curtas sem se apresentar como psicoterapia.
13. **Progresso com várias medidas:** consumo, vontade, estratégias e metas pessoais. A sequência sem consumo não deve monopolizar o valor da pessoa.
14. **Lembretes opcionais:** horários e frequência controlados pelo usuário, conteúdo discreto na tela bloqueada. Planejar em Meu plano; não repor funções removidas do Perfil automaticamente.
15. **Quiz de entrada:** objetivos, situações e perguntas financeiras já planejadas. Eventual rastreio exige versão validada, revisão profissional e encaminhamento; não produzir diagnóstico automático.

### Preparação técnica para lançamento

16. Testar entrega real de e-mails e fluxos completos com contas autorizadas; publicar com HTTPS e redirecionamentos do domínio definitivo.
17. Preparar política de dados, consentimento pertinente, exclusão de conta/dados, backup e restauração. Minimizar informação sensível; não incluir relatos pessoais na telemetria por padrão.
18. Criar migrações para novos registros com isolamento por usuário, testes de permissões e preservação dos dados. Vontades e resultados precisam de campos próprios; não depositar todo o histórico em `action`.
19. Implementar assinatura após definir valor entregue, preço e condições; autorização de acesso pelo servidor. Não condicionar orientações urgentes de segurança à cobrança.

Banco, autenticação e vínculo por usuário já estão implementados: não são pendências novas.

## Adiar e validar

Deixar para depois mais receitas, compras ampliadas, fórum sem moderação, ranking de abstinência, chatbot como suposto terapeuta e geolocalização automática. Evitar promessas de cura ou recuperação em prazo fixo.

Observar um pequeno grupo de adultos em tarefas reais: registrar vontade, preparar situação, usar SOS e retomar após consumo. Entrevistas e testes de usabilidade verificam esforço e compreensão, não eficácia clínica.

No piloto, acompanhar conclusão, abandono, entendimento das orientações e aplicação de planos. Separar abertura do app de benefício em saúde. Mudanças autorrelatadas exigem medidas consistentes, participação voluntária e interpretação cuidadosa: antes/depois sozinho não prova efeito causado pelo Desato. Alegações de tratamento exigem avaliação clínica apropriada.

Primeira entrega recomendada: segurança e conteúdo revisados, navegação focada, registro de vontade, plano por situação, SOS com resultado e retomada após consumo. Depois, validar com usuários e acrescentar personalização.
