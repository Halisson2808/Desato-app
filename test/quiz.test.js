const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');
const { build } = require('esbuild');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/js/quiz-model.js'), 'utf8');
const model = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('cinco caminhos têm sete respostas válidas; não produzem classificação clínica', async () => {
  const { QUIZZES, validateAnswers, evaluateQuiz } = await model;
  assert.equal(QUIZZES.length, 5);
  assert.equal(new Set(QUIZZES.map(item => item.id)).size, 5);
  for (const quiz of QUIZZES) {
    assert.equal(quiz.questions.length, 7);
    const answers = Object.fromEntries(quiz.questions.map(question => [question.id, question.options ? question.options[0].value : 0]));
    const result = evaluateQuiz(quiz.id, answers);
    assert.equal(result.urgent, false); assert.equal(result.withdrawal, false);
    assert.equal(result.score, undefined); assert.equal(result.diagnosis, undefined);
    assert.deepEqual(validateAnswers(quiz.id, { ...answers, user_id:'forged' }), answers);
    assert.throws(() => validateAnswers(quiz.id, { ...answers, spend:NaN }));
    assert.throws(() => validateAnswers(quiz.id, { ...answers, spend:12.345 }));
    assert.throws(() => validateAnswers(quiz.id, { ...answers, frequency:15 }));
    assert.throws(() => validateAnswers(quiz.id, { ...answers, safety:'invented' }));
    assert.throws(() => validateAnswers(quiz.id, {}));
  }
});
test('cenários financeiros reproduzem a referência e não ocultam custo adicional', async () => {
  const { financialProjection } = await model;
  const result = financialProjection(80,2,.5,20);
  assert.ok(Math.abs(result.monthly - 693.333333) < .00001);
  assert.ok(Math.abs(result.daily - 22.7945205) < .00001);
  assert.ok(Math.abs(result.projected - 366.666667) < .00001);
  assert.ok(Math.abs(result.net - 326.666667) < .00001);
  assert.equal(financialProjection(0,0,1,20).net,-20);
  assert.equal(financialProjection(100, .5, .25, 20).weekly,50);
});
test('sinais de urgência e abstinência mudam a orientação sem pontuação', async () => {
  const { QUIZZES, evaluateQuiz } = await model;
  const quiz = QUIZZES[0];
  const answers = Object.fromEntries(quiz.questions.map(q => [q.id,q.options ? q.options[0].value : 0]));
  const urgent = evaluateQuiz(quiz.id, { ...answers,safety:'urgent' });
  assert.equal(urgent.urgent,true); assert.match(urgent.description,/atendimento imediato/);
  const withdrawal = evaluateQuiz(quiz.id, { ...answers,safety:'withdrawal' });
  assert.equal(withdrawal.withdrawal,true); assert.match(withdrawal.description,/abruptamente/);
});
async function boot() {
  const { document } = parseHTML('<html><body><main id="quiz-main" tabindex="-1"></main></body></html>');
  document.defaultView.HTMLElement.prototype.focus = function() {};
  const entries = new Map();
  const location = { pathname:'/quiz',search:'', replace(){} };
  const context = vm.createContext({ document, location, Intl, URLSearchParams, console,
    history:{ pushState: (_,__,url) => { location.pathname = url; } }, window:{ addEventListener(){} },
    sessionStorage:{ getItem:key => entries.get(key)||null, setItem:(key,value)=>entries.set(key,value), removeItem:key=>entries.delete(key) }
  });
  const output = await build({ entryPoints:[path.join(root,'public/js/quiz.js')], bundle:true,write:false,format:'iife',platform:'browser' });
  vm.runInContext(output.outputFiles[0].text,context);
  const event = (selector,type) => document.querySelector(selector).dispatchEvent(new document.defaultView.Event(type,{cancelable:true,bubbles:true}));
  const answer = value => { document.querySelectorAll('input[name="answer"]').forEach(input => { input.checked = input.value === value; if (input.checked) input.setAttribute('checked',''); else input.removeAttribute('checked'); }); event(`input[value="${value}"]`,'input'); };
  return { document,entries,event,answer };
}
test('fluxo real valida idade, exige resposta, permite voltar e calcula resultado corrigido', async () => {
  const app = await boot();
  app.event('[data-quiz="consumo"]','click'); assert.match(app.document.querySelector('#quiz-error').textContent,/Confirme/);
  app.document.querySelector('#adult').checked = true; app.event('[data-quiz="consumo"]','click');
  app.event('#question-form','submit'); assert.match(app.document.querySelector('#quiz-error').textContent,/Escolha/);
  for (const value of ['none','understand','weekly','sometimes','difficult']) { app.answer(value); app.event('#question-form','submit'); }
  app.document.querySelector('#money').value = '80,00'; app.event('#question-form','submit');
  app.event('[data-frequency="2"]','click'); app.event('#back','click');
  assert.equal(app.document.querySelector('#money').value,'80,00');
  app.document.querySelector('#money').value = '100,00'; app.event('#question-form','submit');
  assert.equal(app.document.querySelector('#frequency').value,'2'); app.event('#question-form','submit');
  assert.match(app.document.querySelector('.big-money').textContent,/866,67/);
  assert.match(app.document.querySelector('.net').textContent,/413,33/);
  assert.equal(app.entries.size,0, 'não guarda respostas sensíveis sem pedido de salvar');
});
test('urgência é apresentada já na primeira resposta, antes do resultado', async () => {
  const app = await boot(); app.document.querySelector('#adult').checked = true; app.event('[data-quiz="vontade"]','click');
  app.answer('urgent'); assert.match(app.document.querySelector('#safety-notice').textContent,/Não espere terminar/);
});
