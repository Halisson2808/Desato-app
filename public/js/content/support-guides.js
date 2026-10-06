// Orientações práticas de organização e comunicação; não são protocolos de tratamento.
export const supportGuides = [
  {
    id: 'pressao-amigos', category: 'situation', icon: 'people', title: 'Estão insistindo para eu beber',
    description: 'Prepare uma resposta que respeite sua decisão.', readTime: '2 min',
    intro: 'Você pode comunicar sua decisão com uma frase curta. Escolha uma resposta que conseguiria dizer de verdade, sem precisar justificar toda a sua história.',
    steps: [
      { title: 'Escolha sua frase', text: '“Hoje não vou beber.” ou “Vou ficar com outra opção hoje.” Adapte para o seu jeito de falar.' },
      { title: 'Combine apoio antes', text: 'Se quiser, conte sua decisão a alguém que estará com você: “Se insistirem, me ajuda a mudar de assunto?”' },
      { title: 'Prepare uma saída', text: 'Pense em como encerrar a conversa ou deixar o encontro se ficar desconfortável. Você pode mudar seus planos.' }
    ],
    prompt: 'Qual frase você quer ter pronta quando alguém oferecer bebida?',
    suggestion: { situation: 'Quando insistirem para eu beber', firstAction: 'Dizer: hoje não vou beber; vou escolher outra opção.', exit: 'Mudar de assunto ou sair do encontro se ficar desconfortável.', help: 'Pedir a alguém que respeite e apoie minha decisão.' }
  },
  {
    id: 'festa-encontro', category: 'situation', icon: 'calendar', title: 'Vou a uma festa ou encontro',
    description: 'Decida seus próximos passos antes de sair.', readTime: '2 min',
    intro: 'Preparar alguns detalhes antes do encontro deixa suas opções mais claras. Você também pode escolher não ir ou ficar por menos tempo.',
    steps: [
      { title: 'Decida o que pedir', text: 'Pense em uma opção sem álcool que você gostaria de escolher e deixe uma frase de recusa pronta.' },
      { title: 'Organize a volta', text: 'Defina um horário aproximado de saída e uma forma de voltar que não dependa de alguém que esteja bebendo.' },
      { title: 'Tenha uma alternativa', text: 'Escolha o que fazer se quiser mudar de plano: ir embora, encontrar outra pessoa ou trocar o lugar do encontro.' }
    ],
    prompt: 'O que você vai fazer se o encontro ficar difícil para você?',
    suggestion: { situation: 'Quando eu estiver em uma festa com bebida', firstAction: 'Pedir uma opção sem álcool e lembrar da decisão que tomei antes de sair.', exit: 'Ir embora no horário combinado ou antes, se eu precisar.', help: 'Avisar alguém de confiança sobre meu plano.' }
  },
  {
    id: 'depois-trabalho', category: 'situation', icon: 'home', title: 'Costumo beber depois do trabalho',
    description: 'Prepare uma alternativa para esse horário.', readTime: '2 min',
    intro: 'Observe a sequência do seu fim de dia: por onde você passa, o que faz ao chegar e em que momento costuma escolher beber. Use isso para preparar uma mudança concreta.',
    steps: [
      { title: 'Localize o momento', text: 'Escolha um ponto específico da sequência, como passar por um bar ou chegar em casa e abrir uma bebida.' },
      { title: 'Planeje a primeira ação', text: 'Escolha algo possível ao terminar o trabalho: tomar banho, preparar uma refeição ou conversar com alguém.' },
      { title: 'Deixe o plano fácil de seguir', text: 'Organize o que você vai precisar para essa alternativa. Se fizer sentido, combine outro trajeto ou outro encontro.' }
    ],
    prompt: 'Qual será sua primeira ação quando terminar o trabalho?',
    suggestion: { situation: 'Quando eu terminar o trabalho e pensar em beber', firstAction: 'Chegar em casa e preparar uma refeição antes de decidir o restante da noite.', exit: 'Escolher outro trajeto ou outro lugar para o encontro.', help: 'Combinar uma conversa com alguém nesse horário.' }
  },
  {
    id: 'momento-dificil', category: 'situation', icon: 'pause', title: 'Estou estressado ou ansioso',
    description: 'Escolha uma pausa e uma próxima ação possível.', readTime: '1 min',
    intro: 'Comece pelo que você consegue fazer agora. Não precisa resolver todos os problemas nesta tela. Se quiser seguir um exercício guiado, o SOS está disponível.',
    steps: [
      { title: 'Dê nome ao momento', text: 'Escreva ou pense em uma frase curta sobre o que está acontecendo, sem cobrar de si uma explicação completa.' },
      { title: 'Escolha uma pausa', text: 'Se puder, interrompa por alguns minutos a atividade ou conversa que está difícil e vá para um lugar em que se sinta confortável.' },
      { title: 'Defina o próximo passo', text: 'Escolha uma ação pequena: conversar com alguém, fazer uma atividade simples ou abrir o SOS. Para questões de saúde, procure acompanhamento profissional.' }
    ],
    prompt: 'O que está ao seu alcance nos próximos minutos?', primaryRoute: 'sos', primaryLabel: 'Abrir SOS',
    suggestion: { situation: 'Quando eu estiver estressado e pensar em beber', firstAction: 'Fazer uma pausa e abrir o SOS.', exit: 'Ir para um lugar em que eu me sinta confortável.', help: 'Dizer a alguém: hoje está difícil, você pode conversar comigo?' }
  },
  {
    id: 'retomar', category: 'situation', icon: 'return', title: 'Já bebi e quero retomar',
    description: 'Registre o que aconteceu e escolha o próximo passo.', readTime: '1 min',
    intro: 'Um registro de consumo não apaga os registros anteriores. Você pode registrar o dia e usar o que percebeu para ajustar seu plano.',
    steps: [
      { title: 'Registre sem se julgar', text: 'Abra o Início para registrar como foi o dia. Uma anotação é opcional; escreva apenas se isso for útil para você.' },
      { title: 'Observe a situação', text: 'Pense no que aconteceu antes: onde você estava, com quem e qual era o momento. Não transforme essa observação em cobrança.' },
      { title: 'Ajuste uma coisa', text: 'Escolha uma mudança possível no seu plano ou prepare um pedido de apoio. Você não precisa reformular toda a sua vida agora.' }
    ],
    prompt: 'O que você gostaria de preparar de outro jeito para uma próxima situação parecida?', primaryRoute: 'inicio', primaryLabel: 'Ir para meu registro',
    suggestion: { situation: 'Quando eu quiser retomar depois de beber', firstAction: 'Registrar o dia e revisar uma coisa no meu plano.', exit: '', help: 'Conversar com alguém que possa me apoiar sem julgamento.' }
  },
  {
    id: 'pedir-ajuda', category: 'situation', icon: 'conversation', title: 'Não sei como pedir ajuda',
    description: 'Encontre uma frase para começar a conversa.', readTime: '2 min',
    intro: 'Você pode começar com um pedido específico, sem contar tudo de uma vez. Escolha uma pessoa ou profissional com quem gostaria de conversar.',
    steps: [
      { title: 'Escolha o que pedir', text: 'Pode ser companhia em um encontro, uma conversa em um horário difícil ou ajuda para procurar acompanhamento.' },
      { title: 'Prepare a primeira frase', text: '“Estou tentando mudar meu consumo de álcool e queria conversar.” ou “Você pode ficar comigo um pouco? Hoje está difícil.”' },
      { title: 'Busque outro caminho se precisar', text: 'Se a primeira pessoa não puder ajudar, você pode tentar outra pessoa ou procurar um profissional de saúde para conversar sobre sua situação.' }
    ],
    prompt: 'Qual pedido concreto você gostaria de fazer?',
    suggestion: { situation: 'Quando eu precisar de apoio e não souber como pedir', firstAction: 'Enviar: estou tentando mudar meu consumo e queria conversar.', exit: '', help: 'Pedir companhia ou ajuda para procurar acompanhamento.' }
  },
  {
    id: 'meus-gatilhos', category: 'guide', icon: 'compass', title: 'Reconhecer meus gatilhos',
    description: 'Observe os momentos que você associa à vontade de beber.', readTime: '2 min',
    intro: 'Aqui, “gatilho” é uma forma de nomear uma situação que você percebe como difícil. O aplicativo não identifica causas nem faz diagnósticos por você.',
    steps: [
      { title: 'Observe uma situação', text: 'Escolha um episódio e descreva lugar, horário e companhia, sem concluir que eles explicam tudo.' },
      { title: 'Procure algo concreto', text: 'O que você consegue preparar de outro jeito? Um convite, um trajeto ou a primeira atividade ao chegar em casa?' },
      { title: 'Experimente e revise', text: 'Salve uma resposta possível no seu plano. Depois, você pode ajustar o que não funcionou para você.' }
    ],
    prompt: 'Qual situação você quer preparar primeiro?',
    suggestion: { situation: '', firstAction: '', exit: '', help: '' }
  },
  {
    id: 'minha-decisao', category: 'guide', icon: 'conversation', title: 'Conversar sobre minha decisão',
    description: 'Comunique o que você quer e o apoio de que precisa.', readTime: '1 min',
    intro: 'Você escolhe com quem compartilhar sua decisão e quanto quer contar. Uma conversa pode começar por um limite ou por um pedido simples.',
    steps: [
      { title: 'Diga o que decidiu', text: '“Estou mudando meu consumo e hoje não vou beber.” Use uma frase que combine com seu objetivo.' },
      { title: 'Faça um pedido claro', text: '“Não me ofereça bebida hoje.” ou “Vamos combinar algo que não envolva beber?”' },
      { title: 'Defina seu limite', text: 'Se houver insistência, você pode repetir sua decisão, mudar a conversa ou se afastar da situação.' }
    ],
    prompt: 'Qual limite você quer comunicar?',
    suggestion: { situation: 'Quando eu precisar comunicar minha decisão', firstAction: 'Dizer minha decisão com uma frase curta.', exit: 'Encerrar a conversa se meu limite não for respeitado.', help: 'Pedir que não me ofereçam bebida.' }
  },
  {
    id: 'acompanhamento', category: 'guide', icon: 'support', title: 'Procurar acompanhamento',
    description: 'Prepare uma conversa com um profissional de saúde.', readTime: '1 min',
    intro: 'O Desato ajuda a organizar registros e próximos passos. Decisões sobre tratamento devem ser discutidas com um profissional de saúde.',
    steps: [
      { title: 'Anote sua dúvida', text: 'O que você gostaria de conversar sobre seu consumo? Você pode levar uma pergunta ou um relato breve.' },
      { title: 'Prepare um pedido', text: '“Quero conversar sobre meu consumo de álcool e entender que acompanhamento posso procurar.”' },
      { title: 'Escolha o próximo passo', text: 'Procure um profissional ou serviço de saúde para orientação sobre sua situação. Você pode pedir a alguém que ajude a organizar essa conversa.' }
    ],
    prompt: 'Qual pergunta você gostaria de levar para essa conversa?',
    suggestion: { situation: 'Quando eu precisar de orientação sobre meu consumo', firstAction: 'Procurar um profissional de saúde e levar minha principal dúvida.', exit: '', help: 'Pedir ajuda para organizar a conversa ou marcar atendimento.' }
  }
];
