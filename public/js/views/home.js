import { $, $$, money, todayISO, escapeHtml, dateLabel } from '../utils.js';
import { validMonth, monthCalendar, homeProgress, adjacentMonth, weekSummary, weekdayPattern, weekdayLabels } from '../content/home-progress.js';
import { cleanStreak } from '../content/body.js';
// Card "Sua evolução": dias seguidos sem beber, com mensagem para quem ainda não marcou nada.
function evolution(store,today) {
  const days=Object.keys(store.checkins||{}).filter(date=>date<=today);
  const streak=cleanStreak(store.checkins,today);
  const markedToday=Boolean(store.checkins[today]);
  let message;
  if(!days.length)message='Marque o seu primeiro dia para começar.';
  else if(!streak)message=store.checkins[today]?.status==='used'?'Amanhã é um novo começo.':'Hoje é um novo começo.';
  else if(!markedToday)message='Marque hoje para continuar a sequência.';
  else if(streak>=30)message='Um mês ou mais. Que orgulho!';
  else if(streak>=7)message='Uma semana ou mais. Incrível!';
  else if(streak===1)message='Primeiro dia. Continue assim!';
  else message='Você está indo muito bem!';
  return `<div class="home-evolution"><span class="evolution-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span><div class="evolution-copy"><strong>Sua evolução</strong><span>${message}</span></div><div class="evolution-pill"><strong>${streak} ${streak===1?'dia':'dias'}</strong><span>sem beber</span></div></div>`;
}
// Dias do mês anterior/seguinte mostrados em cinza, como num calendário comum.
function outsideDay(month,index,cells) {
  const [year,number]=month.split('-').map(Number);
  const first=cells.findIndex(Boolean);
  return new Date(year,number-1,1+index-first,12).getDate();
}
const listJoin=items=>items.length>1?`${items.slice(0,-1).join(', ')} e ${items.at(-1)}`:items[0]||'';
function insights(store,today) {
  const week=weekSummary(store,today),pattern=weekdayPattern(store.checkins,today);
  const plural=(n,one,many)=>`${n} ${n===1?one:many}`;
  return `<section class="home-insights"><div class="home-section-head"><div><span>SEUS PADRÕES</span><h3>O que dá para aprender</h3></div></div><div class="insight-grid">
  <article class="insight-card insight-week"><span class="insight-label">Últimos 7 dias</span><strong class="insight-big">${plural(week.clean,'dia','dias')} sem beber</strong><p>${week.configured?`<b>${money(week.saved)}</b> de gasto evitado`:'Informe seu gasto para ver a economia.'}</p><div class="insight-dots" aria-hidden="true">${Array.from({length:7},(_,i)=>{const [y,m,d]=today.split('-').map(Number);const date=new Date(y,m-1,d-6+i,12);const iso=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;const status=store.checkins[iso]?.status;return `<i class="${status||'none'}"></i>`;}).join('')}</div></article>
  <article class="insight-card"><span class="insight-label">Dias em que você mais bebe</span>${pattern.total>=2?`<strong class="insight-big">${pattern.top.length?listJoin(pattern.top):'Sem um dia fixo'}</strong><div class="weekday-bars" role="img" aria-label="Dias com consumo por dia da semana nos últimos 90 dias">${pattern.counts.map((count,i)=>`<div><span style="height:${pattern.max?Math.max(6,count/pattern.max*100):6}%" class="${count===pattern.max&&count>0?'peak':''}"></span><small>${weekdayLabels[i]}</small></div>`).join('')}</div><p>Prepare esses dias com antecedência em Situações.</p>`:`<strong class="insight-big">Ainda sem padrão</strong><p>Com mais registros, mostramos os dias da semana que pedem mais atenção.</p>`}</article>
  </div></section>`;
}
const monthName=month=>new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(Number(month.slice(0,4)),Number(month.slice(5))-1,1,12));
export const homeView={
  html({state}) {
    const {store,summary}=state,today=summary.today||todayISO();
    if(state.ui.homeCalendarToday&&state.ui.homeCalendarToday.slice(0,7)!==today.slice(0,7)&&state.ui.homeMonth===state.ui.homeCalendarToday.slice(0,7))state.ui.homeMonth=today.slice(0,7);
    state.ui.homeCalendarToday=today;
    const month=validMonth(state.ui.homeMonth,today);state.ui.homeMonth=month;
    const stats=homeProgress(store,month,today),current=store.checkins[today];
    const cells=monthCalendar(month,today,store.checkins);
    const firstName=store.profile.name?.trim().split(/\s+/)[0];
    return `<div class="home-dashboard"><div class="home-welcome"><h2>${firstName&&firstName!=='Você'?`Bom te ver, ${escapeHtml(firstName)}.`:'Vamos cuidar de hoje.'}</h2></div>
    <section class="today-question"><div class="today-heading"><span>HOJE</span><time datetime="${today}">${dateLabel(today)}</time></div><h3>Você bebeu hoje?</h3><div class="today-answers"><button id="checkin-clean" class="today-answer answer-clean ${current?.status==='clean'?'is-selected':''}" aria-pressed="${current?.status==='clean'}"><span class="answer-symbol" aria-hidden="true">${current?.status==='clean'?'✓':'○'}</span>Não bebi hoje</button><button id="checkin-used" class="today-answer answer-used ${current?.status==='used'?'is-selected':''}" aria-pressed="${current?.status==='used'}"><span class="answer-symbol" aria-hidden="true">${current?.status==='used'?'✓':'○'}</span>Bebi hoje</button></div><div class="today-footer"><span>${current?'Registro de hoje salvo. Você pode corrigir quando precisar.':'Hoje ainda está sem registro.'}</span></div></section>
    <section class="card home-calendar cal2"><div class="cal2-head"><div class="cal2-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/></svg><h3>Meu Calendário</h3></div><div class="cal2-nav"><button id="month-prev" aria-label="Mês anterior">‹</button><strong>${escapeHtml(monthName(month))}</strong><button id="month-next" aria-label="Próximo mês" ${month===today.slice(0,7)?'disabled':''}>›</button></div></div><div class="calendar-weekdays" aria-hidden="true">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-days">${cells.map((cell,index)=>cell?`<button class="calendar-day ${cell.future?'future':cell.status==='clean'?'clean':cell.status==='used'?'used':'unmarked'} ${cell.date===today?'is-today':''}" data-calendar-date="${cell.date}" ${cell.future?'disabled':''} aria-label="${escapeHtml(dateLabel(cell.date))}: ${cell.future?'dia futuro':cell.status==='clean'?'não bebeu':cell.status==='used'?'bebeu':'sem registro'}"><span>${cell.day}</span></button>`:`<span class="calendar-day outside" aria-hidden="true"><span>${outsideDay(month,index,cells)}</span></span>`).join('')}</div><div class="calendar-legend"><span><i class="legend-clean"></i>Não bebeu</span><span><i class="legend-used"></i>Bebeu</span><span><i class="legend-unmarked"></i>Sem registro</span></div><p class="calendar-tip">Toque nos dias que já passaram para marcar ou corrigir.</p>${evolution(store,today)}</section>
    <div class="home-bottom-grid"><section class="home-savings ${stats.configured?'has-calculation':'needs-calculation'}">${stats.configured?`<div class="savings-heading"><span>SEU GASTO EVITADO</span><button id="money-edit">Editar cálculo</button></div><h3>${escapeHtml(monthName(month))}</h3><div class="saved-amount">${money(stats.savedMonth)}</div><p class="savings-basis">Estimativa em ${stats.clean} ${stats.clean===1?'dia registrado':'dias registrados'} sem consumo.</p>${month===today.slice(0,7)?`<div class="today-saving"><span>Hoje</span><strong>${money(stats.savedToday)}</strong><small>${current?.status==='clean'?'já entrou na estimativa do mês':current?.status==='used'?'registrado com consumo':'aguardando seu registro'}</small></div>`:''}<div class="savings-secondary"><div><span>Média por dia sem consumo</span><strong>${money(stats.daily)}</strong></div><div><span>Desde o primeiro registro</span><strong>${money(stats.savedTotal)}</strong></div></div><p class="savings-explanation">Gasto evitado estimado a partir do seu hábito informado. Não é saldo em dinheiro.</p>`:`<h3>Veja o que você está evitando gastar.</h3><p>Informe seu gasto e veja a estimativa crescer nos dias sem consumo.</p><button class="primary-btn" id="money-edit">Calcular meu gasto</button>`}</section>
    <section class="card home-month-summary"><div class="home-section-head"><div><span>SUA EVOLUÇÃO</span><h3>O que seus registros mostram</h3></div></div><div class="month-number-grid"><div class="month-number clean"><strong>${stats.clean}</strong><span>dias sem beber</span></div><div class="month-number used"><strong>${stats.used}</strong><span>dias com consumo</span></div><div class="month-number unmarked"><strong>${stats.unknown}</strong><span>dias sem registro</span></div></div><div class="month-track" role="img" aria-label="${stats.percent}% dos dias registrados sem consumo"><span style="width:${stats.percent}%"></span></div><p>${stats.recorded?`<strong>${stats.percent}% dos dias que você registrou</strong> foram sem consumo.`:'Seu primeiro registro já começa a construir esse acompanhamento.'}</p><p class="month-context">${escapeHtml(monthName(month))}. Dias sem registro não contam como dias sem consumo.</p></section></div>${insights(store,today)}</div>`;
  },
  bind(ctx) {
    const {state,endpoints,mutate,openModal,navigate,redraw,toast,refresh}=ctx;
    const today=state.summary.today||todayISO(),month=state.ui.homeMonth;
    // Marca na hora e salva por trás; se o servidor falhar, desfaz e avisa.
    let saving=false;
    async function register(status) {
      const previous=state.store.checkins[today];
      if(saving||previous?.status===status)return;
      saving=true;
      state.store.checkins[today]={status,note:previous?.note||''};
      redraw();
      try {
        await endpoints.checkin({date:today,status,note:previous?.note||''});
        toast(status==='clean'?'Registrado: hoje você não bebeu.':'Registro salvo. Seu histórico continua completo.');
        refresh(true);
      } catch(error) {
        if(previous)state.store.checkins[today]=previous;else delete state.store.checkins[today];
        redraw();
        toast(error.message||'Não foi possível salvar. Tente de novo.');
      } finally { saving=false; }
    }
    $('#checkin-clean').addEventListener('click',()=>register('clean'));
    $('#checkin-used').addEventListener('click',()=>register('used'));
    $('#month-prev').addEventListener('click',()=>{state.ui.homeMonth=adjacentMonth(month,-1);redraw();});
    $('#month-next').addEventListener('click',()=>{const next=adjacentMonth(month,1);if(next<=today.slice(0,7)){state.ui.homeMonth=next;redraw();}});
    function editDay(date,chooseDate=false) {
      const item=state.store.checkins[date];
      openModal({title:chooseDate?'Escolher um dia':`Registro de ${dateLabel(date)}`,subtitle:'Marque se você bebeu nesse dia.',content:`${chooseDate?`<div class="field"><label for="record-date">Dia</label><input id="record-date" type="date" max="${today}" value="${date}" required></div>`:''}<div class="field"><label for="record-status">Você bebeu nesse dia?</label><select id="record-status" required><option value="">Escolha uma resposta</option><option value="clean" ${item?.status==='clean'?'selected':''}>Não bebi</option><option value="used" ${item?.status==='used'?'selected':''}>Bebi</option></select></div><button class="primary-btn" id="record-save">Salvar registro</button>`,onOpen({close}) {
        $('#record-date')?.addEventListener('change',()=>{const row=state.store.checkins[$('#record-date').value];$('#record-status').value=row?.status||'';});
        $('#record-save').addEventListener('click',async()=>{
          if(!$('#record-status').reportValidity()||($('#record-date')&&!$('#record-date').reportValidity()))return;
          const ok=await mutate(()=>endpoints.checkin({date:$('#record-date')?.value||date,status:$('#record-status').value,note:state.store.checkins[$('#record-date')?.value||date]?.note||''}),'Registro salvo. Calendário e evolução atualizados.');if(ok)close();
        });
      }});
    }
    $$('[data-calendar-date]').forEach(button=>button.addEventListener('click',()=>editDay(button.dataset.calendarDate)));
    $('#money-edit').addEventListener('click',()=>{
      const current=state.store.money;
      openModal({title:'Seu gasto habitual com bebidas',subtitle:'Vamos transformar seu gasto por saída em uma média diária.',content:`<div class="field"><label for="spend">Gasto médio com bebidas por saída (R$)</label><input id="spend" type="number" min="0" max="1000000" step="0.01" inputmode="decimal" value="${current.spendPerOuting||''}" placeholder="Ex.: 100" required></div><div class="field"><label for="times">Quantas saídas por semana, em média?</label><input id="times" type="number" min="0" max="14" step="any" inputmode="decimal" value="${current.outingsPerWeek||''}" placeholder="Ex.: 2" required></div><div id="calc-preview" class="home-calc-preview"></div><p class="home-calc-note">A média diária entra no mês somente nos dias que você marcar como “não bebi”. É uma estimativa, baseada em 52 semanas por ano. Editar estes valores recalcula as estimativas do seu histórico.</p><button class="primary-btn" id="save-money">Salvar e acompanhar</button>`,onOpen({close}) {
        function preview() {
          const spend=Number($('#spend').value),frequency=Number($('#times').value);
          if(!$('#spend').value||!$('#times').value||!Number.isFinite(spend)||!Number.isFinite(frequency)||spend<0||frequency<0||spend>1000000||frequency>14){$('#calc-preview').textContent='Preencha os dois valores para ver a estimativa.';return;}
          const annual=spend*frequency*52;
          $('#calc-preview').innerHTML=`<span>Seu gasto habitual representa</span><strong>${money(annual/12)} por mês</strong><div><span>Média por dia</span><b>${money(annual/365)}</b></div>`;
        }
        $('#spend').addEventListener('input',preview);$('#times').addEventListener('input',preview);preview();
        $('#save-money').addEventListener('click',async()=>{
          if(!$('#spend').reportValidity()||!$('#times').reportValidity())return;
          const ok=await mutate(()=>endpoints.money({spendPerOuting:Number($('#spend').value),outingsPerWeek:Number($('#times').value)}),'Cálculo salvo. Seus registros já atualizam a estimativa.');if(ok)close();
        });
      }});
    });
  }
};
