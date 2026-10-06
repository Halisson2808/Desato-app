// Perguntas de reflexão: não são AUDIT, escala validada ou diagnóstico.
const choice = (id, title, options) => ({ id, title, type: 'choice', options: options.map(([value, label, concern = false]) => ({ value, label, concern })) });
const safety = choice('safety', 'Quando fica sem beber ou reduz o consumo, o que acontece?', [
  ['none', 'Não percebo sintomas físicos'], ['unsure', 'Não sei dizer'],
  ['withdrawal', 'Já tive tremores, suor ou mal-estar ao reduzir'],
  ['urgent', 'Estou com confusão, alucinações ou convulsão agora']
]);
const goal = choice('goal', 'O que você procura neste momento?', [
  ['understand', 'Entender minha relação com o álcool'], ['reduce', 'Buscar ajuda para reduzir'],
  ['quit', 'Buscar ajuda para parar'], ['continue', 'Manter uma mudança que já comecei']
]);
const spend = { id: 'spend', type: 'money', title: 'Quando sai para beber, quanto gasta em média por saída?', help: 'Informe só o gasto com bebidas nessas saídas. Se não sai, pode informar R$ 0.' };
const frequency = { id: 'frequency', type: 'frequency', title: 'Em uma semana típica, quantas vezes você sai para beber?', help: 'Escolha de 1 a 7 ou informe outra frequência. Consumo em casa não entra nesta conta.' };
export const MONTHLY_PRICE = 20; // Hipótese de planejamento; não há oferta ou cobrança.
export const OFFER = Object.freeze({ monthlyPrice: MONTHLY_PRICE, priceConfirmed: false, checkoutUrl: null });
export const QUIZZES = [
  { id: 'consumo', title: 'Minha relação com o álcool', subtitle: 'Frequência, limites e decisões.', number: '01', action: 'Observe quando você bebe mais do que pretendia e converse com um profissional sobre suas opções.', questions: [
    choice('drinking', 'Com que frequência você costuma beber?', [['rare','Menos de uma vez por semana'],['weekly','De 1 a 3 dias por semana'],['often','De 4 a 6 dias por semana'],['daily','Todos os dias',true]]),
    choice('limit', 'Com que frequência bebe mais do que pretendia?', [['never','Nunca ou quase nunca'],['sometimes','Às vezes',true],['often','Frequentemente',true]]),
    choice('control', 'Como tem sido tentar mudar o consumo?', [['notyet','Ainda não tentei'],['possible','Consigo manter as mudanças que escolho'],['difficult','Tenho dificuldade para reduzir ou parar',true]])
  ] },
  { id: 'vontade', title: 'Quando a vontade aparece', subtitle: 'Intensidade, frequência e respostas.', number: '02', action: 'Escolha uma resposta prática para um momento de vontade e registre se ela ajudou.', questions: [
    choice('urge', 'Como é a vontade de beber quando aparece?', [['low','Leve ou quase não aparece'],['medium','Perceptível, mas consigo lidar'],['strong','Muito forte ou difícil de lidar',true]]),
    choice('urgeFrequency', 'Com que frequência sente essa vontade?', [['rare','Raramente'],['weekly','Algumas vezes na semana'],['daily','Diariamente ou várias vezes ao dia',true]]),
    choice('response', 'O que costuma fazer quando sente vontade?', [['alternative','Procuro outra atividade'],['support','Peço apoio a alguém'],['drink','Acabo bebendo mesmo sem querer',true],['unsure','Ainda não encontrei uma estratégia']])
  ] },
  { id: 'gatilhos', title: 'As situações que pesam', subtitle: 'Ambientes, emoções e pressão social.', number: '03', action: 'Prepare uma alternativa e uma forma de sair da situação que você identificou.', questions: [
    choice('trigger', 'Em qual situação fica mais difícil evitar beber?', [['social','Festas ou encontros com amigos'],['stress','Estresse, ansiedade ou tristeza'],['habit','No horário ou lugar em que costumo beber'],['unsure','Ainda não reconheço uma situação']]),
    choice('pressure', 'Como reage quando alguém oferece bebida?', [['refuse','Consigo recusar'],['difficult','Tenho dificuldade em dizer não',true],['accept','Aceito mesmo quando não queria',true],['none','Isso não costuma acontecer']]),
    choice('plan', 'Você tem um plano para essas situações?', [['yes','Tenho uma estratégia que costumo usar'],['partial','Tenho algumas ideias'],['no','Ainda não preparei uma resposta']])
  ] },
  { id: 'impacto', title: 'O espaço que o álcool ocupa', subtitle: 'Consequências e apoio disponível.', number: '04', action: 'Escolha um impacto que quer mudar e procure apoio para definir um próximo passo.', questions: [
    choice('impact', 'Onde você mais percebe efeitos do consumo?', [['none','Não percebo ou ainda não sei'],['health','Sono, disposição ou saúde',true],['relations','Relacionamentos',true],['work','Trabalho, estudos ou compromissos',true],['money','Dinheiro',true]]),
    choice('missed', 'Já deixou de cumprir algo importante por causa da bebida?', [['no','Não'],['sometimes','Algumas vezes',true],['often','Isso acontece com frequência',true]]),
    choice('network', 'Com quem consegue conversar sobre isso?', [['trusted','Uma pessoa de confiança'],['professional','Um profissional ou grupo de apoio'],['alone','Ainda não tenho esse apoio']])
  ] },
  { id: 'retomada', title: 'Meu próximo começo', subtitle: 'Tentativas, aprendizado e próximos passos.', number: '05', action: 'Preserve o que já construiu e escolha um ajuste pequeno para a próxima situação.', questions: [
    choice('attempt', 'Você já tentou mudar sua relação com o álcool?', [['first','Estou começando agora'],['ongoing','Estou mantendo uma mudança'],['returned','Voltei a beber depois de tentar mudar',true]]),
    choice('obstacle', 'O que mais dificulta continuar?', [['urge','A vontade de beber',true],['environment','Ambientes e pessoas'],['emotions','Emoções difíceis'],['direction','Não saber qual é o próximo passo']]),
    choice('next', 'Qual apoio faria mais sentido agora?', [['plan','Preparar um plano para uma situação'],['skills','Aprender estratégias práticas'],['human','Conversar com alguém ou buscar atendimento'],['track','Acompanhar meu processo sem julgamento']])
  ] }
].map(quiz => ({ ...quiz, questions: [safety, goal, ...quiz.questions, spend, frequency] }));

export function validateAnswers(quizId, answers) {
  const quiz = QUIZZES.find(item => item.id === quizId);
  if (!quiz || !answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('Quiz inválido.');
  const clean = {};
  for (const question of quiz.questions) {
    const value = answers[question.id];
    if (question.type === 'choice') {
      if (!question.options.some(option => option.value === value)) throw new Error('Responda todas as perguntas.');
      clean[question.id] = value;
    } else {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > (question.type === 'money' ? 1000000 : 14) || (question.type === 'money' && Math.abs(value * 100 - Math.round(value * 100)) > 0.00001)) throw new Error('Confira o gasto e a frequência.');
      clean[question.id] = value;
    }
  }
  return clean;
}
export function financialProjection(spend, frequency, reduction = 0.5, price = MONTHLY_PRICE) {
  if (![spend, frequency, reduction, price].every(Number.isFinite) || spend < 0 || frequency < 0 || reduction < 0 || reduction > 1 || price < 0) throw new Error('Valores inválidos.');
  const annual = spend * frequency * 52;
  const monthly = annual / 12;
  return { weekly: spend * frequency, annual, monthly, daily: annual / 365, projected: monthly * (1 - reduction) + price, net: monthly * reduction - price };
}
export function evaluateQuiz(quizId, answers) {
  const clean = validateAnswers(quizId, answers);
  const quiz = QUIZZES.find(item => item.id === quizId);
  const concerns = quiz.questions.filter(question => question.options?.find(option => option.value === clean[question.id])?.concern).map(question => question.title);
  const urgent = clean.safety === 'urgent';
  const withdrawal = clean.safety === 'withdrawal';
  return { answers: clean, concerns, urgent, withdrawal,
    title: urgent ? 'Procure atendimento de urgência agora' : withdrawal ? 'Procure avaliação antes de mudar o consumo' : concerns.length ? 'Você relatou situações que merecem atenção' : 'Um ponto de partida para entender seu consumo',
    description: urgent ? 'Confusão, alucinações ou convulsões precisam de atendimento imediato. Este quiz e o SOS não atendem uma emergência.' : withdrawal ? 'Os sintomas relatados podem estar relacionados à abstinência. Não interrompa nem reduza abruptamente por conta própria; busque orientação profissional.' : concerns.length ? 'Suas respostas trazem dificuldades ou impactos relacionados ao álcool. Uma conversa com um profissional pode ajudar a avaliar a situação e as opções de cuidado.' : 'Estas perguntas não excluem problemas relacionados ao álcool. Use suas respostas para conversar sobre suas necessidades e preparar um próximo passo.',
    action: quiz.action };
}

// Funil v2: preserva os resultados v1 sem reinterpretar respostas antigas.
const changes = { id:'changes', type:'multiple', title:'O que você gostaria de recuperar no seu dia a dia?', help:'Pode escolher mais de uma opção.', options:[
  {value:'control',label:'Ter mais controle sobre minhas escolhas'}, {value:'money',label:'Parar de gastar tanto com bebida'},
  {value:'energy',label:'Acordar com mais disposição'}, {value:'relations',label:'Estar mais presente nas minhas relações'},
  {value:'routine',label:'Voltar a cuidar dos meus planos e da minha rotina'}
] };
const funnelGoal = {...goal,title:'O que você quer mudar na sua relação com o álcool?',options:[
  {value:'understand',label:'Quero recuperar o controle'}, {value:'reduce',label:'Quero beber menos'},
  {value:'quit',label:'Quero parar de beber'}, {value:'continue',label:'Quero manter a mudança que comecei'}
]};
export const FUNNELS = QUIZZES.map(quiz => ({id:quiz.id,title:quiz.title,questions:[funnelGoal,...quiz.questions.slice(2,5),changes,spend,frequency]}));
export function validateFunnel(quizId,answers,completed=false) {
  const quiz = FUNNELS.find(item => item.id === quizId);
  if (!quiz || !answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('Respostas inválidas.');
  if (Object.keys(answers).some(key => !quiz.questions.some(question => question.id === key))) throw new Error('Resposta desconhecida.');
  const clean = {};
  for (const question of quiz.questions) {
    if (!Object.hasOwn(answers,question.id)) {if (completed) throw new Error('Responda todas as etapas.');continue;}
    const value = answers[question.id];
    if (question.type === 'choice') {
      if (!question.options.some(option => option.value === value)) throw new Error('Escolha uma resposta válida.');
      clean[question.id] = value;
    } else if (question.type === 'multiple') {
      if (!Array.isArray(value) || !value.length || value.length > question.options.length || new Set(value).size !== value.length || !value.every(item => question.options.some(option => option.value === item))) throw new Error('Selecione pelo menos uma opção.');
      clean[question.id] = [...value];
    } else {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > (question.type === 'money' ? 1000000 : 14) || (question.type === 'money' && Math.abs(value*100-Math.round(value*100)) > .00001)) throw new Error('Confira o valor informado.');
      clean[question.id] = value;
    }
  }
  return clean;
}
