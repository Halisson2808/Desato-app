# Desato App — Planejamento da aba Apoio

Registrado em 01/10/2026 a pedido do usuário. **Primeira versão implementada**: navegação, guias, favoritos e plano pessoal. Validada pelo código e por testes, sem abrir navegador. O texto abaixo registra as decisões de produto e os critérios desta versão.

## Objetivo

Acrescentar ajuda diretamente ligada à mudança no consumo de álcool: reconhecer situações difíceis, preparar uma resposta e encontrar orientações práticas. A pessoa deve sair da aba com uma ação escolhida ou um plano salvo.

Nome proposto na navegação: **Apoio**. Título da tela: **Apoio para o seu dia**.

## Navegação proposta

**Início · Rotina · SOS · Alimentação · Apoio**.

Apoio substitui Perfil no quinto botão da navegação móvel e da sidebar. Perfil continua acessível pelo avatar do header; sua rota e seus dados permanecem disponíveis. A logo continua abrindo o Início.

## Papel de cada área

| Área | Pergunta que responde |
| --- | --- |
| Início | Como estão meus registros e meu progresso? |
| Rotina | O que posso organizar no meu dia? |
| SOS | O que faço neste momento de vontade? |
| Alimentação | Como organizo refeições, água e compras? |
| Apoio | Como me preparo e lido com as situações que me levam a beber? |

Apoio reúne preparação e orientação. O exercício para o momento imediato permanece no SOS, com acesso direto a partir de Apoio quando fizer sentido.

## Estrutura da primeira versão

### 1. Ajuda para a situação de hoje

Primeiro bloco da tela: **“O que está mais difícil hoje?”**. Oferecer seis situações fáceis de reconhecer. Cada uma abre um guia curto, com uma explicação, três sugestões concretas e uma próxima ação. Textos de cerca de um a dois minutos de leitura.

| Situação | Conteúdo previsto | Próxima ação |
| --- | --- | --- |
| Amigos insistem para eu beber | Frases para recusar, combinar limites e preparar uma saída do encontro | Escolher uma frase e salvar no plano |
| Vou a uma festa ou encontro | Decidir previamente o que pedir, como ir embora e a quem pedir companhia | Preparar meu plano para o encontro |
| Costumo beber depois do trabalho | Reconhecer horário, lugar e sequência que antecedem o consumo; preparar uma alternativa | Definir minha primeira ação ao chegar |
| Estou estressado ou ansioso | Organizar uma pausa e escolher uma ação simples; sem tratar o app como acompanhamento clínico | Escolher minha próxima ação ou abrir SOS |
| Já bebi e quero retomar | Registrar sem julgamento, observar o que aconteceu e escolher o próximo passo | Registrar o dia no Início e revisar o plano |
| Não sei como pedir ajuda | Exemplos de como iniciar uma conversa e informações sobre buscar acompanhamento profissional | Preparar uma frase para pedir ajuda |

Esses guias são orientação editorial futura, não protocolos médicos já validados. A versão final do conteúdo relacionado à saúde deve usar fontes verificadas e revisão adequada antes da publicação. Não incluir instruções de medicamentos, redução clínica do consumo ou manejo de abstinência por conta própria.

### 2. Meu plano para momentos difíceis

Bloco persistente e editável. Evitar obrigar a pessoa a escrever um diário extenso. Um plano pode ser montado em quatro passos curtos:

1. **Quando fica difícil?** Escolher situação e, opcionalmente, descrever em uma frase.
2. **Qual é minha primeira ação?** Escolher uma alternativa concreta ou escrever uma.
3. **Como posso sair dessa situação?** Registrar uma saída ou mudança de ambiente possível.
4. **Como vou pedir companhia ou ajuda?** Texto opcional, sem exigir cadastro de telefone ou acesso aos contatos.

Resumo visível: **“Se acontecer X, vou fazer Y.”** Botões: **Editar plano** e **Abrir SOS**.

Exemplo ilustrativo: “Se me oferecerem bebida no encontro, vou dizer que hoje não vou beber, pedir outra opção e sair se ficar desconfortável.” Não preencher como se fosse uma resposta dada pela pessoa.

Os guias podem oferecer “Usar no meu plano”, abrindo o formulário com uma sugestão editável. Só gravar após confirmação da própria pessoa.

### 3. Guias curtos

Biblioteca pequena de conteúdo selecionado. Além das seis situações, incluir três temas iniciais:

- Reconhecer meus gatilhos: pessoas, lugares, horários e situações que a própria pessoa percebe.
- Conversar sobre minha decisão: frases e maneiras de pedir apoio sem exposição obrigatória.
- Procurar acompanhamento: explicar o papel do aplicativo e orientar a busca de serviços apropriados, após verificar as informações para o público atendido.

Cada guia tem título claro, tempo aproximado de leitura e indicação de ação prática. Permitir favoritos para reencontrar os úteis. Não usar feed infinito, desafios punitivos, rankings ou avaliações que classifiquem a pessoa como “fraca”, “fracassada” ou “curada”.

## Exemplo de tela

Título: **Apoio para o seu dia**.

Texto curto: “Encontre uma orientação para o que você está vivendo e prepare seu próximo passo.”

Ordem do conteúdo:

1. O que está mais difícil hoje? — situações em cartões.
2. Meu plano — resumo salvo ou convite “Preparar meu plano”.
3. Guias curtos — conteúdos por situação, com filtro de favoritos.

No celular, lista ou grade de duas colunas quando houver largura suficiente; no desktop, aproveitar a largura sem transformar o texto em linhas extensas. Evitar adicionar subabas na primeira versão.

## Linguagem

Usar “pessoa”, “mudança no consumo”, “momento difícil” e “retomar”. Não chamar o usuário de “viciado” na interface. Não usar tom de cobrança, culpabilização ou frases motivacionais sem orientação prática.

Exemplos de rótulos:

- “Meus gatilhos”, em vez de “Meus fracassos”.
- “Hoje bebi. Qual é meu próximo passo?”, em vez de “Perdi tudo”.
- “Preparar meu plano”, em vez de “Garantir que nunca mais vou beber”.

## Integração com o aplicativo

- O guia de retomada abre o registro do Início; não altera check-ins sem ação da pessoa.
- Apoio pode abrir SOS, preservando os cinco passos lineares.
- Favoritos e plano são distintos das tarefas de rotina.
- Não inferir diagnósticos, nível de dependência ou causas emocionais a partir de check-ins.
- Personalização inicial é escolhida pela pessoa; não depende de monitoramento de atividade ou inteligência artificial.
- Conteúdo estático pode entrar no cache da interface. Plano e favoritos seguem a persistência do aplicativo, sem prometer sincronização offline ainda inexistente.

## Dados e arquivos previstos para implementação

Modelo sugerido: `support.plan` com situação, primeira ação, saída, pedido de ajuda opcional e data de atualização; `support.favoriteGuideIds` com IDs dos guias selecionados.

Adicionar campos por migração compatível com arquivos antigos, sem reiniciar o histórico. Validar tamanho e tipo dos textos na API. Quando houver contas, autorizar cada leitura e escrita pelo usuário correspondente. O plano contém informações pessoais e não deve ser incluído em logs ou páginas públicas.

Arquivos previstos:

- `public/js/views/support.js`: tela, guias e edição do plano.
- `public/js/content/support-guides.js`: conteúdo estruturado com IDs estáveis e referência de revisão.
- `public/js/app.js`: rota Apoio e substituição do botão Perfil na navegação.
- `public/js/api.js` e `server.js`: persistência do plano e favoritos, com validação.
- `public/styles.css`: cartões, leitura e formulário responsivo.
- `public/sw.js`: cache dos novos módulos.
- `test/api.test.js`: integração e preservação dos dados antigos.

## Critérios de aceite

- Cinco botões principais com Apoio no lugar de Perfil; Perfil acessível pelo avatar no celular e desktop.
- Seis situações levam a guias com ações claras, sem caminhos vazios.
- A pessoa consegue criar, revisar e salvar um plano; ele permanece após reabrir o aplicativo.
- Guias favoritos podem ser encontrados e desmarcados.
- Links para Início e SOS funcionam; os cinco passos do SOS são preservados.
- Sem check-ins automáticos, conteúdo pessoal inventado ou promessas de cura.
- Migração preserva perfil, registros, rotina, água, compras e sessões existentes.
- Erros de gravação são informados; controles têm rótulos e acesso pelo teclado.

## Fora da primeira versão

Comunidade, chat com outros usuários, atendimento humano, chatbot clínico e indicação automática de tratamento. Exigem decisões próprias de operação, privacidade e conteúdo. O valor inicial da aba vem dos guias úteis e do plano pessoal.

## Resultado da implementação

Primeira versão concluída com 19 testes aprovados (API e renderização). Layout e sintaxe foram verificados pelo código; a aparência em dispositivos ainda não foi conferida no navegador, conforme orientação do usuário. Nenhum registro pessoal foi alterado na implementação.
