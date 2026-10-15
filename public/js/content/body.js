// Marcos do corpo sem álcool. Variam de pessoa para pessoa; textos evitam promessas.
export const BODY_MILESTONES = [
  { days: 1, title: 'Hidratação', text: 'O corpo começa a se reidratar e a ressaca fica para trás.' },
  { days: 3, title: 'Sono', text: 'O sono começa a se reorganizar. As primeiras noites podem ser agitadas, e isso é normal.' },
  { days: 7, title: 'Disposição', text: 'Muitas pessoas acordam mais descansadas e com mais energia de manhã.' },
  { days: 14, title: 'Estômago e pele', text: 'Menos azia e inchaço. A pele tende a ficar mais hidratada.' },
  { days: 30, title: 'Fígado', text: 'A gordura acumulada no fígado começa a diminuir em quem bebia com frequência.' },
  { days: 60, title: 'Pressão e peso', text: 'Pressão arterial tende a melhorar, e menos calorias vazias ajudam no peso.' },
  { days: 90, title: 'Mente', text: 'Atenção, memória e humor costumam estar mais estáveis.' },
  { days: 365, title: 'Um ano', text: 'Riscos de doenças do fígado, do coração e de alguns cânceres ficam menores.' }
];

export const BODY_TIPS = [
  { title: 'Vontade de doce', text: 'É comum ao parar de beber, porque o álcool tem muito açúcar. Uma fruta ou um chocolate pequeno ajudam nas primeiras semanas.' },
  { title: 'Fome no fim da tarde', text: 'Estômago vazio aumenta a vontade de beber. Faça um lanche antes de sair do trabalho.' },
  { title: 'Sono agitado', text: 'Normal nas primeiras noites. Horário fixo, quarto escuro e celular longe da cama ajudam.' },
  { title: 'Água por perto', text: 'Às vezes a sede se disfarça de vontade de beber. Um copo de água gelada ajuda a separar uma da outra.' }
];

export const WATER_GOAL = 8;

// Sequência atual de dias registrados sem beber (hoje conta se já tiver registro).
export function cleanStreak(checkins = {}, today) {
  const toISO = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const [y, m, d] = today.split('-').map(Number);
  const cursor = new Date(y, m - 1, d, 12);
  if (!checkins[today]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (checkins[toISO(cursor)]?.status === 'clean') {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
