import { $, $$, money, todayISO, escapeHtml, dateLabel } from '../utils.js';
import { validMonth, monthCalendar, homeProgress, adjacentMonth } from '../content/home-progress.js';
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
    return `<div class="home-dashboard"><div class="home-welcome"><span>SEU DIA, UM PASSO DE CADA VEZ</span><h2>${firstName&&firstName!=='Você'?`Bom te ver, ${escapeHtml(firstName)}.`:'Vamos cuidar de hoje.'}</h2></div>
    <section class="today-question"><div class="today-heading"><span>HOJE</span><time datetime="${today}">${dateLabel(today)}</time></div><h3>Você bebeu hoje?</h3><p>Um registro simples para acompanhar sua mudança.</p><div class="today-answers"><button id="checkin-clean" class="today-answer answer-clean ${current?.status==='clean'?'is-selected':''}" aria-pressed="${current?.status==='clean'}"><span class="answer-symbol" aria-hidden="true">${current?.status==='clean'?'✓':'○'}</span>Não bebi hoje</button><button id="checkin-used" class="today-answer answer-used ${current?.status==='used'?'is-selected':''}" aria-pressed="${current?.status==='used'}"><span class="answer-symbol" aria-hidden="true">${current?.status==='used'?'✓':'○'}</span>Bebi hoje</button></div><div class="today-footer"><span>${current?'Registro de hoje salvo. Você pode corrigir quando precisar.':'Hoje ainda está sem registro.'}</span><button id="today-note">${current?.note?'Ver anotação':'Adicionar anotação'}</button></div></section>
    <section class="card home-calendar"><div class="home-section-head"><div><span>SEU HISTÓRICO</span><h3>Um dia de cada vez</h3></div><button class="home-text-action" id="history-open">Escolher uma data</button></div><div class="calendar-toolbar"><button id="month-prev" aria-label="Mês anterior">‹</button><strong>${escapeHtml(monthName(month))}</strong><button id="month-next" aria-label="Próximo mês" ${month===today.slice(0,7)?'disabled':''}>›</button></div><div class="calendar-weekdays" aria-hidden="true">${['D','S','T','Q','Q','S','S'].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-days">${cells.map(cell=>cell?`<button class="calendar-day ${cell.future?'future':cell.status==='clean'?'clean':cell.status==='used'?'used':'unmarked'} ${cell.date===today?'is-today':''}" data-calendar-date="${cell.date}" ${cell.future?'disabled':''} aria-label="${escapeHtml(dateLabel(cell.date))}: ${cell.future?'dia futuro':cell.status==='clean'?'não bebeu':cell.status==='used'?'bebeu':'sem registro'}${cell.note?', tem anotação':''}"><span>${cell.day}</span><span class="day-symbol" aria-hidden="true">${cell.status==='clean'?'✓':cell.status==='used'?'×':'·'}</span>${cell.note?'<i class="note-dot" aria-hidden="true"></i>':''}</button>`:'<span class="calendar-empty" aria-hidden="true"></span>').join('')}</div><div class="calendar-legend"><span><i class="legend-clean"></i>Não bebeu</span><span><i class="legend-used"></i>Bebeu</span><span><i class="legend-unmarked"></i>Sem registro</span><span><i class="legend-future"></i>Futuro</span></div><p class="calendar-tip">Toque nos dias que já passaram para anotar ou corrigir.</p></section>
    <div class="home-bottom-grid"><section class="home-savings ${stats.configured?'has-calculation':'needs-calculation'}">${stats.configured?`<div class="savings-heading"><span>SEU GASTO EVITADO</span><button id="money-edit">Editar cálculo</button></div><h3>${escapeHtml(monthName(month))}</h3><div class="saved-amount">${money(stats.savedMonth)}</div><p class="savings-basis">Estimativa em ${stats.clean} ${stats.clean===1?'dia registrado':'dias registrados'} sem consumo.</p>${month===today.slice(0,7)?`<div class="today-saving"><span>Hoje</span><strong>${money(stats.savedToday)}</strong><small>${current?.status==='clean'?'já entrou na estimativa do mês':current?.status==='used'?'registrado com consumo':'aguardando seu registro'}</small></div>`:''}<div class="savings-secondary"><div><span>Média por dia sem consumo</span><strong>${money(stats.daily)}</strong></div><div><span>Desde o primeiro registro</span><strong>${money(stats.savedTotal)}</strong></div></div><p class="savings-explanation">Gasto evitado estimado a partir do seu hábito informado. Não é saldo em dinheiro.</p>`:`<h3>Veja o que você está evitando gastar.</h3><p>Informe seu gasto e veja a estimativa crescer nos dias sem consumo.</p><button class="primary-btn" id="money-edit">Calcular meu gasto</button>`}</section>
    <section class="card home-month-summary"><div class="home-section-head"><div><span>SUA EVOLUÇÃO</span><h3>O que seus registros mostram</h3></div></div><div class="month-number-grid"><div class="month-number clean"><strong>${stats.clean}</strong><span>dias sem beber</span></div><div class="month-number used"><strong>${stats.used}</strong><span>dias com consumo</span></div><div class="month-number unmarked"><strong>${stats.unknown}</strong><span>dias sem registro</span></div></div><div class="month-track" role="img" aria-label="${stats.percent}% dos dias registrados sem consumo"><span style="width:${stats.percent}%"></span></div><p>${stats.recorded?`<strong>${stats.percent}% dos dias que você registrou</strong> foram sem consumo.`:'Seu primeiro registro já começa a construir esse acompanhamento.'}</p><p class="month-context">${escapeHtml(monthName(month))}. Dias sem registro não contam como dias sem consumo.</p><div class="home-routine"><div><span>ROTINA DE HOJE</span><strong>${summary.routine.done} de ${summary.routine.total} hábitos concluídos</strong></div><button id="go-routine" aria-label="Abrir rotina">→</button></div></section></div></div>`;
  },
  bind(ctx) {
    const {state,endpoints,mutate,openModal,navigate,redraw}=ctx;
    const today=state.summary.today||todayISO(),month=state.ui.homeMonth;
    async function register(status) {
      if(state.store.checkins[today]?.status===status)return;
      await mutate(()=>endpoints.checkin({date:today,status,note:state.store.checkins[today]?.note||''}),status==='clean'?'Registrado: hoje você não bebeu. Sua evolução foi atualizada.':'Registro salvo. Seu histórico continua completo.');
    }
    $('#checkin-clean').addEventListener('click',()=>register('clean'));
    $('#checkin-used').addEventListener('click',()=>register('used'));
    $('#month-prev').addEventListener('click',()=>{state.ui.homeMonth=adjacentMonth(month,-1);redraw();});
    $('#month-next').addEventListener('click',()=>{const next=adjacentMonth(month,1);if(next<=today.slice(0,7)){state.ui.homeMonth=next;redraw();}});
    $('#go-routine').addEventListener('click',()=>navigate('rotina'));
    function editDay(date,chooseDate=false) {
      const item=state.store.checkins[date];
      openModal({title:chooseDate?'Escolher um dia':`Registro de ${dateLabel(date)}`,subtitle:'Seu histórico guarda cada dia e suas anotações.',content:`${chooseDate?`<div class="field"><label for="record-date">Dia</label><input id="record-date" type="date" max="${today}" value="${date}" required></div>`:''}<div class="field"><label for="record-status">Você bebeu nesse dia?</label><select id="record-status" required><option value="">Escolha uma resposta</option><option value="clean" ${item?.status==='clean'?'selected':''}>Não bebi</option><option value="used" ${item?.status==='used'?'selected':''}>Bebi</option></select></div><div class="field"><label for="record-note">Sua anotação (opcional)</label><textarea id="record-note" maxlength="500" placeholder="Como foi o dia?">${escapeHtml(item?.note||'')}</textarea></div><button class="primary-btn" id="record-save">Salvar registro</button>`,onOpen({close}) {
        $('#record-date')?.addEventListener('change',()=>{const row=state.store.checkins[$('#record-date').value];$('#record-status').value=row?.status||'';$('#record-note').value=row?.note||'';});
        $('#record-save').addEventListener('click',async()=>{
          if(!$('#record-status').reportValidity()||($('#record-date')&&!$('#record-date').reportValidity()))return;
          const ok=await mutate(()=>endpoints.checkin({date:$('#record-date')?.value||date,status:$('#record-status').value,note:$('#record-note').value}),'Registro salvo. Calendário e evolução atualizados.');if(ok)close();
        });
      }});
    }
    $$('[data-calendar-date]').forEach(button=>button.addEventListener('click',()=>editDay(button.dataset.calendarDate)));
    $('#today-note').addEventListener('click',()=>editDay(today));
    $('#history-open').addEventListener('click',()=>editDay(today,true));
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
