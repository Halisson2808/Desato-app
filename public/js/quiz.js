import { FUNNELS, validateFunnel, financialProjection } from './quiz-model.js';
const main = document.querySelector('#quiz-main');
const quiz = FUNNELS.find(item => item.id === location.pathname.split('/')[2]) || FUNNELS[0];
const currency = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const escape = value => String(value).replace(/[&<>"']/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let step = -1, answers = {}, selection = [], reduction = .5, advancing = false;
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
function back() {if(step<=0)return;step--;advancing=false;render();focus();}
function advance(value) {
  if(advancing)return;
  const question=quiz.questions[step];
  try {validateFunnel(quiz.id,{[question.id]:value});} catch(error) {showError(error.message);return;}
  advancing=true;answers[question.id]=value;
  if(step===quiz.questions.length-1)validateFunnel(quiz.id,answers,true);
  step++;saveProgress(step===quiz.questions.length);render();focus();advancing=false;
}
function progress() {
  const finished=step===quiz.questions.length;
  return `<div class="step-heading">${step>0?'<button class="back-step" id="back" aria-label="Voltar à pergunta anterior">←</button>':'<span></span>'}<span>${finished?'SEU RESUMO':`${step+1} DE ${quiz.questions.length}`}</span><span>${finished?'✓':'DESATO'}</span></div><div class="progress-track" role="progressbar" aria-label="Etapas respondidas" aria-valuemin="0" aria-valuemax="7" aria-valuenow="${step}"><div class="progress-fill" style="width:${step/7*100}%"></div></div>`;
}
function intro() {
  main.innerHTML=`<section class="intro-screen"><div class="intro-tag"><span></span> UM NOVO COMEÇO</div><h1>O álcool está tomando<br>mais espaço do que<br><em>você gostaria?</em></h1><p class="intro-copy">Descubra o que você quer mudar e quanto a bebida está pesando no seu bolso.</p><div class="intro-visual" aria-hidden="true"><div class="visual-ring ring-one"></div><div class="visual-ring ring-two"></div><div class="visual-core"><img src="/icon.svg" width="58" height="58" alt=""></div><span class="visual-chip chip-one">Suas escolhas</span><span class="visual-chip chip-two">Seu próximo passo</span><span class="visual-dot dot-one"></span><span class="visual-dot dot-two"></span></div><button class="primary-action" id="start">Quero dar o primeiro passo <span aria-hidden="true">→</span></button><p class="intro-time">7 perguntas rápidas</p></section>`;
  document.querySelector('#start').addEventListener('click',()=>{step=0;saveProgress();render();focus();});
}
function questionScreen() {
  const question=quiz.questions[step];
  let content;
  if(question.type==='choice')content=`<div class="answer-list" role="group" aria-labelledby="question-title">${question.options.map((option,index)=>`<button type="button" class="answer-card ${answers[question.id]===option.value?'selected':''}" data-answer="${option.value}"><span class="answer-letter">${String.fromCharCode(65+index)}</span><span>${option.label}</span><span class="answer-arrow" aria-hidden="true">›</span></button>`).join('')}</div>`;
  else if(question.type==='multiple') {
    selection=[...(answers[question.id]||[])];
    content=`<div class="answer-list" role="group" aria-labelledby="question-title">${question.options.map(option=>`<button type="button" class="answer-card multi-card ${selection.includes(option.value)?'selected':''}" data-multiple="${option.value}" aria-pressed="${selection.includes(option.value)}"><span class="check-square" aria-hidden="true">${selection.includes(option.value)?'✓':''}</span><span>${option.label}</span></button>`).join('')}</div><button class="primary-action" id="next-multiple" ${selection.length?'':'disabled'}>Continuar <span aria-hidden="true">→</span></button>`;
  } else if(question.type==='money')content=`<div class="money-options">${[25,50,100,200,500].map(value=>`<button type="button" class="amount-card" data-money="${value}">${currency(value)}</button>`).join('')}<button class="amount-card custom-amount" id="custom-money">Outro valor</button></div><form id="number-form" ${answers.spend===undefined?'hidden':''} novalidate><label for="numeric-answer">Quanto você costuma gastar? (R$)</label><input id="numeric-answer" inputmode="decimal" autocomplete="off" placeholder="Ex.: 80,00" value="${answers.spend===undefined?'':answers.spend.toFixed(2).replace('.',',')}"><button class="primary-action" type="submit">Continuar <span aria-hidden="true">→</span></button></form>`;
  else content=`<div class="frequency-options">${[1,2,3,4,5,6,7].map(value=>`<button class="frequency-card" data-frequency="${value}"><strong>${value}</strong><span>${value===1?'vez':'vezes'}</span></button>`).join('')}</div><button class="answer-card" data-frequency="0"><span>Não costumo sair para beber</span><span class="answer-arrow" aria-hidden="true">›</span></button><button class="custom-frequency" id="custom-frequency">Minha frequência é diferente</button><form id="number-form" hidden novalidate><label for="numeric-answer">Quantas saídas por semana, em média?</label><input id="numeric-answer" inputmode="decimal" autocomplete="off" placeholder="Ex.: 0,5" value="${answers.frequency??''}"><button class="primary-action" type="submit">Ver meu resumo <span aria-hidden="true">→</span></button></form>`;
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
function resultScreen() {
  const projection=financialProjection(answers.spend,answers.frequency,reduction,0);
  const goals={understand:'Recuperar o controle',reduce:'Beber menos',quit:'Parar de beber',continue:'Manter sua mudança'};
  const selected=quiz.questions.find(question=>question.id==='changes').options.filter(option=>answers.changes.includes(option.value));
  main.innerHTML=`<section class="result-screen">${progress()}<span class="result-check" aria-hidden="true">✓</span><h1>Você já sabe o que<br>quer <em>mudar.</em></h1><p class="question-subtitle">Aqui está o seu ponto de partida.</p><div class="personal-summary"><span>SEU OBJETIVO</span><strong>${goals[answers.goal]}</strong><div class="summary-tags">${selected.map(option=>`<span>${escape(option.label)}</span>`).join('')}</div></div><div class="financial-summary"><span>SUAS SAÍDAS REPRESENTAM, EM MÉDIA</span><p class="big-money">${currency(projection.monthly)}<small>/mês</small></p><div class="money-stats"><div><strong>${currency(projection.daily)}</strong><span>média por dia</span></div><div><strong>${currency(projection.annual)}</strong><span>em um ano</span></div></div></div><div class="scenario-panel"><h2>E se essas saídas diminuíssem?</h2><div class="scenario-options">${[.25,.5,1].map(value=>`<button data-reduction="${value}" aria-pressed="${reduction===value}">${value*100}%</button>`).join('')}</div><p class="net">${currency(projection.net)}<span>de economia potencial por mês</span></p><p class="calculation-note">Cenário de ${reduction*100}% menos saídas, com o mesmo gasto médio nas restantes. Estimativa com base nas suas respostas; não é economia já realizada. Não inclui consumo em casa ou outros gastos.</p></div><div class="finish-note"><span class="finish-dot"></span>Seu resumo está pronto.</div><p id="save-status" class="save-status" role="status" hidden></p><p id="quiz-error" class="quiz-error" role="alert" tabindex="-1"></p></section>`;
  document.querySelector('#back').addEventListener('click',back);
  main.querySelectorAll('[data-reduction]').forEach(button=>button.addEventListener('click',()=>{reduction=Number(button.dataset.reduction);resultScreen();}));
  updateSaveStatus();
  if (!completionAnnounced) {completionAnnounced=true;window.dispatchEvent(new CustomEvent('desato:quiz-complete',{detail:{runId,quizId:quiz.id}}));}
}
function render(){if(step===-1)intro();else if(step===quiz.questions.length)resultScreen();else questionScreen();}
window.addEventListener('online',()=>{if(step>=0&&(saveFailed||lastSaved<revision))saveProgress(step===quiz.questions.length);});
window.addEventListener('pagehide',()=>{
  if(!recordingEnabled || step<0 || lastSaved===revision || !navigator.sendBeacon)return;
  navigator.sendBeacon('/api/funnel',new Blob([JSON.stringify({id:runId,token:writeToken,quizId:quiz.id,answers,completed:step===quiz.questions.length,revision:++revision})],{type:'application/json'}));
});
render();
