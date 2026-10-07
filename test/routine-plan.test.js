const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {build}=require('esbuild');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const today='2026-10-06';
function data(){return{support:{plan:null},routine:{tasks:[{id:'agua',title:'Beber um copo de água ao acordar',period:'manha',icon:'💧',active:true},{id:'cafe',title:'Tomar um café da manhã simples',period:'manha',icon:'🍌',active:true},{id:'personal',title:'Combinar uma conversa às 18h',period:'noite',icon:'✓',active:true}],completions:{'2026-10-05':{agua:true}}},checkins:{'2026-10-05':{status:'clean'}}};}
async function boot(store=data(),failAdd=false){
  const {document}=parseHTML('<html><body><main id="view"></main><div id="modal"></div></body></html>');
  document.defaultView.HTMLElement.prototype.focus=function(){};
  document.defaultView.HTMLInputElement.prototype.reportValidity=function(){return true;};
  const context=vm.createContext({document,console});
  const bundle=await build({entryPoints:[path.join(root,'public/js/views/routine.js')],bundle:true,write:false,format:'iife',globalName:'RoutineTest'});
  vm.runInContext(bundle.outputFiles[0].text,context);
  const writes=[],messages=[],routes=[],state={store,summary:{today},ui:{}},view=context.RoutineTest.routineView;
  const ctx={state,toast:message=>messages.push(message),navigate:route=>routes.push(route),endpoints:{
    saveSupportPlan:async body=>{writes.push({type:'plan',body});store.support.plan=body;},
    addTask:async body=>{if(failAdd)throw Error('Falha de teste');writes.push({type:'add',body});store.routine.tasks.push({id:'new'+writes.length,...body,active:true});},
    patchTask:async(id,body)=>{writes.push({type:'patch',id,body});Object.assign(store.routine.tasks.find(task=>task.id===id),body);},
    completeTask:async body=>{writes.push({type:'complete',body});if(!store.routine.completions[body.date])store.routine.completions[body.date]={};store.routine.completions[body.date][body.taskId]=body.completed;}
  },mutate:async action=>{try{await action();render();return true;}catch{return false;}},openModal:modal=>{
    document.querySelector('#modal').innerHTML=modal.content;
    modal.onOpen({close:()=>{document.querySelector('#modal').innerHTML='';}});
  }};
  function render(){document.querySelector('#view').innerHTML=view.html(ctx);view.bind(ctx);}
  render();
  const click=selector=>document.querySelector(selector).dispatchEvent(new document.defaultView.Event('click'));
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  return{document,state,writes,messages,routes,click,flush,context};
}
test('primeira visita oferece situações e preserva hábitos anteriores sem duplicar lista',async()=>{
  const app=await boot();assert.match(app.document.querySelector('h2').textContent,/Meu plano/);
  assert.equal(app.document.querySelectorAll('[data-plan-situation]').length,4);
  assert.equal(app.document.querySelector('#period-tabs'),null);
  assert.equal(app.document.querySelectorAll('[data-task="personal"]').length,1);
  assert.equal(app.document.querySelectorAll('[data-task="agua"]').length,1);
  assert.equal(app.writes.length,0);
  app.state.authUser={id:'alice'};app.click('[data-edit-action="personal"]');app.state.authUser={id:'bob'};app.click('#pause-action');await app.flush();
  assert.equal(app.writes.length,0);
});
test('salvar plano cria primeira ação e pausa somente padrões originais, mantendo histórico',async()=>{
  const store=data();store.routine.tasks.push({id:'caminhada',title:'Minha caminhada com um amigo às 19h',period:'tarde',icon:'🚶',active:true});
  const app=await boot(store);app.click('[data-plan-situation="work"]');
  app.click('[data-plan-preset="0"]');app.document.querySelector('#replace-initial').checked=true;
  app.click('#save-personal-plan');await app.flush();await app.flush();
  assert.equal(store.support.plan.firstAction,'Tomar banho assim que chegar em casa');
  assert.ok(store.routine.tasks.some(task=>task.title===store.support.plan.firstAction&&task.active));
  assert.equal(store.routine.tasks.find(task=>task.id==='agua').active,false);
  assert.equal(store.routine.tasks.find(task=>task.id==='cafe').active,false);
  assert.equal(store.routine.tasks.find(task=>task.id==='personal').active,true);
  assert.equal(store.routine.tasks.find(task=>task.id==='caminhada').active,true);
  assert.deepEqual(store.routine.completions['2026-10-05'],{agua:true});
  assert.deepEqual(store.checkins,{'2026-10-05':{status:'clean'}});
  assert.equal(app.document.querySelectorAll('.day-plan-card').length,1);
});
test('plano existente é reaproveitado e editar não cria tarefa duplicada nem perde alternativa',async()=>{
  const store=data();store.support.plan={situation:'Depois do trabalho',firstAction:'Preparar minha volta',exit:'Mudar o trajeto',help:'Combinar uma conversa'};
  const app=await boot(store);assert.equal(app.document.querySelector('.plan-onboarding'),null);
  app.click('#edit-plan');app.document.querySelector('#plan-first').value='Preparar uma atividade';app.click('#save-personal-plan');await app.flush();
  assert.equal(app.writes.filter(write=>write.type==='add').length,0);
  assert.equal(store.support.plan.exit,'Mudar o trajeto');assert.equal(store.support.plan.help,'Combinar uma conversa');
  assert.equal(store.support.plan.firstAction,'Preparar uma atividade');
});
test('falha ao adicionar ação preserva plano salvo e não pausa hábitos existentes',async()=>{
  const app=await boot(data(),true);app.click('[data-plan-situation="work"]');app.click('[data-plan-preset="0"]');app.document.querySelector('#replace-initial').checked=true;
  app.click('#save-personal-plan');await app.flush();await app.flush();
  assert.ok(app.state.store.support.plan);assert.equal(app.writes.some(write=>write.type==='patch'),false);
  assert.match(app.messages[0],/plano foi salvo/);
});
test('concluir ação, editar e pausar usam APIs existentes sem registrar consumo',async()=>{
  const app=await boot();app.click('[data-task="personal"]');await app.flush();
  assert.equal(app.state.store.routine.completions[today].personal,true);
  app.click('[data-edit-action="personal"]');app.document.querySelector('#action-title').value='Preparar uma conversa para o fim do dia';app.click('#save-action');await app.flush();
  assert.equal(app.state.store.routine.tasks.find(task=>task.id==='personal').title,'Preparar uma conversa para o fim do dia');
  app.click('[data-edit-action="personal"]');app.click('#pause-action');await app.flush();
  assert.equal(app.state.store.routine.tasks.find(task=>task.id==='personal').active,false);
  assert.equal(app.state.store.routine.completions[today].personal,true);
  app.click('#plan-sos');assert.deepEqual(app.routes,['sos']);
});
test('textos pessoais são escapados e títulos modificados não são tratados como padrões',async()=>{
  const store=data();store.support.plan={situation:'<img src=x>',firstAction:'<script>alert(1)</script>',exit:'',help:''};
  const app=await boot(store);assert.equal(app.document.querySelector('.day-plan-card img'),null);assert.equal(app.document.querySelector('.day-plan-card script'),null);
  assert.equal(app.context.RoutineTest.isInitialTask({id:'agua',title:'Minha ação pessoal',period:'manha',icon:'💧'}),false);
});
test('plano de Apoio pode virar ação diária sem duplicação e com pausa opcional dos padrões',async()=>{
  const store=data();store.support.plan={situation:'Depois do trabalho',firstAction:'Preparar minha volta',exit:'',help:''};
  const app=await boot(store);app.click('#add-plan-action');app.click('[data-action-preset="0"]');app.document.querySelector('#action-replace-initial').checked=true;
  app.click('#save-action');await app.flush();await app.flush();
  assert.equal(store.routine.tasks.filter(task=>task.title==='Preparar minha volta').length,1);
  assert.equal(store.routine.tasks.find(task=>task.id==='agua').active,false);
  app.click('#add-plan-action');app.click('[data-action-preset="0"]');app.click('#save-action');await app.flush();
  assert.equal(store.routine.tasks.filter(task=>task.title==='Preparar minha volta').length,1);
});
test('trocar de conta com o formulário aberto impede gravar tarefas na nova conta',async()=>{
  const app=await boot();app.state.authUser={id:'alice'};
  app.click('[data-plan-situation="work"]');app.click('[data-plan-preset="0"]');
  app.state.authUser={id:'bob'};app.click('#save-personal-plan');await app.flush();
  assert.equal(app.writes.length,0);
});
