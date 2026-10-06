import { QUIZZES, MONTHLY_PRICE, validateAnswers, evaluateQuiz, financialProjection } from './quiz-model.js';
const main = document.querySelector('#quiz-main');
const currency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const pendingKey = 'desato-quiz-pending';
let quiz = null, answers = {}, step = 0, finished = false, reduction = .5;
let authInitialization;
async function quizSession() {
  const authModule = await import('./auth.js');
  if (!authInitialization) authInitialization = authModule.initializeAuth(() => {}).catch(error => { authInitialization = null; throw error; });
  const initialized = await authInitialization;
  return { initialized, session: await authModule.accessSession() };
}
function focus() { main.focus(); }
function error(message) { const target = document.querySelector('#quiz-error'); target.textContent = message; target.focus(); }
function routeQuiz() { return QUIZZES.find(item => item.id === location.pathname.split('/').filter(Boolean)[1]); }
function selectQuiz(item) { quiz = item; answers = {}; step = 0; finished = false; history.pushState(null, '', '/quiz/' + item.id); render(); focus(); }
function safetyNotice(value) {
  if (!['withdrawal','urgent'].includes(value)) return '';
  const urgent = value === 'urgent';
  return `<div class="notice ${urgent ? 'urgent' : 'warning'}" role="alert"><strong>${urgent ? 'Procure atendimento de urgência agora.' : 'Procure avaliação profissional antes de mudar o consumo.'}</strong><p>${urgent ? 'Confusão, alucinações ou convulsões precisam de atendimento imediato. Não espere terminar o quiz. Peça ajuda a alguém próximo; não dirija.' : 'Sintomas ao reduzir podem indicar abstinência. Não pare nem reduza abruptamente por conta própria. O quiz e o SOS não substituem avaliação.'}</p><p><a href="https://www.nhs.uk/conditions/alcohol-use-disorder/" target="_blank" rel="noopener noreferrer">Entenda os sinais e os cuidados</a> · <a href="https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps/caps" target="_blank" rel="noopener noreferrer">Conheça os serviços de apoio do SUS</a></p></div>`;
}
function chooser() {
  main.innerHTML = `<div class="quiz-heading"><p class="eyebrow">DESATO / CONHEÇA SEU MOMENTO</p><h1>Qual parte da sua relação com o álcool você quer entender?</h1><p>Cinco caminhos, sete perguntas em cada um. Você verá um resumo orientativo e o impacto financeiro estimado das suas saídas.</p><label class="consent"><input id="adult" type="checkbox"> <span>Tenho 18 anos ou mais e entendo que este quiz não oferece diagnóstico clínico.</span></label><p id="quiz-error" class="error" role="alert" tabindex="-1"></p></div><div class="quiz-grid">${QUIZZES.map(item => `<button class="quiz-card" data-quiz="${item.id}"><span class="card-number">${item.number}<span aria-hidden="true">↗</span></span><h3>${item.title}</h3><p>${item.subtitle}</p><span class="card-meta">7 perguntas · começar</span></button>`).join('')}</div><p class="quiet">As respostas ficam nesta página durante o preenchimento. Salvar na conta é opcional. O quiz financeiro considera somente bebidas consumidas nas saídas.</p>`;
  main.querySelectorAll('[data-quiz]').forEach(button => button.addEventListener('click', () => {
    if (!document.querySelector('#adult').checked) return error('Confirme a informação acima para começar.');
    selectQuiz(QUIZZES.find(item => item.id === button.dataset.quiz));
  }));
  const historyArea = document.createElement('section');
  historyArea.innerHTML = '<button class="text-button" id="saved-quizzes">Ver meus resultados salvos →</button><div id="saved-list" aria-live="polite"></div>';
  main.append(historyArea);
  document.querySelector('#saved-quizzes').addEventListener('click', async () => {
    const button = document.querySelector('#saved-quizzes'); button.disabled = true;
    try {
      const { initialized, session } = await quizSession();
      if (initialized.config.mode !== 'json' && !session) { document.querySelector('#saved-list').innerHTML = '<p>Entre para consultar seus resultados.</p><a class="button secondary" href="/app?next=quiz">Entrar na conta ↗</a>'; return; }
      const response = await fetch('/api/quiz', { headers: session ? { Authorization: `Bearer ${session.access_token}` } : {}, cache:'no-store' });
      if (!response.ok) throw new Error('Não foi possível consultar seus resultados.');
      const data = await response.json();
      const saved = data.quizzes.filter(row => QUIZZES.some(item => row.quiz_version === item.id + '-v1'));
      document.querySelector('#saved-list').innerHTML = saved.length ? `<div class="presets">${saved.map((row,index) => `<button class="chip" data-saved="${index}">${QUIZZES.find(item => row.quiz_version === item.id+'-v1').title}</button>`).join('')}</div><p class="quiet">Uma resposta mais recente por versão de quiz nesta conta. Você pode revisar ou substituir ao responder novamente.</p>` : '<p>Você ainda não salvou nenhum quiz nesta conta.</p>';
      main.querySelectorAll('[data-saved]').forEach(item => item.addEventListener('click', () => {
        try { const row = saved[Number(item.dataset.saved)]; const id = row.quiz_version.slice(0,-3); const clean = validateAnswers(id,row.answers); quiz = QUIZZES.find(value => value.id === id); answers = clean; finished = true; render(); focus(); }
        catch { error('Este resultado não é compatível com o quiz atual. Responda novamente.'); }
      }));
    } catch (failure) { error(failure.message); }
    finally { button.disabled = false; }
  });
}
function questionScreen() {
  const question = quiz.questions[step];
  const value = answers[question.id];
  let input;
  if (question.type === 'choice') input = `<div class="options" role="radiogroup" aria-labelledby="question-title">${question.options.map(option => `<label class="option"><input type="radio" name="answer" value="${option.value}" ${value === option.value ? 'checked' : ''}><span>${option.label}</span></label>`).join('')}</div>`;
  else if (question.type === 'money') input = `<label class="input-label" for="money">Gasto médio com bebidas (R$)</label><input class="money-input" id="money" inputmode="decimal" autocomplete="off" placeholder="Ex.: 80,00" value="${value === undefined ? '' : value.toFixed(2).replace('.', ',')}" aria-describedby="question-help quiz-error"><div class="presets">${[25,50,100,200,500].map(amount => `<button type="button" class="chip" data-money="${amount}">${currency(amount)}</button>`).join('')}</div>`;
  else input = `<div class="presets">${[0,1,2,3,4,5,6,7].map(amount => `<button type="button" class="chip" data-frequency="${amount}" aria-pressed="${value === amount}">${amount === 0 ? 'Nenhuma' : amount + '×'}</button>`).join('')}</div><label class="input-label" for="frequency">Outra frequência semanal (0 a 14)</label><input class="frequency-input" id="frequency" type="number" min="0" max="14" step="any" inputmode="decimal" placeholder="Ex.: 0,5 para uma saída a cada duas semanas" value="${value ?? ''}" aria-describedby="question-help quiz-error">`;
  main.innerHTML = `<div class="question"><div class="progress-meta"><span>${quiz.title}</span><span>Pergunta ${step+1} de 7</span></div><div class="progress-track" role="progressbar" aria-label="Progresso do quiz" aria-valuemin="0" aria-valuemax="7" aria-valuenow="${step}"><div class="progress-fill" style="width:${step/7*100}%"></div></div><p class="eyebrow">${step >= 5 ? 'O IMPACTO NO SEU BOLSO' : 'SUA EXPERIÊNCIA COM O ÁLCOOL'}</p><h1 id="question-title">${question.title}</h1><p class="help" id="question-help">${question.help || 'Escolha a resposta que mais se aproxima da sua experiência.'}</p><form id="question-form" novalidate>${input}<div id="safety-notice">${question.id === 'safety' ? safetyNotice(value) : ''}</div><p id="quiz-error" class="error" role="alert" tabindex="-1"></p><div class="quiz-actions"><button type="button" class="text-button" id="back">← ${step ? 'Voltar' : 'Escolher outro quiz'}</button><button class="button" type="submit">${step === 6 ? 'Ver meu resultado' : 'Continuar'} ↗</button></div></form></div>`;
  const read = () => {
    if (question.type === 'choice') return main.querySelector('input[name="answer"]:checked')?.value;
    const raw = document.querySelector(question.type === 'money' ? '#money' : '#frequency').value.trim();
    if (!raw) return undefined;
    const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
    return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
  };
  function capture() { answers[question.id] = read(); }
  main.querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
    capture();
    if (question.id === 'safety') document.querySelector('#safety-notice').innerHTML = safetyNotice(answers.safety);
    if (question.type === 'frequency') main.querySelectorAll('[data-frequency]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.frequency) === answers.frequency)));
  }));
  main.querySelectorAll('[data-money]').forEach(button => button.addEventListener('click', () => { document.querySelector('#money').value = Number(button.dataset.money).toFixed(2).replace('.', ','); capture(); }));
  main.querySelectorAll('[data-frequency]').forEach(button => button.addEventListener('click', () => { document.querySelector('#frequency').value = button.dataset.frequency; capture(); main.querySelectorAll('[data-frequency]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); }));
  document.querySelector('#back').addEventListener('click', () => { capture(); if (step) step--; else { quiz = null; history.pushState(null, '', '/quiz'); } render(); focus(); });
  document.querySelector('#question-form').addEventListener('submit', event => {
    event.preventDefault(); capture(); const current = answers[question.id];
    if (question.type === 'choice' && !question.options.some(option => option.value === current)) return error('Escolha uma resposta para continuar.');
    if (question.type !== 'choice' && (typeof current !== 'number' || !Number.isFinite(current) || current < 0 || current > (question.type === 'money' ? 1000000 : 14) || (question.type === 'money' && Math.abs(current*100 - Math.round(current*100)) > .00001))) return error(question.type === 'money' ? 'Informe um valor de R$ 0 a R$ 1.000.000, com até duas casas decimais.' : 'Informe uma frequência de 0 a 14 vezes por semana.');
    if (step === 6) { answers = validateAnswers(quiz.id, answers); finished = true; } else step++;
    render(); focus();
  });
}
function resultScreen() {
  const result = evaluateQuiz(quiz.id, answers);
  const money = financialProjection(answers.spend, answers.frequency, reduction);
  const scale = Math.max(money.monthly, money.projected, 1);
  main.innerHTML = `<article class="result"><p class="eyebrow">SEU RETRATO / ${quiz.title.toUpperCase()}</p><h1>${result.title}</h1><p class="result-intro">${result.description}</p>${safetyNotice(answers.safety)}<p class="quiet">Este resumo não determina se você tem dependência, nem classifica um “nível de alcoolismo”. As perguntas não compõem uma escala clínica validada.</p>${result.concerns.length ? `<section><h2>O que suas respostas sinalizam</h2><ul class="summary-list">${result.concerns.map(title => `<li>${title}</li>`).join('')}</ul><p class="quiet">São situações relatadas, não sintomas confirmados ou uma pontuação de gravidade.</p></section>` : ''}${result.urgent ? '' : `<section><h2>Um próximo passo</h2><div class="notice"><strong>${result.withdrawal ? 'Busque avaliação profissional antes de alterar o consumo.' : quiz.action}</strong><p>Você pode procurar uma UBS ou CAPS para acolhimento. O Desato oferece apoio cotidiano e não substitui tratamento.</p><a href="https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps/caps" target="_blank" rel="noopener noreferrer">Conhecer os CAPS →</a></div></section>`}
    <section ${result.urgent ? 'hidden' : ''}><h2>Quanto essas saídas representam</h2><div class="money-panel"><span>Gasto mensal médio estimado com bebidas</span><div class="big-money">${currency(money.monthly)}</div><div class="money-stats"><div><strong>${currency(money.daily)}</strong>média por dia</div><div><strong>${currency(money.annual)}</strong>estimativa anual</div></div><p class="quiet">Base: ${currency(answers.spend)} por saída × ${answers.frequency} saídas por semana × 52 semanas/ano. Não inclui consumo em casa, comida ou transporte.</p><p><strong>Simule uma redução nessas saídas</strong></p><div class="scenario">${[.25,.5,1].map(rate => `<button class="chip" data-reduction="${rate}" aria-pressed="${reduction === rate}">${rate*100}%</button>`).join('')}</div>${[['Gasto atual',money.monthly,''],['Cenário + assinatura hipotética',money.projected,'future']].map(([label,amount,style]) => `<div class="bar-row"><div><span>${label}</span><strong>${currency(amount)}/mês</strong></div><div class="bar-track"><div class="bar-fill ${style}" style="width:${amount/scale*100}%"></div></div></div>`).join('')}<p class="net">${money.net >= 0 ? `Economia potencial líquida: ${currency(money.net)}/mês` : `Custo adicional neste cenário: ${currency(-money.net)}/mês`}</p><p class="quiet">Se as saídas diminuírem ${reduction*100}%, mantendo o mesmo gasto médio nas restantes. Inclui R$ ${MONTHLY_PRICE}/mês como hipótese de assinatura, não preço final ou cobrança. Usar o app não garante essa redução. A média diária não significa uma compra a cada dia.</p>${result.withdrawal ? '<p class="quiet">Esta conta não é recomendação de reduzir por conta própria. Procure avaliação antes de mudar o consumo.</p>' : ''}</div></section>
    <section class="review"><details><summary>Revisar minhas 7 respostas</summary><dl>${quiz.questions.map(question => `<dt>${question.title}</dt><dd>${escape(question.type === 'money' ? currency(answers[question.id]) : question.type === 'frequency' ? answers[question.id] + ' vezes/semana' : question.options.find(option => option.value === answers[question.id]).label)}</dd>`).join('')}</dl><button class="text-button" id="edit">Corrigir respostas →</button></details></section>
    <section><h2>Guardar este ponto de partida</h2><p>As respostas incluem informações sensíveis sobre álcool. Salve apenas se quiser vinculá-las à sua conta.</p><label class="save-consent"><input id="save-money" type="checkbox"><span>Também atualizar a calculadora do app com o gasto e a frequência informados.</span></label><div class="quiz-actions"><button class="button" id="save">Salvar na minha conta ↗</button><button class="text-button" id="restart">Escolher outro quiz</button></div><p id="quiz-error" class="error" role="status" tabindex="-1"></p><div id="login-link"></div></section><p class="sources">Conteúdo orientado por <a href="https://rethinkingdrinking.niaaa.nih.gov/tools/worksheets-more/how-stop-alcohol-cravings" target="_blank" rel="noopener noreferrer">NIAAA</a>, <a href="https://www.nhs.uk/conditions/alcohol-use-disorder/" target="_blank" rel="noopener noreferrer">NHS</a> e <a href="https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps/caps" target="_blank" rel="noopener noreferrer">Ministério da Saúde</a>. O quiz do Desato ainda não tem validação clínica.</p></article>`;
  main.querySelectorAll('[data-reduction]').forEach(button => button.addEventListener('click', () => { reduction = Number(button.dataset.reduction); render(); }));
  document.querySelector('#edit').addEventListener('click', () => { finished = false; step = 0; render(); focus(); });
  document.querySelector('#restart').addEventListener('click', () => { quiz = null; answers = {}; finished = false; sessionStorage.removeItem(pendingKey); history.pushState(null, '', '/quiz'); render(); focus(); });
  document.querySelector('#save').addEventListener('click', save);
}
async function save() {
  const button = document.querySelector('#save'); button.disabled = true;
  const updateMoney = document.querySelector('#save-money').checked;
  try {
    const { initialized, session } = await quizSession();
    if (initialized.config.mode !== 'json' && !session) {
      sessionStorage.setItem(pendingKey, JSON.stringify({ quizId: quiz.id, answers, expires: Date.now() + 2*60*60*1000 }));
      error('Entre na conta para salvar. Guardamos temporariamente as respostas nesta aba por até 2 horas; você confirmará o salvamento depois de entrar.');
      document.querySelector('#login-link').innerHTML = '<a class="button secondary" href="/app?next=quiz">Entrar e voltar ao resultado ↗</a>';
      return;
    }
    async function send(path, body) {
      const response = await fetch(path, { method: 'POST', headers: { 'Content-Type':'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify(body) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Não foi possível salvar.'); }
    }
    await send('/api/quiz', { quizId: quiz.id, answers });
    sessionStorage.removeItem(pendingKey);
    if (updateMoney) {
      const response = await fetch('/api/money', { method:'PUT', headers: { 'Content-Type':'application/json', ...(session ? { Authorization:`Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ spendPerOuting:answers.spend, outingsPerWeek:answers.frequency }) });
      if (!response.ok) throw new Error('Quiz salvo, mas a calculadora não foi atualizada. Tente atualizar os valores no aplicativo.');
    }
    document.querySelector('#quiz-error').textContent = `Quiz salvo${session?.user?.email ? ' na conta ' + session.user.email : ' no modo local'}${updateMoney ? ' e calculadora atualizada' : ''}.`;
    document.querySelector('#login-link').innerHTML = '<a class="button secondary" href="/app">Abrir meu acompanhamento ↗</a>';
  } catch (failure) { error(failure.message || 'Não foi possível salvar. Confira sua conexão e tente novamente.'); }
  finally { button.disabled = false; }
}
function render() { if (!quiz) chooser(); else if (finished) resultScreen(); else questionScreen(); }
window.addEventListener('popstate', () => { quiz = null; answers = {}; step = 0; finished = false; render(); });
// Links diretos mostram a confirmação de idade antes de iniciar a versão escolhida.
const requested = routeQuiz();
if (location.pathname !== '/quiz' && location.pathname !== '/quiz/' && !requested) location.replace('/quiz');
let resumed = false;
try {
  const pending = JSON.parse(sessionStorage.getItem(pendingKey) || 'null');
  if (pending && pending.expires <= Date.now()) sessionStorage.removeItem(pendingKey);
  else if (pending && new URLSearchParams(location.search).has('retomar')) {
    quiz = QUIZZES.find(item => item.id === pending.quizId); answers = validateAnswers(pending.quizId, pending.answers); finished = true; resumed = true;
  }
} catch { sessionStorage.removeItem(pendingKey); quiz = null; }
render();
if (requested && !resumed) {
  const selected = main.querySelector(`[data-quiz="${requested.id}"]`); selected.style.borderColor = 'var(--green)';
  selected.querySelector('.card-meta').textContent = 'Caminho escolhido · confirmar e começar';
}
