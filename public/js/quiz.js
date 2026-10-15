import { FUNNELS, OFFER, validateFunnel, financialProjection } from './quiz-model.js';
const main = document.querySelector('#quiz-main');
const quiz = FUNNELS.find(item => item.id === location.pathname.split('/')[2]) || FUNNELS[0];
const currency = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const escape = value => String(value).replace(/[&<>"']/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let step = -1, answers = {}, selection = [], reduction = .5, advancing = false, showingOffer = false;
const runId = crypto.randomUUID();
const writeToken = Array.from(crypto.getRandomValues(new Uint8Array(32)),byte => byte.toString(16).padStart(2,'0')).join('');
let revision = 0, queue = Promise.resolve(), lastSaved = -1, saveFailed = false;
let recordingEnabled = false, completionAnnounced = false;
const recordingConfig = fetch('/api/config',{cache:'no-store'}).then(response=>response.ok?response.json():{}).then(config=>{recordingEnabled=config.funnelEnabled===true;return recordingEnabled;}).catch(()=>false);
function saveProgress(completed = false) {
  const snapshot = {id:runId,token:writeToken,quizId:quiz.id,answers:structuredClone(answers),completed,revision:++revision};
  queue = queue.then(async () => {
    if (!await recordingConfig) return;
    let success = false;
    for (let attempt=0;attempt<2&&!success;attempt++) {
      try {
        const response = await fetch('/api/funnel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(snapshot),keepalive:true,signal:AbortSignal.timeout(8000)});
        success = response.ok;
        if (success) {lastSaved=snapshot.revision;saveFailed=false;}
      } catch { /* Mantém a resposta atual disponível para reenvio. */ }
    }
    if (!success) saveFailed=true;
    if (step===quiz.questions.length) updateSaveStatus();
  });
}
function focus() {main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
function showError(message) {const element=document.querySelector('#quiz-error');element.textContent=message;element.focus();}
// Tela de transição entre as perguntas pessoais e as de gasto.
const spendIndex = quiz.questions.findIndex(question => question.id === 'spend');
let bridgePassed = false;
function back() {
  if(showingOffer){showingOffer=false;render();focus();return;}
  if(step===spendIndex&&bridgePassed){bridgePassed=false;render();focus();return;}
  if(step<=0)return;step--;advancing=false;render();focus();
}
function advance(value) {
  if(advancing)return;
  const question=quiz.questions[step];
  try {validateFunnel(quiz.id,{[question.id]:value});} catch(error) {showError(error.message);return;}
  advancing=true;answers[question.id]=value;
  if(step===quiz.questions.length-1)validateFunnel(quiz.id,answers,true);
  step++;saveProgress(step===quiz.questions.length);render();focus();advancing=false;
}
function progress(label = 'SEU RESUMO') {
  const finished=step===quiz.questions.length;
  return `<div class="step-heading">${step>0?'<button class="back-step" id="back" aria-label="Voltar à etapa anterior">←</button>':'<span></span>'}<span>${finished?label:`${step+1} DE ${quiz.questions.length}`}</span><span>${finished?'✓':'DESATO'}</span></div><div class="progress-track" role="progressbar" aria-label="Etapas respondidas" aria-valuemin="0" aria-valuemax="7" aria-valuenow="${step}"><div class="progress-fill" style="width:${step/7*100}%"></div></div>`;
}
function intro() {
  main.innerHTML=`<section class="intro-screen"><div class="intro-tag"><span></span> UM NOVO COMEÇO</div><h1>Dê o primeiro passo<br>para deixar o álcool<br><em>para trás.</em></h1><p class="intro-copy">Entenda o que dificulta a mudança e descubra como começar, um passo de cada vez.</p><div class="intro-visual" aria-hidden="true"><div class="visual-ring ring-one"></div><div class="visual-ring ring-two"></div><div class="visual-core"><img src="/icon.svg" width="58" height="58" alt=""></div><span class="visual-chip chip-one">Suas escolhas</span><span class="visual-chip chip-two">Seu próximo passo</span><span class="visual-dot dot-one"></span><span class="visual-dot dot-two"></span></div><button class="primary-action" id="start">Quero dar o primeiro passo <span aria-hidden="true">→</span></button><p class="intro-trust"><span>Leva cerca de 1 minuto</span><span aria-hidden="true">·</span><span>Sem cadastro</span><span aria-hidden="true">·</span><span>Sem julgamento</span></p></section>`;
  document.querySelector('#start').addEventListener('click',()=>{step=0;saveProgress();render();focus();});
}
function bridgeScreen() {
  main.innerHTML=`<section class="question-screen bridge-screen">${progress()}<div class="bridge-icon" aria-hidden="true"><img src="/icon.svg" width="40" height="40" alt=""></div><h1>Obrigado pela sinceridade.</h1><p class="bridge-copy">Reconhecer o que pesa já é parte da mudança. Muita gente passa pelo mesmo, e dá para mudar com um passo de cada vez.</p><div class="bridge-card"><span>AGORA, DUAS PERGUNTAS RÁPIDAS</span><p>Vamos olhar para algo que quase ninguém soma: <strong>quanto essas saídas custam por mês e por ano.</strong></p></div><button class="primary-action" id="bridge-next">Vamos lá <span aria-hidden="true">→</span></button></section>`;
  document.querySelector('#back')?.addEventListener('click',()=>{step--;render();focus();});
  document.querySelector('#bridge-next').addEventListener('click',()=>{bridgePassed=true;render();focus();});
}
function questionScreen() {
  const question=quiz.questions[step];
  let content;
  if(question.type==='choice')content=`<div class="answer-list" role="group" aria-labelledby="question-title">${question.options.map((option,index)=>`<button type="button" class="answer-card ${answers[question.id]===option.value?'selected':''}" data-answer="${option.value}"><span class="answer-letter">${String.fromCharCode(65+index)}</span><span>${option.label}</span><span class="answer-arrow" aria-hidden="true">›</span></button>`).join('')}</div>`;
  else if(question.type==='multiple') {
    selection=[...(answers[question.id]||[])];
    content=`<div class="answer-list" role="group" aria-labelledby="question-title">${question.options.map(option=>`<button type="button" class="answer-card multi-card ${selection.includes(option.value)?'selected':''}" data-multiple="${option.value}" aria-pressed="${selection.includes(option.value)}"><span class="check-square" aria-hidden="true">${selection.includes(option.value)?'✓':''}</span><span>${option.label}</span></button>`).join('')}</div><button class="primary-action" id="next-multiple" ${selection.length?'':'disabled'}>Continuar <span aria-hidden="true">→</span></button>`;
  } else if(question.type==='money')content=`<div class="money-options">${[25,50,100,200,500].map(value=>`<button type="button" class="amount-card" data-money="${value}">${currency(value)}</button>`).join('')}<button class="amount-card custom-amount" id="custom-money">Outro valor</button></div><form id="number-form" ${answers.spend===undefined?'hidden':''} novalidate><label for="numeric-answer">Quanto você costuma gastar? (R$)</label><input id="numeric-answer" inputmode="decimal" autocomplete="off" placeholder="Ex.: 80,00" value="${answers.spend===undefined?'':answers.spend.toFixed(2).replace('.',',')}"><button class="primary-action" type="submit">Continuar <span aria-hidden="true">→</span></button></form>`;
  else {
    // Cada opção já mostra quanto aquela frequência custa por mês.
    const monthly=times=>financialProjection(answers.spend,times,0,0).monthly;
    content=`${answers.spend>0?`<p class="spend-chip">${currency(answers.spend)} por saída</p>`:''}<div class="frequency-options">${[1,2,3,4,5,6,7].map(value=>`<button class="frequency-card" data-frequency="${value}"><strong>${value}</strong><span>${value===1?'vez':'vezes'}</span>${answers.spend>0?`<em>${currency(Math.round(monthly(value)))}/mês</em>`:''}</button>`).join('')}</div><button class="answer-card" data-frequency="0"><span>Não costumo sair para beber</span><span class="answer-arrow" aria-hidden="true">›</span></button><button class="custom-frequency" id="custom-frequency">Minha frequência é diferente</button><form id="number-form" hidden novalidate><label for="numeric-answer">Quantas saídas por semana, em média?</label><input id="numeric-answer" inputmode="decimal" autocomplete="off" placeholder="Ex.: 0,5" value="${answers.frequency??''}"><button class="primary-action" type="submit">Ver meu resumo <span aria-hidden="true">→</span></button></form>`;
  }
  const subtitle=question.type==='multiple'?question.help:question.type==='money'?'Considere o gasto com bebidas em uma saída.':question.type==='frequency'?'Pense em uma semana normal para você.':'Toque na opção que mais combina com você.';
  main.innerHTML=`<section class="question-screen">${progress()}<h1 id="question-title">${question.title}</h1><p class="question-subtitle">${subtitle}</p>${content}<p id="quiz-error" class="quiz-error" role="alert" tabindex="-1"></p></section>`;
  document.querySelector('#back')?.addEventListener('click',back);
  main.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>advance(button.dataset.answer)));
  main.querySelectorAll('[data-multiple]').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.multiple;selection=selection.includes(value)?selection.filter(item=>item!==value):[...selection,value];
    const selected=selection.includes(value);button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));button.querySelector('.check-square').textContent=selected?'✓':'';
    document.querySelector('#next-multiple').disabled=!selection.length;
  }));
  document.querySelector('#next-multiple')?.addEventListener('click',()=>advance(selection));
  main.querySelectorAll('[data-money]').forEach(button=>button.addEventListener('click',()=>advance(Number(button.dataset.money))));
  main.querySelectorAll('[data-frequency]').forEach(button=>button.addEventListener('click',()=>advance(Number(button.dataset.frequency))));
  const openCustom=()=>{document.querySelector('#number-form').hidden=false;document.querySelector('#numeric-answer').focus();};
  document.querySelector('#custom-money')?.addEventListener('click',openCustom);
  document.querySelector('#custom-frequency')?.addEventListener('click',openCustom);
  document.querySelector('#number-form')?.addEventListener('submit',event=>{
    event.preventDefault();const raw=document.querySelector('#numeric-answer').value.trim();
    const normalized=raw.includes(',')?raw.replace(/\./g,'').replace(',','.') : raw;
    if(!/^\d+(\.\d+)?$/.test(normalized))return showError('Informe um número válido para continuar.');
    advance(Number(normalized));
  });
}
function updateSaveStatus() {
  const status=document.querySelector('#save-status');if(!status)return;
  status.hidden=!saveFailed;status.innerHTML=saveFailed?'Não conseguimos registrar suas respostas. <button id="retry-save">Tentar novamente</button>':'';
  document.querySelector('#retry-save')?.addEventListener('click',()=>{saveFailed=false;status.hidden=true;saveProgress(true);});
}
function goalLabel() {
  return {understand:'Recuperar o controle',reduce:'Beber menos',quit:'Parar de beber',continue:'Manter sua mudança'}[answers.goal];
}
// Conta o valor de zero até o total; sem animação, o texto final já está na página.
function countUp(element, target) {
  if(!element||!target||typeof window.requestAnimationFrame!=='function'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const start=performance.now(),duration=1400;
  const tick=now=>{
    if(!element.isConnected)return;
    const progressValue=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-progressValue,3);
    element.textContent=currency(target*eased);
    if(progressValue<1)window.requestAnimationFrame(tick);else element.textContent=currency(target);
  };
  window.requestAnimationFrame(tick);
}
function resultScreen() {
  const projection=financialProjection(answers.spend,answers.frequency,0,0);
  const spends=projection.monthly>0;
  const yearsOfDesato=projection.annual/(OFFER.monthlyPrice*12);
  main.innerHTML=`<section class="result-screen impact-screen">${progress('O IMPACTO NO SEU BOLSO')}<h1>${spends?'Essas saídas têm<br>um custo que <em>se acumula.</em>':'Sua mudança começa<br>pelo que importa <em>para você.</em>'}</h1><p class="question-subtitle">${spends?'Veja o que o seu gasto habitual representa ao longo do tempo.':'Você não informou gastos com essas saídas. Seu objetivo pessoal continua sendo o ponto de partida.'}</p>${spends?`<div class="financial-summary"><span>EM UM ANO, NESSE RITMO</span><div class="annual-impact annual-hero"><strong id="annual-value">${currency(projection.annual)}</strong></div><div class="money-stats"><div><span>Por mês</span><p class="big-money">${currency(projection.monthly)}<small>/mês</small></p></div><div><span>Por dia, em média</span><strong>${currency(projection.daily)}</strong></div></div></div>${yearsOfDesato>=1?`<div class="impact-equivalent"><span aria-hidden="true">≈</span><p>Esse valor pagaria o Desato por <strong>${Math.floor(yearsOfDesato)} ${Math.floor(yearsOfDesato)===1?'ano':'anos'}</strong>.</p></div>`:''}`:`<div class="financial-summary"><span>GASTO MENSAL MÉDIO ESTIMADO</span><p class="big-money">${currency(0)}<small>/mês</small></p><div class="annual-impact"><span>Em um ano</span><strong>${currency(0)}</strong></div></div>`}<p class="calculation-note impact-note">Com base em ${currency(answers.spend)} por saída e ${answers.frequency} saídas por semana. Estimativa de 52 semanas por ano; inclui apenas bebidas nessas saídas.</p><div class="impact-bridge"><h2>O dinheiro é uma parte.<br>O seu objetivo é maior.</h2><p>Você quer <strong>${goalLabel().toLowerCase()}</strong>. Agora, veja como o Desato pode fazer parte dos seus próximos passos.</p></div><button class="primary-action" id="see-offer">Conhecer meu próximo passo <span aria-hidden="true">→</span></button><p id="save-status" class="save-status" role="status" hidden></p><p id="quiz-error" class="quiz-error" role="alert" tabindex="-1"></p></section>`;
  document.querySelector('#back').addEventListener('click',back);
  document.querySelector('#see-offer').addEventListener('click',()=>{showingOffer=true;render();focus();});
  countUp(document.querySelector('#annual-value'),projection.annual);
  updateSaveStatus();
  if(!completionAnnounced){completionAnnounced=true;window.dispatchEvent(new CustomEvent('desato:quiz-complete',{detail:{runId,quizId:quiz.id}}));}
}
const BENEFITS=[
  ['SOS guiado','Quando a vontade apertar, 5 etapas com respiração, contas e foco te ajudam a atravessar os minutos mais difíceis.'],
  ['Jornada de 30 dias','Uma lição curta e uma tarefa prática por dia para entender seus gatilhos e mudar o hábito.'],
  ['Situações difíceis','Monte antes um plano para festa, sexta à noite ou estresse: o que beber, como recusar e quando ir embora.'],
  ['Seus padrões e sua economia','Calendário, dias em que você mais bebe e quanto deixou de gastar, tudo atualizado a cada registro.'],
  ['Corpo e saúde','Acompanhe o que melhora no seu corpo a cada dia sem beber: sono, disposição, fígado e mais.']
];
function offerScreen() {
  const projection=financialProjection(answers.spend,answers.frequency,reduction,OFFER.monthlyPrice);
  const selected=quiz.questions.find(question=>question.id==='changes').options.filter(option=>answers.changes.includes(option.value));
  const spends=projection.monthly>0;
  const checkout=OFFER.checkoutUrl?`<a class="primary-action checkout-action" href="${escape(OFFER.checkoutUrl)}" rel="noopener">Começar minha mudança <span aria-hidden="true">→</span></a>`:'<button class="primary-action offer-unavailable" disabled>Assinatura em preparação</button>';
  main.innerHTML=`<section class="result-screen offer-screen">${progress('SEU PRÓXIMO PASSO')}
    <p class="offer-kicker">VOCÊ DISSE QUE QUER</p><h1 class="goal-headline">${goalLabel()}.</h1>
    ${selected.length?`<div class="summary-tags offer-goals">${selected.map(option=>`<span>${escape(option.label)}</span>`).join('')}</div>`:''}
    <div class="offer-price">
      <div class="offer-brand"><img src="/icon.svg" width="34" height="34" alt=""><span>${OFFER.priceConfirmed?'ASSINATURA MENSAL':'PLANO MENSAL EM PLANEJAMENTO'}</span></div>
      ${spends?`<p class="price-anchor">Você gasta <s>${currency(projection.monthly)}/mês</s> com bebida nessas saídas.</p>`:''}
      <p class="price-value">${currency(OFFER.monthlyPrice)}<small>/mês</small></p>
      <p class="price-day">Menos de R$ 1 por dia</p>
      ${OFFER.priceConfirmed?'':'<div class="price-status">Preço de referência para esta proposta.</div>'}
      ${checkout}
      <ul class="offer-trust"><li>Pagamento seguro</li><li>Use no celular e no computador</li><li>SOS sempre à mão</li></ul>
    </div>
    <h2 class="offer-section-title">O que você recebe</h2>
    <div class="benefit-list">${BENEFITS.map(([title,copy])=>`<article class="benefit-item"><span class="benefit-check" aria-hidden="true">✓</span><div><h2>${title}</h2><p>${copy}</p></div></article>`).join('')}</div>
    <div class="scenario-panel offer-comparison"><h2>Quanto pode sobrar no seu bolso</h2><p class="comparison-intro">Escolha quanto você quer reduzir essas saídas:</p><div class="scenario-options">${[[.25,'25% menos'],[.5,'Metade'],[1,'Sem essas saídas']].map(([value,label])=>`<button data-reduction="${value}" aria-pressed="${reduction===value}">${label}</button>`).join('')}</div>
      <div class="simple-comparison">
        <div class="compare-card compare-today"><span>HOJE</span><strong>${currency(projection.monthly)}<small>/mês</small></strong></div>
        <div class="compare-card compare-future"><span>${reduction===.5?'COM METADE DAS SAÍDAS':reduction===1?'SEM ESSAS SAÍDAS':'COM 25% MENOS SAÍDAS'}</span><strong>${currency(projection.projected)}<small>/mês</small></strong><div class="compare-breakdown"><div><span>Bebidas</span><b>${currency(projection.monthly*(1-reduction))}</b></div><span class="plus-sign" aria-hidden="true">+</span><div><span>Desato${OFFER.priceConfirmed?'':' (referência)'}</span><b>${currency(OFFER.monthlyPrice)}</b></div></div></div>
        <div class="compare-saving ${projection.net<0?'extra-cost':''}"><span>${projection.net>=0?'PODE SOBRAR POR MÊS':'CUSTO ADICIONAL POR MÊS'}</span><p class="net">${currency(Math.abs(projection.net))}<span>${projection.net>=0?'já descontando o Desato':'de custo adicional neste cenário'}</span></p></div>
      </div>
      ${projection.net<=0?`<p class="comparison-conclusion">${projection.net===0?'A economia cobriria exatamente a assinatura.':'Nesse cenário, a economia não cobriria a assinatura. O valor está no apoio para mudar.'}</p>`:''}
      <p class="calculation-note">Simulação com o mesmo gasto médio nas saídas restantes. A economia depende de uma mudança real; não é garantida pelo aplicativo.</p>
    </div>
    ${OFFER.checkoutUrl?'<p class="offer-endnote">Depois do pagamento, crie sua conta no app com o mesmo e-mail.</p>':'<p class="offer-endnote">Contratação ainda não disponível.</p>'}
    ${OFFER.checkoutUrl?`<div class="sticky-cta"><div><strong>${currency(OFFER.monthlyPrice)}/mês</strong><span>Menos de R$ 1 por dia</span></div><button type="button" id="sticky-checkout">Começar</button></div>`:''}
    <p id="save-status" class="save-status" role="status" hidden></p><p id="quiz-error" class="quiz-error" role="alert" tabindex="-1"></p></section>`;
  document.querySelector('#back').addEventListener('click',back);
  document.querySelector('#sticky-checkout')?.addEventListener('click',()=>document.querySelector('.checkout-action')?.click());
  main.querySelectorAll('[data-reduction]').forEach(button=>button.addEventListener('click',()=>{reduction=Number(button.dataset.reduction);offerScreen();}));
  updateSaveStatus();
}
function render(){
  if(step===-1)intro();
  else if(step===quiz.questions.length){if(showingOffer)offerScreen();else resultScreen();}
  else if(step===spendIndex&&!bridgePassed)bridgeScreen();
  else questionScreen();
}
window.addEventListener('online',()=>{if(step>=0&&(saveFailed||lastSaved<revision))saveProgress(step===quiz.questions.length);});
window.addEventListener('pagehide',()=>{
  if(!recordingEnabled || step<0 || lastSaved===revision || !navigator.sendBeacon)return;
  navigator.sendBeacon('/api/funnel',new Blob([JSON.stringify({id:runId,token:writeToken,quizId:quiz.id,answers,completed:step===quiz.questions.length,revision:++revision})],{type:'application/json'}));
});
render();
