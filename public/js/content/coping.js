// Planos pessoais: a pessoa monta até 2 planos com nome, cada um com 1 a 5 tarefas,
// e segue a mesma lista sempre que a vontade aparecer.
export const PLAN_SLOTS = [1, 2];
export const PLAN_MAX = 5;
export const TASK_MAX_LENGTH = 60;
export const NAME_MAX_LENGTH = 40;
// Depois desse tempo sem terminar, a próxima abertura começa uma vez nova, com tudo desmarcado.
export const SESSION_HOURS = 2;
// Tarefa pulada tantas vezes seguidas vira sugestão de troca.
export const SKIP_HINT = 3;

export const TASK_GROUPS = [
  { title: 'Movimento', tasks: ['Caminhar 15 minutos', 'Alongar por 5 minutos', 'Fazer 20 polichinelos', 'Sair de casa por um tempo', 'Andar de bicicleta', 'Subir e descer escadas', 'Dançar uma música'] },
  { title: 'Corpo', tasks: ['Beber um copo grande de água', 'Tomar um banho', 'Comer algo gostoso', 'Tomar um café ou chá', 'Chupar uma bala ou chiclete', 'Lavar o rosto com água gelada', 'Deitar e descansar 10 minutos'] },
  { title: 'Mente', tasks: ['Respirar fundo por 2 minutos', 'Escutar um podcast', 'Ouvir uma música que eu gosto', 'Ler algumas páginas', 'Escrever o que estou sentindo', 'Lembrar por que eu quero parar', 'Ver quanto dinheiro já economizei', 'Fazer palavras cruzadas ou quebra-cabeça'] },
  { title: 'Fé', tasks: ['Orar', 'Ler um trecho da Bíblia', 'Meditar 5 minutos', 'Ouvir um louvor', 'Assistir uma pregação'] },
  { title: 'Pessoas', tasks: ['Mandar mensagem para alguém', 'Ligar para quem me apoia', 'Brincar com meu pet ou meus filhos', 'Visitar um amigo ou parente', 'Conversar com alguém da família'] },
  { title: 'Ocupar as mãos', tasks: ['Arrumar um cômodo', 'Cozinhar algo', 'Jogar alguma coisa', 'Assistir um episódio de série', 'Cuidar das plantas', 'Lavar a louça', 'Desenhar ou pintar', 'Consertar alguma coisa em casa'] }
];

const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';

export const validSlot = value => PLAN_SLOTS.includes(Number(value)) ? Number(value) : null;
export const planName = plan => plan?.name || `Plano ${plan?.slot || 1}`;

// Valida a lista enviada; devolve o erro em texto para o servidor responder 400.
export function normalizeTasks(value) {
  if (!Array.isArray(value)) return { error: 'Envie a lista de tarefas.' };
  const tasks = [...new Set(value.map(clean))];
  if (tasks.some(task => !task || task.length > TASK_MAX_LENGTH)) return { error: `Cada tarefa precisa ter até ${TASK_MAX_LENGTH} caracteres.` };
  if (!tasks.length || tasks.length > PLAN_MAX) return { error: `Escolha de 1 a ${PLAN_MAX} tarefas.` };
  return { tasks };
}

// Nome vazio é permitido: a tela mostra "Plano 1" ou "Plano 2".
export function normalizeName(value) {
  if (value !== undefined && typeof value !== 'string') return { error: 'Nome inválido.' };
  const name = clean(value);
  if (name.length > NAME_MAX_LENGTH) return { error: `O nome pode ter até ${NAME_MAX_LENGTH} caracteres.` };
  return { name };
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
export function finishStats(plan, done) {
  const skips = {};
  for (const task of plan.tasks) skips[task] = done.includes(task) ? 0 : (plan.skips?.[task] || 0) + 1;
  return { uses: (plan.uses || 0) + 1, skips, active: null };
}

// Salvar de novo mantém a contagem de pulos das tarefas que continuam no plano.
export const keptSkips = (tasks, old) => Object.fromEntries(tasks.map(task => [task, old?.skips?.[task] || 0]));
