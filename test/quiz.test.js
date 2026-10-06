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
test('funil v2 tem sete etapas com checklist, valida entradas e mantém a ordem financeira',async()=>{
  const {FUNNELS,validateFunnel}=await model;
  for(const quiz of FUNNELS){
    assert.equal(quiz.questions.length,7);assert.equal(quiz.questions[0].id,'goal');
    assert.equal(quiz.questions[4].type,'multiple');assert.equal(quiz.questions[5].id,'spend');assert.equal(quiz.questions[6].id,'frequency');
    assert.throws(()=>validateFunnel(quiz.id,{changes:[]}));assert.throws(()=>validateFunnel(quiz.id,{changes:['money','money']}));
    assert.throws(()=>validateFunnel(quiz.id,{spend:80.001}));assert.throws(()=>validateFunnel(quiz.id,{unknown:'x'}));
    assert.throws(()=>validateFunnel(quiz.id,{goal:'reduce'},true));
    assert.deepEqual(validateFunnel(quiz.id,{changes:['money','energy']}),{changes:['money','energy']});
  }
});
async function boot(pathname='/quiz'){
  const {document}=parseHTML(fs.readFileSync(path.join(root,'public/quiz.html'),'utf8'));
  document.defaultView.HTMLElement.prototype.focus=function(){};
  const requests=[],completions=[];
  const context=vm.createContext({document,location:{pathname},Intl,console,crypto:require('node:crypto').webcrypto,structuredClone,Uint8Array,AbortSignal,Blob,navigator:{},
    CustomEvent:document.defaultView.CustomEvent,window:{scrollTo(){},addEventListener(){},dispatchEvent:event=>completions.push(event.type)},
    fetch:async(url,options)=>{requests.push({url,options});return{ok:true,json:async()=>({funnelEnabled:false})};}
  });
  const output=await build({entryPoints:[path.join(root,'public/js/quiz.js')],bundle:true,write:false,format:'iife',platform:'browser'});
  vm.runInContext(output.outputFiles[0].text,context);
  const event=(selector,type='click')=>document.querySelector(selector).dispatchEvent(new document.defaultView.Event(type,{cancelable:true,bubbles:true}));
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  return{document,requests,completions,event,flush};
}
test('entrada é direta, sem catálogo, idade, login ou links de saída',async()=>{
  const app=await boot();
  assert.ok(app.document.querySelector('#start'));
  assert.equal(app.document.querySelectorAll('a').length,0);
  assert.equal(app.document.querySelector('nav'),null);
  assert.equal(app.document.querySelector('footer'),null);
  assert.equal(app.document.querySelector('#adult'),null);
  assert.doesNotMatch(app.document.body.textContent,/diagnóstico|18 anos|Entrar no app|Ver meus resultados/);
  assert.doesNotMatch(app.document.body.textContent,/bolso|gasto|dinheiro|perguntas rápidas/);
  app.event('#start');assert.equal(app.document.querySelectorAll('h1').length,1);
  assert.match(app.document.querySelector('h1').textContent,/O que você quer mudar/);
  assert.equal(app.document.querySelector('#number-form'),null);
  app.event('[data-answer="reduce"]');assert.match(app.document.querySelector('h1').textContent,/Em que momento/);
});
test('seleção única avança, checklist exige resposta e correção recalcula o resumo',async()=>{
  const app=await boot();app.event('#start');
  for(const value of ['understand','afterwork','sometimes','difficult'])app.event(`[data-answer="${value}"]`);
  assert.equal(app.document.querySelector('#next-multiple').disabled,true);
  app.event('[data-multiple="money"]');app.event('[data-multiple="energy"]');
  assert.equal(app.document.querySelector('[data-multiple="money"]').getAttribute('aria-pressed'),'true');
  app.event('[data-multiple="money"]');assert.equal(app.document.querySelector('[data-multiple="money"]').getAttribute('aria-pressed'),'false');
  app.event('#next-multiple');app.event('#custom-money');
  app.document.querySelector('#numeric-answer').value='80,001';app.event('#number-form','submit');
  assert.match(app.document.querySelector('#quiz-error').textContent,/Confira/);
  app.document.querySelector('#numeric-answer').value='80,00';app.event('#number-form','submit');
  app.event('[data-frequency="2"]');assert.match(app.document.querySelector('.big-money').textContent,/693,33/);
  app.event('#back');app.event('#back');assert.equal(app.document.querySelector('#numeric-answer').value,'80,00');
  app.document.querySelector('#numeric-answer').value='100,00';app.event('#number-form','submit');app.event('[data-frequency="2"]');
  assert.match(app.document.querySelector('.big-money').textContent,/866,67/);
  assert.match(app.document.querySelector('.annual-impact').textContent,/10\.400,00/);
  assert.equal(app.document.querySelector('.offer-screen'),null);
  app.event('#see-offer');
  assert.match(app.document.querySelector('.goal-headline').textContent,/Recuperar o controle/);
  assert.equal(app.document.querySelectorAll('.benefit-item').length,5);
  assert.match(app.document.querySelector('.net').textContent,/403,43/);
  app.event('[data-reduction="1"]');assert.match(app.document.querySelector('.net').textContent,/836,77/);
  app.event('#back');assert.ok(app.document.querySelector('.impact-screen'));
  assert.deepEqual(app.completions,['desato:quiz-complete']);
  await app.flush();await app.flush();assert.equal(app.requests.filter(item=>item.url==='/api/funnel').length,0,'registro desativado não envia respostas');
});
test('oferta com gasto zero mostra custo adicional em vez de inventar vantagem financeira',async()=>{
  const app=await boot();app.event('#start');
  for(const value of ['quit','social','never','notyet'])app.event(`[data-answer="${value}"]`);
  app.event('[data-multiple="control"]');app.event('#next-multiple');app.event('#custom-money');
  app.document.querySelector('#numeric-answer').value='0';app.event('#number-form','submit');app.event('[data-frequency="0"]');
  app.event('#see-offer');assert.match(app.document.querySelector('.net').textContent,/29,90/);
  assert.match(app.document.querySelector('.net').textContent,/custo adicional/);
  assert.match(app.document.querySelector('.comparison-conclusion').textContent,/não cobriria/);
  assert.equal(app.document.querySelectorAll('a').length,0);
  assert.equal(app.document.querySelector('.offer-unavailable').disabled,true);
});
test('comparação mostra hoje, total incluindo assinatura e economia com decomposição clara',async()=>{
  const app=await boot();app.event('#start');
  for(const value of ['reduce','social','sometimes','difficult'])app.event(`[data-answer="${value}"]`);
  app.event('[data-multiple="money"]');app.event('#next-multiple');app.event('#custom-money');
  app.document.querySelector('#numeric-answer').value='150';app.event('#number-form','submit');app.event('[data-frequency="1"]');app.event('#see-offer');
  assert.match(app.document.querySelector('.compare-today strong').textContent,/650,00/);
  assert.match(app.document.querySelector('.compare-future strong').textContent,/354,90/);
  assert.match(app.document.querySelector('.compare-breakdown').textContent,/325,00/);
  assert.match(app.document.querySelector('.compare-breakdown').textContent,/29,90/);
  assert.match(app.document.querySelector('.compare-saving .net').textContent,/295,10/);
  assert.match(app.document.querySelector('.offer-price').textContent,/ASSINATURA MENSAL/);
  assert.equal(app.document.querySelector('.price-status'),null);
  assert.match(app.document.querySelector('[data-reduction="0.5"]').textContent,/Metade/);
});
test('os cinco links diretos abrem o funil correto sem tela de seleção',async()=>{
  const {FUNNELS}=await model;
  for(const quiz of FUNNELS){const app=await boot('/quiz/'+quiz.id);app.event('#start');app.event('[data-answer="reduce"]');assert.equal(app.document.querySelector('h1').textContent,quiz.questions[1].title);}
});
