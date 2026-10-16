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
// Tela de transição entre as perguntas pessoais e as de gasto; conta como uma etapa.
const spendIndex = quiz.questions.findIndex(question => question.id === 'spend');
let bridgePassed = false;
const TOTAL_STAGES = quiz.questions.length + 2; // perguntas + transição + resultado
function stageIndex() {
  if(step>=quiz.questions.length)return TOTAL_STAGES;
  return step<spendIndex||(step===spendIndex&&!bridgePassed)?step:step+1;
}
function advance(value) {
  if(advancing)return;
  const question=quiz.questions[step];
  try {validateFunnel(quiz.id,{[question.id]:value});} catch(error) {showError(error.message);return;}
  advancing=true;answers[question.id]=value;
  if(step===quiz.questions.length-1)validateFunnel(quiz.id,answers,true);
  step++;saveProgress(step===quiz.questions.length);render();focus();advancing=false;
}
// Só a barra: a marca já aparece no topo e o quiz não tem botão de voltar.
function progress() {
  const done=stageIndex();
  return `<div class="progress-track" role="progressbar" aria-label="Progresso" aria-valuemin="0" aria-valuemax="${TOTAL_STAGES}" aria-valuenow="${done}"><div class="progress-fill" style="width:${done/TOTAL_STAGES*100}%"></div></div>`;
}
// Tira o foco do botão tocado para o próximo cartão não aparecer marcado no celular.
function clearTouchState() { if(document.activeElement && document.activeElement!==main) document.activeElement.blur?.(); }
function intro() {
  main.innerHTML=`<section class="intro-screen"><div class="intro-tag"><span></span> UM NOVO COMEÇO</div><h1>Dê o primeiro passo<br>para deixar o álcool<br><em>para trás.</em></h1><p class="intro-copy">Entenda o que dificulta a mudança e descubra como começar, um passo de cada vez.</p><div class="intro-visual" aria-hidden="true"><div class="visual-ring ring-one"></div><div class="visual-ring ring-two"></div><div class="visual-core"><img src="/icon.svg" width="58" height="58" alt=""></div><span class="visual-chip chip-one">Suas escolhas</span><span class="visual-chip chip-two">Seu próximo passo</span><span class="visual-dot dot-one"></span><span class="visual-dot dot-two"></span></div><button class="primary-action" id="start">Quero dar o primeiro passo <span aria-hidden="true">→</span></button><p class="intro-trust"><span>Leva cerca de 1 minuto</span><span aria-hidden="true">·</span><span>Sem cadastro</span><span aria-hidden="true">·</span><span>Sem julgamento</span></p></section>`;
  document.querySelector('#start').addEventListener('click',()=>{step=0;saveProgress();render();focus();});
}
function bridgeScreen() {
  main.innerHTML=`<section class="question-screen bridge-screen">${progress()}<div class="bridge-icon" aria-hidden="true"><img src="/icon.svg" width="40" height="40" alt=""></div><h1>Você já deu o passo mais difícil.</h1><p class="bridge-copy">Olhar com honestidade para a própria relação com o álcool é o começo de qualquer mudança. Muita gente passa pelo mesmo, e dá para mudar, um dia de cada vez.</p><div class="bridge-card"><span>FALTA POUCO</span><p>Só mais <strong>duas perguntas rápidas</strong> para montar o seu resumo.</p></div><button class="primary-action" id="bridge-next">Continuar <span aria-hidden="true">→</span></button></section>`;
  document.querySelector('#bridge-next').addEventListener('click',()=>{bridgePassed=true;render();focus();});
}
function questionScreen() {
  const question=quiz.questions[step];
  let content;
  if(question.type==='choice')content=`<div class="answer-list" role="group" aria-labelledby="question-title">${question.options.map((option,index)=>`<button type="button" class="answer-card ${answers[question.id]===option.value?'selected':''}" data-answer="${option.value}"><span class="answer-letter">${String.fromCharCode(65+index)}</span><span>${option.label}</span><span class="answer-arrow" aria-hidden="true">›</span></button>`).join('')}</div>`;
  else if(question.type==='multiple') {
    selection=[...(answers[question.id]||[])];
    content=`<div class="answer-list compact-list" role="group" aria-labelledby="question-title">${question.options.map(option=>`<button type="button" class="answer-card multi-card ${selection.includes(option.value)?'selected':''}" data-multiple="${option.value}" aria-pressed="${selection.includes(option.value)}"><span class="check-square" aria-hidden="true">${selection.includes(option.value)?'✓':''}</span><span>${option.label}</span></button>`).join('')}</div><button class="primary-action" id="next-multiple" ${selection.length?'':'disabled'}>Continuar <span aria-hidden="true">→</span></button>`;
  } else if(question.type==='money')content=`<div class="money-options">${[25,50,100,200,500].map(value=>`<button type="button" class="amount-card" data-money="${value}">${currency(value)}</button>`).join('')}<button class="amount-card custom-amount" id="custom-money">Outro valor</button></div><form id="number-form" ${answers.spend===undefined?'hidden':''} novalidate><label for="numeric-answer">Quanto você costuma gastar? (R$)</label><input id="numeric-answer" inputmode="decimal" autocomplete="off" placeholder="Ex.: 80,00" value="${answers.spend===undefined?'':answers.spend.toFixed(2).replace('.',',')}"><button class="primary-action" type="submit">Continuar <span aria-hidden="true">→</span></button></form>`;
  else content=`<div class="frequency-options">${[1,2,3,4,5,6,7].map(value=>`<button class="frequency-card" data-frequency="${value}"><strong>${value}</strong><span>${value===1?'vez':'vezes'}</span></button>`).join('')}<button class="frequency-card custom-frequency-card" id="custom-frequency"><strong>+</strong><span>Outra</span></button></div><form id="number-form" hidden novalidate><label for="numeric-answer">Quantas vezes por semana, em média?</label><input id="numeric-answer" inputmode="decimal" autocomplete="off" placeholder="Ex.: 0,5 (uma vez a cada duas semanas)" value=""><button class="primary-action" type="submit">Ver meu resumo <span aria-hidden="true">→</span></button></form>`;
  const subtitle=question.type==='multiple'?question.help:question.type==='money'?'Considere o gasto com bebidas em uma saída.':question.type==='frequency'?'Pense em uma semana normal para você.':'Toque na opção que mais combina com você.';
  main.innerHTML=`<section class="question-screen ${question.type==='multiple'?'compact-screen':''}">${progress()}<h1 id="question-title">${question.title}</h1><p class="question-subtitle">${subtitle}</p>${content}<p id="quiz-error" class="quiz-error" role="alert" tabindex="-1"></p></section>`;
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
    if(question.type==='frequency'&&Number(normalized)<=0)return showError('Informe quantas vezes por semana, maior que zero.');
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
  const timesDesato=Math.floor(projection.monthly/OFFER.price);
  main.innerHTML=`<section class="result-screen impact-screen">${progress()}<h1>${spends?'Essas saídas têm<br>um custo que <em>se acumula.</em>':'Sua mudança começa<br>pelo que importa <em>para você.</em>'}</h1><p class="question-subtitle">${spends?'Veja o que o seu gasto habitual representa ao longo do tempo.':'Você não informou gastos com essas saídas. Seu objetivo pessoal continua sendo o ponto de partida.'}</p>${spends?`<div class="financial-summary"><span>EM UM ANO, NESSE RITMO</span><div class="annual-impact annual-hero"><strong id="annual-value">${currency(projection.annual)}</strong></div><div class="money-stats"><div><span>Por mês</span><p class="big-money">${currency(projection.monthly)}<small>/mês</small></p></div><div><span>Por dia, em média</span><strong>${currency(projection.daily)}</strong></div></div></div>${timesDesato>=1?`<div class="impact-equivalent"><span aria-hidden="true">≈</span><p>Só um mês dessas saídas pagaria o Desato <strong>${timesDesato} ${timesDesato===1?'vez':'vezes'}</strong>.</p></div>`:''}`:`<div class="financial-summary"><span>GASTO MENSAL MÉDIO ESTIMADO</span><p class="big-money">${currency(0)}<small>/mês</small></p><div class="annual-impact"><span>Em um ano</span><strong>${currency(0)}</strong></div></div>`}<p class="calculation-note impact-note">Com base em ${currency(answers.spend)} por saída e ${String(answers.frequency).replace('.',',')} ${answers.frequency===1?'saída':'saídas'} por semana. Estimativa de 52 semanas por ano; inclui apenas bebidas nessas saídas.</p><div class="impact-bridge"><h2>O dinheiro é uma parte.<br>O seu objetivo é maior.</h2><p>Você quer <strong>${goalLabel().toLowerCase()}</strong>. Agora, veja como o Desato pode fazer parte dos seus próximos passos.</p></div><button class="primary-action" id="see-offer">Conhecer meu próximo passo <span aria-hidden="true">→</span></button><p id="save-status" class="save-status" role="status" hidden></p><p id="quiz-error" class="quiz-error" role="alert" tabindex="-1"></p></section>`;
  document.querySelector('#see-offer').addEventListener('click',()=>{showingOffer=true;render();focus();});
  countUp(document.querySelector('#annual-value'),projection.annual);
  updateSaveStatus();
  if(!completionAnnounced){completionAnnounced=true;window.dispatchEvent(new CustomEvent('desato:quiz-complete',{detail:{runId,quizId:quiz.id}}));}
}
const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const BENEFITS=[
  [svg('<path d="M12 3a8 8 0 1 0 8 8c0-4.4-3.6-8-8-8Z"/><path d="M12 7v5"/><path d="M12 16h.01"/>'),'SOS para a hora da vontade','5 etapas guiadas que te ajudam a atravessar os minutos mais difíceis sem beber.'],
  [svg('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),'Jornada de 30 dias','Uma lição curta e uma tarefa prática por dia para entender e mudar o hábito.'],
  [svg('<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>'),'Plano para situações difíceis','Festa, sexta à noite, estresse: você chega preparado, com resposta pronta.'],
  [svg('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>'),'Seu progresso e sua economia','Calendário, seus dias de risco e quanto dinheiro você deixou de gastar.'],
  [svg('<path d="M12 20s-8-4.8-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.2-8 10-8 10Z"/>'),'Corpo e saúde','Veja o que melhora no seu corpo a cada dia sem beber.']
];
function offerScreen() {
  const projection=financialProjection(answers.spend,answers.frequency,reduction,0);
  const saved=projection.monthly*reduction;
  const paybackDays=saved>0?Math.max(1,Math.ceil(OFFER.price/(saved/30))):null;
  const spends=projection.monthly>0;
  const checkout=OFFER.checkoutUrl?`<a class="primary-action checkout-action" href="${escape(OFFER.checkoutUrl)}" rel="noopener">Quero começar agora <span aria-hidden="true">→</span></a>`:'<button class="primary-action offer-unavailable" disabled>Assinatura em preparação</button>';
  main.innerHTML=`<section class="offer-screen">
    <header class="offer-hero"><h1>Seu plano para <em>${goalLabel().toLowerCase()}</em></h1><p>Tudo o que você precisa, no seu celular, para os momentos em que a vontade aparece.</p></header>

    <div class="benefit-list">${BENEFITS.map(([icon,title,copy])=>`<article class="benefit-item"><span class="benefit-icon">${icon}</span><div><h2>${title}</h2><p>${copy}</p></div></article>`).join('')}</div>

    ${spends?`<section class="offer-value">
      <h2>Vale a pena para o seu bolso?</h2>
      <div class="value-compare">
        <div><span>Uma única saída sua</span><strong>${currency(answers.spend)}</strong></div>
        <div class="value-desato"><span>O Desato, para sempre</span><strong>${currency(OFFER.price)}</strong></div>
      </div>
      <p class="value-note">${answers.spend>OFFER.price?'Você paga uma vez só, menos do que uma noite de bebida.':'Você paga uma vez só, o preço de uma saída.'}</p>
      <div class="scenario-panel offer-comparison"><p class="comparison-intro">Se você reduzir essas saídas:</p><div class="scenario-options">${[[.25,'25% menos'],[.5,'Metade'],[1,'Nenhuma']].map(([value,label])=>`<button data-reduction="${value}" aria-pressed="${reduction===value}">${label}</button>`).join('')}</div>
        <div class="simple-comparison">
          <div class="compare-card compare-today"><span>Hoje</span><strong>${currency(projection.monthly)}<small>/mês</small></strong></div>
          <div class="compare-card compare-future"><span>Depois</span><strong>${currency(projection.monthly-saved)}<small>/mês</small></strong><div class="compare-breakdown"><span>Bebidas ${currency(projection.monthly-saved)}</span><span>Desato: pago uma vez</span></div></div>
        </div>
        <div class="compare-saving"><span>Sobra por mês</span><p class="net">${currency(saved)}<span> · ${currency(saved*12)} por ano</span></p></div>
        ${paybackDays?`<p class="comparison-conclusion payback">Nesse ritmo, o Desato se paga em <strong>${paybackDays} ${paybackDays===1?'dia':'dias'}</strong>.</p>`:''}
      </div>
    </section>`:`<section class="offer-value"><div class="scenario-panel offer-comparison"><div class="compare-saving extra-cost"><span>Investimento único</span><p class="net">${currency(OFFER.price)}<span> sem mensalidade</span></p></div><p class="comparison-conclusion">Sem gasto com essas saídas, não há economia para calcular. O valor está no apoio para mudar.</p></div></section>`}

    <section class="offer-price" id="offer-price">
      <p class="price-label">PAGAMENTO ÚNICO</p>
      <p class="price-value">${currency(OFFER.price)}</p>
      <p class="price-day">Acesso para sempre, sem mensalidade</p>
      ${checkout}
      <p class="offer-trust">Pagamento seguro · Acesso no celular e no computador</p>
      ${OFFER.checkoutUrl?'<p class="offer-endnote">Depois do pagamento, crie sua conta no app com o mesmo e-mail.</p>':'<p class="offer-endnote">Contratação ainda não disponível.</p>'}
    </section>
    <p class="calculation-note">Simulação com o mesmo gasto médio nas saídas restantes. A economia depende de uma mudança real; não é garantida pelo aplicativo.</p>
    ${OFFER.checkoutUrl?`<div class="sticky-cta"><div><strong>${currency(OFFER.price)}</strong><span>Pagamento único</span></div><button type="button" id="sticky-checkout">Começar</button></div>`:''}
    <p id="save-status" class="save-status" role="status" hidden></p><p id="quiz-error" class="quiz-error" role="alert" tabindex="-1"></p></section>`;
  document.querySelector('#sticky-checkout')?.addEventListener('click',()=>document.querySelector('.checkout-action')?.click());
  main.querySelectorAll('[data-reduction]').forEach(button=>button.addEventListener('click',()=>{reduction=Number(button.dataset.reduction);offerScreen();}));
  updateSaveStatus();
}
function render(){
  clearTouchState();
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
