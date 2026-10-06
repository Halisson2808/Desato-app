const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {parseHTML}=require('linkedom');
const {build}=require('esbuild');
const root=path.join(__dirname,'..');
const model=import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/js/content/home-progress.js'),'utf8')).toString('base64'));
const today='2026-10-06';
function store(){return {profile:{name:'Alice'},money:{spendPerOuting:100,outingsPerWeek:2},checkins:{'2026-09-30':{status:'clean'},'2026-10-01':{status:'clean',note:'Boa caminhada'},'2026-10-02':{status:'used'},'2026-10-06':{status:'clean'}},routine:{tasks:[],completions:{}}};}
test('calendário respeita mês, ano bissexto, futuros e dias sem registro',async()=>{
  const {monthCalendar,validMonth,adjacentMonth}=await model;
  const days=monthCalendar('2026-10',today,store().checkins);
  assert.equal(days.filter(Boolean).length,31);assert.equal(days.length%7,0);assert.equal(days[4].date,'2026-10-01');
  assert.equal(days.find(day=>day?.date==='2026-10-03').status,null);
  assert.equal(days.find(day=>day?.date==='2026-10-07').future,true);
  assert.equal(monthCalendar('2024-02','2024-02-29').filter(Boolean).length,29);
  assert.equal(adjacentMonth('2026-01',-1),'2025-12');assert.equal(validMonth('2026-11',today),'2026-10');
});
test('estimativa mensal deriva de registros, sem duplicar ao editar ou contar futuros',async()=>{
  const {homeProgress}=await model,rows=store(),daily=10400/365;
  rows.checkins['2026-10-07']={status:'clean'};
  const before=homeProgress(rows,'2026-10',today);
  assert.equal(before.clean,2);assert.equal(before.used,1);assert.equal(before.unknown,3);
  assert.ok(Math.abs(before.savedMonth-2*daily)<1e-8);assert.ok(Math.abs(before.savedTotal-3*daily)<1e-8);
  assert.equal(before.savedToday,daily);
  rows.checkins[today]={status:'clean'};assert.equal(homeProgress(rows,'2026-10',today).savedMonth,before.savedMonth);
  rows.checkins[today]={status:'used'};assert.equal(homeProgress(rows,'2026-10',today).savedMonth,daily);assert.equal(homeProgress(rows,'2026-10',today).savedToday,0);
  assert.equal(homeProgress(rows,'2026-09',today).savedMonth,daily);
  rows.money.spendPerOuting=0;assert.equal(homeProgress(rows,'2026-10',today).savedMonth,0);
});
async function boot(data=store()){
  const {document}=parseHTML('<html><body><main id="view"></main></body></html>');
  const context=vm.createContext({document,console});
  const bundled=await build({entryPoints:[path.join(root,'public/js/views/home.js')],bundle:true,write:false,format:'iife',globalName:'HomeTest'});
  vm.runInContext(bundled.outputFiles[0].text,context);
  const view=context.HomeTest.homeView,state={store:data,summary:{today,routine:{done:1,total:2}},ui:{}},writes=[],modals=[];
  const ctx={state,endpoints:{checkin:async body=>{writes.push(body);state.store.checkins[body.date]={status:body.status,note:body.note};}},mutate:async action=>{await action();redraw();return true;},openModal:modal=>modals.push(modal),navigate(){},redraw:()=>redraw()};
  function redraw(){document.querySelector('#view').innerHTML=view.html(ctx);view.bind(ctx);}
  redraw();
  const click=selector=>document.querySelector(selector).dispatchEvent(new document.defaultView.Event('click'));
  return {document,state,writes,modals,click,redraw,flush:()=>new Promise(resolve=>setImmediate(resolve))};
}
test('Início mostra pergunta, calendário por status e estimativa com os registros do mês',async()=>{
  const app=await boot();
  assert.match(app.document.querySelector('.today-question').textContent,/Você bebeu hoje/);
  assert.ok(app.document.querySelector('[data-calendar-date="2026-10-01"]').classList.contains('clean'));
  assert.ok(app.document.querySelector('[data-calendar-date="2026-10-02"]').classList.contains('used'));
  assert.ok(app.document.querySelector('[data-calendar-date="2026-10-03"]').classList.contains('unmarked'));
  assert.equal(app.document.querySelector('[data-calendar-date="2026-10-07"]').disabled,true);
  assert.match(app.document.querySelector('.saved-amount').textContent,/56,99/);
  app.click('#checkin-clean');await app.flush();assert.equal(app.writes.length,0);
  app.click('#checkin-used');await app.flush();assert.equal(app.writes[0].status,'used');assert.match(app.document.querySelector('.saved-amount').textContent,/28,49/);
  app.click('#month-prev');assert.equal(app.state.ui.homeMonth,'2026-09');assert.match(app.document.querySelector('.saved-amount').textContent,/28,49/);
});
test('sem cálculo aparece convite; dia anotado preserva e escapa o texto',async()=>{
  const rows=store();rows.money={spendPerOuting:0,outingsPerWeek:0};rows.checkins[today].note='<img src=x onerror=alert(1)>';
  const app=await boot(rows);
  assert.ok(app.document.querySelector('.needs-calculation'));assert.equal(app.document.querySelector('.saved-amount'),null);
  app.click('#today-note');assert.ok(app.modals[0].content.includes('&lt;img'));assert.equal(app.modals[0].content.includes('<img'),false);
  app.click('#money-edit');assert.match(app.modals[1].content,/Quantas saídas por semana/);
  assert.equal(app.writes.length,0);
});
test('virada do mês acompanha o mês atual sem deslocar quem consulta um mês antigo',async()=>{
  const app=await boot();app.state.summary.today='2026-11-01';app.redraw();assert.equal(app.state.ui.homeMonth,'2026-11');
  app.click('#month-prev');assert.equal(app.state.ui.homeMonth,'2026-10');
  app.state.summary.today='2026-12-01';app.redraw();assert.equal(app.state.ui.homeMonth,'2026-10');
});
