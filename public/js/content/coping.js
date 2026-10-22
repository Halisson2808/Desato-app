// Plano pessoal: a pessoa escolhe de 1 a 5 tarefas, com calma, e segue a mesma lista
// sempre que a vontade aparecer. Vontade forte vai para o SOS.
export const PLAN_MAX = 5;
export const TASK_MAX_LENGTH = 60;
// Depois desse tempo sem terminar, a próxima abertura começa uma vez nova, com tudo desmarcado.
export const SESSION_HOURS = 2;
// Tarefa pulada tantas vezes seguidas vira sugestão de troca.
export const SKIP_HINT = 3;

export const TASK_GROUPS = [
  { title: 'Movimento', tasks: ['Caminhar 15 minutos', 'Alongar por 5 minutos', 'Fazer 20 polichinelos', 'Sair de casa por um tempo'] },
  { title: 'Corpo', tasks: ['Beber um copo grande de água', 'Tomar um banho', 'Comer algo gostoso', 'Tomar um café ou chá'] },
  { title: 'Mente', tasks: ['Respirar fundo por 2 minutos', 'Escutar um podcast', 'Ouvir uma música que eu gosto', 'Ler algumas páginas', 'Escrever o que estou sentindo'] },
  { title: 'Fé', tasks: ['Orar', 'Ler um trecho da Bíblia', 'Meditar 5 minutos'] },
  { title: 'Pessoas', tasks: ['Mandar mensagem para alguém', 'Ligar para quem me apoia', 'Brincar com meu pet ou meus filhos'] },
  { title: 'Ocupar as mãos', tasks: ['Arrumar um cômodo', 'Cozinhar algo', 'Jogar alguma coisa', 'Assistir um episódio de série'] }
];

const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

// Valida a lista enviada; devolve o erro em texto para o servidor responder 400.
export function normalizeTasks(value) {
  if (!Array.isArray(value)) return { error: 'Envie a lista de tarefas.' };
  const tasks = [...new Set(value.map(clean))];
  if (tasks.some(task => !task || task.length > TASK_MAX_LENGTH)) return { error: `Cada tarefa precisa ter até ${TASK_MAX_LENGTH} caracteres.` };
  if (!tasks.length || tasks.length > PLAN_MAX) return { error: `Escolha de 1 a ${PLAN_MAX} tarefas.` };
  return { tasks };
}

// Só guarda marcações de tarefas que ainda estão no plano.
export const normalizeDone = (value, tasks) => Array.isArray(value) ? [...new Set(value.map(clean))].filter(task => tasks.includes(task)) : [];

export function activeSession(plan, now = new Date()) {
  const active = plan?.active;
  if (!active?.startedAt) return null;
  return now - new Date(active.startedAt) < SESSION_HOURS * 3600e3 ? active : null;
}

// Tarefas puladas por toda a sequência de usos recentes: sugerir trocar.
export const skippedTasks = plan => (plan?.tasks || []).filter(task => (plan.skips?.[task] || 0) >= SKIP_HINT);

// Atualiza contadores ao terminar uma vez. Fazer a tarefa zera a contagem de pulos dela.
export function finishStats(plan, done, passed) {
  const skips = {};
  for (const task of plan.tasks) skips[task] = done.includes(task) ? 0 : (plan.skips?.[task] || 0) + 1;
  return { uses: (plan.uses || 0) + 1, wins: (plan.wins || 0) + (passed ? 1 : 0), skips, active: null };
}
