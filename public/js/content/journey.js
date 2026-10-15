// Jornada de 30 dias: uma lição curta e uma tarefa prática por dia.
// Conteúdo educativo; não substitui acompanhamento profissional.
export const JOURNEY_WEEKS = [
  { from: 1, to: 7, title: 'Entender o seu hábito' },
  { from: 8, to: 14, title: 'Vontade e gatilhos' },
  { from: 15, to: 21, title: 'Corpo e rotina' },
  { from: 22, to: 30, title: 'Pessoas e futuro' }
];

export const JOURNEY = [
  {
    day: 1, title: 'Por que você quer mudar?', minutes: 3,
    lesson: [
      'Toda mudança começa com um motivo que é seu. Não o motivo que os outros esperam, mas aquele que pesa quando você está sozinho.',
      'Motivos concretos funcionam melhor que motivos gerais. “Quero ter saúde” ajuda pouco; “quero acordar sem dor de cabeça no sábado e levar meu filho ao parque” ajuda muito.',
      'Nos dias difíceis, é esse motivo que você vai reler. Por isso vale escrever com as suas palavras.',
      'Um cuidado importante: se você bebe muito todos os dias, parar de uma vez pode causar tremores, suor e até riscos sérios. Nesse caso, converse com um médico antes de parar.'
    ],
    task: 'Escreva o seu motivo principal, do jeito mais concreto que conseguir.',
    question: 'Qual é o seu motivo para mudar?'
  },
  {
    day: 2, title: 'Parar ou diminuir?', minutes: 2,
    lesson: [
      'Existem dois caminhos possíveis: parar totalmente ou beber menos, com regras claras. Os dois são válidos.',
      'Parar costuma ser mais simples para quem perde o controle depois do primeiro copo. Diminuir exige limites bem definidos: quantos dias, quantas doses, em quais lugares.',
      'Você pode começar por um caminho e mudar depois. O importante é saber o que você está tentando fazer neste mês.'
    ],
    task: 'Decida o seu objetivo para os próximos 30 dias.',
    question: 'Nos próximos 30 dias, você vai parar ou diminuir? Se for diminuir, qual o limite?'
  },
  {
    day: 3, title: 'Seus 3 gatilhos', minutes: 3,
    lesson: [
      'Gatilho é tudo aquilo que costuma vir logo antes da vontade de beber: um lugar, um horário, uma pessoa, um sentimento.',
      'Os mais comuns são: fim do expediente, sexta-feira, estresse, tédio, solidão, discussões e encontros com amigos que bebem.',
      'Quando você conhece seus gatilhos, a vontade deixa de pegar você de surpresa. Você passa a ver a situação chegando.'
    ],
    task: 'Pense nas últimas vezes em que bebeu e anote o que aconteceu logo antes.',
    question: 'Quais são os seus 3 principais gatilhos?'
  },
  {
    day: 4, title: 'O que o álcool fazia por você', minutes: 2,
    lesson: [
      'Ninguém bebe à toa. O álcool costuma cumprir alguma função: relaxar, se soltar, esquecer um problema, preencher o tempo.',
      'Se você só tirar o álcool e não colocar nada no lugar, essa necessidade continua lá, pedindo atenção.',
      'O caminho é encontrar outras formas de conseguir o mesmo efeito: relaxar com um banho, se soltar com atividades em grupo, preencher a noite com algo que você gosta.'
    ],
    task: 'Escolha uma necessidade e uma forma nova de atendê-la.',
    question: 'O que o álcool fazia por você, e o que pode fazer isso no lugar dele?'
  },
  {
    day: 5, title: 'Limpe o ambiente', minutes: 2,
    lesson: [
      'Força de vontade cansa. O ambiente, não. Se a bebida está na geladeira, você vai precisar decidir dizer não toda vez que abrir a porta.',
      'Tirar as bebidas de casa, ou ao menos de vista, reduz muito o número de decisões difíceis no dia.',
      'Vale também deixar à mão o que você quer beber no lugar: água com gás, suco, chá gelado, refrigerante zero.'
    ],
    task: 'Tire de casa, ou de vista, as bebidas alcoólicas e deixe uma alternativa pronta.',
    question: 'O que você mudou no seu ambiente hoje?'
  },
  {
    day: 6, title: 'A vontade passa', minutes: 2,
    lesson: [
      'A vontade de beber funciona como uma onda: cresce, chega ao pico e depois diminui. Na maioria das vezes, isso acontece em 15 a 30 minutos.',
      'O problema é que, no pico, parece que ela nunca vai passar. Mas passa, mesmo que você não beba.',
      'Cada vez que você atravessa uma onda sem beber, a próxima tende a ser um pouco mais fraca. O SOS do aplicativo foi feito para esses minutos.'
    ],
    task: 'Da próxima vez que sentir vontade, olhe o relógio e perceba quanto tempo ela dura.',
    question: 'Como você costuma reagir quando a vontade aparece?'
  },
  {
    day: 7, title: 'Sua primeira semana', minutes: 2,
    lesson: [
      'Uma semana é tempo suficiente para começar a perceber padrões. Olhe para trás com curiosidade, não com cobrança.',
      'Se você bebeu em algum dia, isso não apaga os outros. O que importa é o que você aprendeu com aquele momento.',
      'Reconheça o que deu certo. Mesmo um dia sem beber em uma semana difícil já mostra que é possível.'
    ],
    task: 'Olhe o seu calendário no Início e repare nos dias que deram certo.',
    question: 'O que funcionou melhor para você nesta primeira semana?'
  },
  {
    day: 8, title: 'Desejo não é ordem', minutes: 2,
    lesson: [
      'Sentir vontade de beber não significa que você precisa beber. Um pensamento é só um pensamento.',
      'Uma técnica simples é dar nome ao que está acontecendo: “estou sentindo vontade de beber”. Essa pequena distância já tira parte da força do impulso.',
      'Você pode observar a vontade como observa a chuva pela janela: ela está lá, mas você não precisa sair na chuva.'
    ],
    task: 'Quando a vontade vier, diga para si mesmo: “estou sentindo vontade, e ela vai passar”.',
    question: 'Que frase você vai usar para se lembrar de que vontade não é ordem?'
  },
  {
    day: 9, title: 'Como dizer não', minutes: 3,
    lesson: [
      'Recusar fica muito mais fácil quando a frase já está pronta. Na hora, sem preparo, a gente cede para evitar o desconforto.',
      'Frases curtas funcionam melhor: “Hoje não, valeu.” “Tô de boa com refri.” “Tô dando um tempo.” Você não precisa explicar a sua história.',
      'Se insistirem, repita a mesma frase com calma. Quem respeita você vai entender.'
    ],
    task: 'Escolha a sua frase de recusa e treine dizê-la em voz alta.',
    question: 'Qual a sua frase pronta para recusar uma bebida?'
  },
  {
    day: 10, title: 'Fim do dia, fim do hábito', minutes: 2,
    lesson: [
      'Para muita gente, o momento mais difícil é o fim do expediente. O corpo associa “acabou o trabalho” com “hora de beber”.',
      'A solução é criar um novo ritual para esse horário: um banho, uma caminhada, um lanche gostoso, uma série, uma ligação.',
      'Nos primeiros dias o novo ritual parece estranho. Depois de algumas semanas, ele vira o novo automático.'
    ],
    task: 'Defina o que você vai fazer assim que terminar o trabalho hoje.',
    question: 'Qual será o seu novo ritual de fim de dia?'
  },
  {
    day: 11, title: 'Estresse sem álcool', minutes: 3,
    lesson: [
      'O álcool alivia o estresse por pouco tempo e depois devolve com juros: sono pior, ansiedade no dia seguinte, mais irritação.',
      'Formas rápidas de baixar o estresse: respirar devagar por um minuto, sair para andar, tomar um banho, escrever o que está incomodando.',
      'Nem todo problema se resolve hoje. Às vezes, o objetivo é só atravessar a noite sem piorar as coisas.'
    ],
    task: 'Escolha uma forma de aliviar o estresse e use hoje, mesmo que esteja tudo bem.',
    question: 'O que mais ajuda você a se acalmar quando o dia é pesado?'
  },
  {
    day: 12, title: 'Sono sem álcool', minutes: 3,
    lesson: [
      'O álcool dá sono, mas piora a qualidade do sono. Você apaga mais rápido e acorda no meio da noite, cansado.',
      'Nas primeiras noites sem beber, o sono pode ficar agitado. É normal e costuma melhorar em poucos dias.',
      'Ajuda muito: horário fixo para deitar, celular longe da cama, quarto escuro e evitar café à tarde.'
    ],
    task: 'Escolha um horário para deitar hoje e deixe o celular longe da cama.',
    question: 'Como está o seu sono desde que você começou?'
  },
  {
    day: 13, title: 'Tédio e tempo livre', minutes: 2,
    lesson: [
      'Quando o álcool sai, sobra tempo. E tempo vazio é um dos gatilhos mais traiçoeiros.',
      'Vale ter uma lista de coisas que você gosta de fazer: esportes, jogos, cozinhar, consertar algo, ver amigos, aprender alguma coisa.',
      'Não precisa ser algo grandioso. Precisa estar pronto para usar quando a noite parecer longa.'
    ],
    task: 'Monte uma lista com 5 coisas para fazer quando estiver sem nada para fazer.',
    question: 'Quais são as 5 coisas da sua lista?'
  },
  {
    day: 14, title: 'Duas semanas', minutes: 2,
    lesson: [
      'Duas semanas de esforço merecem reconhecimento. Muita gente já percebe diferença no sono, na disposição e no bolso.',
      'Se ainda está difícil, não significa que não está funcionando. Hábitos antigos levam tempo para enfraquecer.',
      'Olhe para os seus gatilhos do dia 3. Algum deles já ficou mais fácil?'
    ],
    task: 'Escolha uma pequena recompensa para comemorar estas duas semanas.',
    question: 'Qual mudança você já percebeu em você?'
  },
  {
    day: 15, title: 'Água, comida e vontade', minutes: 2,
    lesson: [
      'Fome e sede às vezes se disfarçam de vontade de beber. Com o estômago vazio, a vontade fica mais forte.',
      'Comer nos horários e ter água por perto reduz bastante os picos de vontade, principalmente no fim da tarde.',
      'Um lanche antes de sair de casa ou do trabalho é uma das estratégias mais simples e eficazes.'
    ],
    task: 'Deixe um lanche pronto para o fim da tarde de hoje.',
    question: 'Em que horário do dia você sente mais fome ou vontade?'
  },
  {
    day: 16, title: 'Vontade de doce', minutes: 2,
    lesson: [
      'Muita gente sente vontade de doce ao parar de beber. O álcool tem bastante açúcar, e o corpo sente falta.',
      'Isso é normal e não precisa de culpa. Uma fruta, um chocolate pequeno ou um suco podem ajudar nas primeiras semanas.',
      'Com o tempo, essa vontade tende a diminuir sozinha.'
    ],
    task: 'Deixe uma opção doce que você goste em casa para os momentos de vontade.',
    question: 'O que você vai ter à mão quando bater vontade de doce?'
  },
  {
    day: 17, title: 'Movimento', minutes: 2,
    lesson: [
      'Atividade física ajuda a reduzir o estresse, melhora o sono e diminui a vontade de beber logo depois.',
      'Não precisa ser academia. Uma caminhada de 15 minutos já faz diferença no humor.',
      'O melhor exercício é aquele que você consegue repetir.'
    ],
    task: 'Faça 15 minutos de qualquer movimento hoje.',
    question: 'Que atividade você consegue encaixar na sua semana?'
  },
  {
    day: 18, title: 'Seu dinheiro', minutes: 2,
    lesson: [
      'O dinheiro que ia para a bebida agora fica com você. Mas, se não tiver destino, ele some sem que você perceba.',
      'Dar um objetivo para esse dinheiro deixa a mudança mais visível: uma viagem, uma dívida paga, um presente, uma reserva.',
      'No Início, você acompanha quanto deixou de gastar.'
    ],
    task: 'Escolha para onde vai o dinheiro que você está economizando.',
    question: 'O que você vai fazer com o dinheiro que deixou de gastar?'
  },
  {
    day: 19, title: 'Os pensamentos que enganam', minutes: 3,
    lesson: [
      'Alguns pensamentos aparecem para justificar a bebida: “só uma não faz mal”, “eu mereço”, “hoje é diferente”, “já estraguei mesmo”.',
      'Eles parecem razoáveis na hora, mas costumam levar ao mesmo lugar de sempre.',
      'Reconhecer o pensamento é metade do caminho. A outra metade é responder: “eu mereço, sim, e por isso não vou beber”.'
    ],
    task: 'Identifique o pensamento que mais aparece antes de você beber.',
    question: 'Qual pensamento costuma te convencer a beber, e como você vai responder a ele?'
  },
  {
    day: 20, title: 'Uma noite inteira', minutes: 2,
    lesson: [
      'As noites costumam ser o momento mais difícil. Por isso vale planejar a noite antes que ela chegue.',
      'Um bom plano tem três partes: o que você vai fazer, o que vai beber no lugar e a quem pode chamar se ficar difícil.',
      'Na aba Situações, você monta planos assim para cada tipo de momento.'
    ],
    task: 'Monte um plano em Situações para a situação mais difícil da sua semana.',
    question: 'Qual noite da semana é a mais difícil para você?'
  },
  {
    day: 21, title: 'Três semanas', minutes: 2,
    lesson: [
      'Três semanas é o tempo em que muitos hábitos novos começam a ficar mais naturais.',
      'Repare no que já virou rotina sem esforço e no que ainda pede atenção.',
      'O objetivo não é ser perfeito. É ser um pouco mais consistente a cada semana.'
    ],
    task: 'Escreva uma coisa que ficou mais fácil desde o começo.',
    question: 'O que ficou mais fácil desde o dia 1?'
  },
  {
    day: 22, title: 'Contar ou não contar', minutes: 3,
    lesson: [
      'Você não precisa contar para todo mundo. Mas ter ao menos uma pessoa que saiba do seu objetivo ajuda muito.',
      'Escolha alguém que respeite a sua decisão, não alguém que vá cobrar ou julgar.',
      'Uma frase simples resolve: “Estou dando um tempo na bebida e queria que você soubesse”.'
    ],
    task: 'Escolha uma pessoa de confiança para contar sobre o seu objetivo.',
    question: 'Quem pode ser a sua pessoa de apoio?'
  },
  {
    day: 23, title: 'Amigos que bebem', minutes: 3,
    lesson: [
      'Você não precisa se afastar dos amigos. Mas talvez precise mudar onde e como encontra eles por um tempo.',
      'Sugira programas em que a bebida não é o centro: almoço, cinema, esporte, café, jogo.',
      'Quem gosta de você vai querer estar junto, com ou sem copo na mão.'
    ],
    task: 'Proponha um programa sem bebida para alguém esta semana.',
    question: 'Qual programa sem bebida você pode propor?'
  },
  {
    day: 24, title: 'Festas e eventos', minutes: 3,
    lesson: [
      'Eventos com bebida são os testes mais difíceis. Por isso funcionam melhor com plano.',
      'Antes de ir: decida o que vai beber, tenha a frase de recusa pronta e defina a hora de ir embora.',
      'Ter um copo de algo na mão também evita que ofereçam bebida o tempo todo.'
    ],
    task: 'Monte em Situações o seu plano para a próxima festa ou encontro.',
    question: 'Qual o próximo evento difícil na sua agenda?'
  },
  {
    day: 25, title: 'Se você beber', minutes: 3,
    lesson: [
      'Um deslize não é o fim do caminho. É uma informação sobre uma situação que ainda precisa de preparo.',
      'O perigo não é o deslize, é o pensamento “já estraguei tudo, então tanto faz”. Esse pensamento transforma um dia ruim em uma semana ruim.',
      'Depois de um deslize: registre sem se julgar, entenda o que aconteceu antes e ajuste um detalhe do plano.'
    ],
    task: 'Escreva o que você vai fazer no dia seguinte, caso aconteça um deslize.',
    question: 'Se você beber, qual será o seu primeiro passo para retomar?'
  },
  {
    day: 26, title: 'Quem você está se tornando', minutes: 2,
    lesson: [
      'Mudanças duradouras costumam vir junto com uma nova forma de se enxergar: de “alguém tentando não beber” para “alguém que cuida de si”.',
      'Cada dia que você escolhe diferente reforça essa nova imagem.',
      'Pense em como você quer ser lembrado pelas pessoas próximas daqui a um ano.'
    ],
    task: 'Descreva em uma frase a pessoa que você quer ser.',
    question: 'Quem você quer ser daqui a um ano?'
  },
  {
    day: 27, title: 'Prazeres novos', minutes: 2,
    lesson: [
      'Sem o álcool, outras coisas voltam a dar prazer: comida, sono, conversas, manhãs de fim de semana.',
      'Vale experimentar algo novo: um lugar, uma receita, um hobby que você sempre adiou.',
      'Quanto mais coisas boas sua vida tiver, menos espaço sobra para a bebida.'
    ],
    task: 'Faça algo novo e prazeroso esta semana.',
    question: 'O que você quer experimentar?'
  },
  {
    day: 28, title: 'Quando procurar ajuda', minutes: 3,
    lesson: [
      'Pedir ajuda é uma decisão de quem leva a mudança a sério, não sinal de fraqueza.',
      'Vale procurar um profissional se a vontade continua muito forte, se você tem sintomas físicos ao ficar sem beber ou se a tristeza e a ansiedade não passam.',
      'No Brasil, o SUS oferece atendimento pelos CAPS AD, e grupos como os Alcoólicos Anônimos são gratuitos. O CVV atende pelo 188, 24 horas.'
    ],
    task: 'Descubra onde fica o atendimento mais próximo de você, só para saber.',
    question: 'Se precisar de ajuda, a quem ou aonde você vai recorrer?'
  },
  {
    day: 29, title: 'Seu plano para o próximo mês', minutes: 3,
    lesson: [
      'O fim da jornada não é o fim do cuidado. Os próximos meses são quando o novo hábito se firma.',
      'Revise o seu objetivo do dia 2. Ele continua o mesmo? Quer ajustar?',
      'Mantenha o registro diário, os planos de Situações e o SOS por perto.'
    ],
    task: 'Defina o seu objetivo para o próximo mês.',
    question: 'Qual o seu objetivo para os próximos 30 dias?'
  },
  {
    day: 30, title: 'Trinta dias', minutes: 2,
    lesson: [
      'Você chegou ao fim da jornada. Independente de quantos dias foram sem beber, você dedicou 30 dias a cuidar de si.',
      'Releia o seu motivo do dia 1. Ele continua fazendo sentido?',
      'Agora é seguir, um dia de cada vez, usando tudo o que você aprendeu.'
    ],
    task: 'Escreva uma mensagem para você mesmo ler nos dias difíceis.',
    question: 'Que mensagem você quer deixar para o seu eu do futuro?'
  }
];

export const JOURNEY_LENGTH = JOURNEY.length;

// Libera um dia por vez: o próximo só abre no dia seguinte à última conclusão.
export function journeyStatus(journey = {}, today) {
  const done = Object.keys(journey).map(Number).filter(day => day >= 1 && day <= JOURNEY_LENGTH).sort((a, b) => a - b);
  let completed = 0;
  while (done.includes(completed + 1)) completed += 1;
  const stamp = completed ? new Date(journey[completed]?.completedAt) : null;
  const last = stamp && !Number.isNaN(stamp.getTime())
    ? `${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(stamp.getDate()).padStart(2, '0')}`
    : null;
  const finished = completed >= JOURNEY_LENGTH;
  const waiting = !finished && Boolean(last) && last >= today;
  return { completed, current: finished ? JOURNEY_LENGTH : completed + 1, finished, waiting, percent: Math.round(completed / JOURNEY_LENGTH * 100) };
}
