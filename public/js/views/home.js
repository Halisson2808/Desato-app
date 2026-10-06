import { $, $$, money, shortMoney, todayISO, escapeHtml, dateLabel } from '../utils.js';

function calcMoney(perOuting, outingsPerWeek, cleanDays) {
  const weekly = perOuting * outingsPerWeek;
  const monthly = weekly * 52 / 12;
  const annual = weekly * 52;
  const daily = annual / 365;
  return { weekly, monthly, annual, saved: daily * cleanDays };
}

function last7(store) {
  const out = [];
  const labels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    const key = `${y}-${m}-${day}`;
    const status = store.checkins[key]?.status;
    out.push({ label: labels[d.getDay()], status, height: status === 'clean' ? 80 : status === 'used' ? 28 : 12 });
  }
  return out;
}

function milestone(streak) {
  const marks = [1,3,7,14,30,60,90,180,365];
  const next = marks.find(x => x > streak) || (Math.floor(streak / 365) + 1) * 365;
  const prev = [...marks].reverse().find(x => x <= streak) || 0;
  const pct = next === prev ? 100 : Math.max(4, Math.min(100, ((streak - prev) / (next - prev)) * 100));
  return { next, prev, pct, remaining: Math.max(0, next - streak) };
}

export const homeView = {
  html({ state }) {
    const { store, summary } = state;
    const m = milestone(summary.streak);
    const today = summary.todayCheckin;
    const routinePct = summary.routine.total ? Math.round(summary.routine.done / summary.routine.total * 100) : 0;
    const recorded = summary.month.clean + summary.month.used;
    const monthPct = recorded ? Math.round(summary.month.clean / recorded * 100) : 0;
    const chart = last7(store);

    return `
      <div class="screen-title">
        <h2>Seu progresso</h2>
        <p>O principal fica aqui: registrar o dia e enxergar o que está mudando.</p>
      </div>

      <section class="card hero-card">
        <div class="hero-kicker">Sequência de dias registrados sem consumo</div>
        <div class="hero-number"><strong>${summary.streak}</strong><span>${summary.streak === 1 ? 'dia' : 'dias'}</span></div>
        <div class="hero-sub">${today ? (today.status === 'clean' ? 'Hoje já está registrado como um dia sem consumo.' : 'Hoje foi registrado com consumo. Amanhã é um novo registro.') : 'Como foi o seu dia hoje?'}</div>
        <div class="hero-actions">
          <button class="hero-btn ${today?.status === 'clean' ? 'done' : 'primary'}" id="checkin-clean">${today?.status === 'clean' ? '✓ Hoje não consumi' : 'Não consumi hoje'}</button>
          <button class="hero-btn ${today?.status === 'used' ? 'done' : ''}" id="checkin-used">${today?.status === 'used' ? '✓ Registrei consumo' : 'Consumi hoje'}</button>
        </div>
      </section>

      <div class="stat-grid">
        <div class="stat-card"><div class="icon">📆</div><strong>${summary.month.clean}/${summary.month.elapsed}</strong><span>dias sem consumo neste mês</span></div>
        <div class="stat-card"><div class="icon">🏆</div><strong>${summary.cleanDaysTotal}</strong><span>dias positivos registrados no total</span></div>
      </div>

      <div class="home-grid-two">
      <section class="section">
        <div class="section-head"><div><h3>Dinheiro economizado</h3><p>Estimativa baseada no seu gasto habitual.</p></div></div>
        <div class="card money-card">
          <div class="money-main">
            <div class="money-icon">🐷</div>
            <div class="money-copy"><span class="label">Você evitou gastar aproximadamente</span><strong>${money(summary.money.saved)}</strong><small>em ${summary.money.cleanDays} dias sem consumo</small></div>
            <button class="money-edit" id="money-edit">Calcular</button>
          </div>
          <div class="money-compare">
            <div><strong>${shortMoney(summary.money.weekly)}</strong><span>por semana</span></div>
            <div><strong>${shortMoney(summary.money.monthly)}</strong><span>por mês</span></div>
            <div><strong>${shortMoney(summary.money.annual)}</strong><span>por ano</span></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><div><h3>Próxima conquista</h3><p>Sem apagar o progresso que já foi construído.</p></div></div>
        <div class="card progress-block">
          <div class="progress-row"><strong>${m.next} dias</strong><span>${m.remaining ? `faltam ${m.remaining}` : 'concluído'}</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${m.pct}%"></div></div>
        </div>
      </section>

      </div>

      <div class="home-grid-two">
      <section class="section">
        <div class="section-head"><div><h3>Sua evolução</h3><p>Últimos 7 dias; dias sem registro aparecem menores.</p></div><div><button class="section-link" id="history-open">Histórico</button> <button class="section-link" id="evolution-info">Entender</button></div></div>
        <div class="card">
          <div class="mini-chart">
            ${chart.map(x => `<div class="chart-col"><div class="chart-bar-wrap"><div class="chart-bar" title="${x.status === 'clean' ? 'Sem consumo' : x.status === 'used' ? 'Com consumo' : 'Sem registro'}" style="height:${x.height}%;background:${x.status === 'used' ? 'var(--warning)' : x.status ? 'var(--primary-2)' : 'var(--line)'}"></div></div><div class="chart-label">${x.label}</div></div>`).join('')}
          </div>
          <div class="divider"></div>
          <div class="progress-row"><strong>${monthPct}% dos dias registrados sem consumo</strong><span>${summary.month.used} ${summary.month.used === 1 ? 'dia com consumo' : 'dias com consumo'}</span></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><div><h3>Rotina de hoje</h3><p>Pequenos hábitos para ocupar e organizar o dia.</p></div><button class="section-link" id="go-routine">Abrir rotina</button></div>
        <div class="card routine-summary">
          <div class="ring" style="--pct:${routinePct}%"><strong>${summary.routine.done}/${summary.routine.total}</strong></div>
          <div><h4>${routinePct === 100 && summary.routine.total ? 'Rotina concluída 🎉' : 'Continue no seu ritmo'}</h4><p>${summary.routine.total ? `${summary.routine.total - summary.routine.done} hábito(s) ainda disponíveis hoje.` : 'Adicione hábitos simples para o seu dia.'}</p></div>
        </div>
      </section>

      </div>

      <section class="section compact-safety-note">
        <div class="card notice warning"><strong>Importante:</strong> em caso de sintomas físicos intensos ou emergência, procure atendimento imediatamente.</div>
      </section>
    `;
  },

  bind(ctx) {
    const { state, endpoints, mutate, openModal, navigate } = ctx;
    const todayStatus = state.summary.todayCheckin?.status;

    $('#checkin-clean')?.addEventListener('click', async () => {
      if (todayStatus === 'clean') return;
      await mutate(() => endpoints.checkin({ status: 'clean', date: todayISO() }), 'Dia registrado. Continue um passo de cada vez.');
    });

    $('#checkin-used')?.addEventListener('click', () => {
      openModal({
        title: 'Registrar o dia',
        subtitle: 'O registro serve para acompanhar o processo, não para apagar o que você já conquistou.',
        content: `
          <div class="notice success">Seu histórico continuará mostrando todos os dias positivos anteriores.</div>
          <div class="field" style="margin-top:14px"><label>Quer anotar o que aconteceu? (opcional)</label><textarea id="used-note" placeholder="Ex.: encontrei amigos, fiquei ansioso, foi depois do trabalho..."></textarea></div>
          <button class="primary-btn" id="confirm-used">Salvar registro de hoje</button>
        `,
        onOpen({ close }) {
          $('#confirm-used')?.addEventListener('click', async () => {
            const note = $('#used-note').value;
            const ok = await mutate(() => endpoints.checkin({ status: 'used', date: todayISO(), note }), 'Registro salvo.');
            if (ok) close();
          });
        }
      });
    });

    $('#money-edit')?.addEventListener('click', () => {
      const current = state.store.money;
      const cleanDays = state.summary.cleanDaysTotal;
      openModal({
        title: 'Calculadora de economia',
        subtitle: 'Informe quanto costuma gastar quando sai para beber e quantas vezes isso acontece por semana.',
        content: `
          <div class="input-grid">
            <div class="field"><label>Gasto por saída</label><input id="spend" type="number" inputmode="decimal" min="0" max="1000000" step="0.01" value="${current.spendPerOuting}"></div>
            <div class="field"><label>Vezes por semana</label><input id="times" type="number" inputmode="decimal" min="0" max="14" step="0.5" value="${current.outingsPerWeek}"></div>
          </div>
          <div class="calc-preview" id="calc-preview"></div>
          <div class="notice success">A economia exibida no Início usa uma média diária do gasto anual estimado e multiplica pelos seus dias sem consumo.</div>
          <button class="primary-btn" id="save-money" style="margin-top:12px">Salvar cálculo</button>
        `,
        onOpen({ close }) {
          const updatePreview = () => {
            const p = Math.max(0, Number($('#spend').value) || 0);
            const t = Math.max(0, Number($('#times').value) || 0);
            const c = calcMoney(p, t, cleanDays);
            $('#calc-preview').innerHTML = `<span>Com esses valores, seu gasto estimado seria</span><strong>${money(c.monthly)} por mês</strong><div class="calc-grid"><div><span>Semana</span><strong>${money(c.weekly)}</strong></div><div><span>Ano</span><strong>${money(c.annual)}</strong></div><div><span>Já economizado</span><strong>${money(c.saved)}</strong></div><div><span>Dias positivos</span><strong>${cleanDays}</strong></div></div>`;
          };
          $('#spend').addEventListener('input', updatePreview);
          $('#times').addEventListener('input', updatePreview);
          updatePreview();
          $('#save-money').addEventListener('click', async () => {
            if (!$('#spend').reportValidity() || !$('#times').reportValidity()) return;
            const body = { spendPerOuting: Number($('#spend').value) || 0, outingsPerWeek: Number($('#times').value) || 0 };
            const ok = await mutate(() => endpoints.money(body), 'Cálculo atualizado.');
            if (ok) close();
          });
        }
      });
    });

    $('#go-routine')?.addEventListener('click', () => navigate('rotina'));
    $('#history-open')?.addEventListener('click', () => {
      const entries = Object.entries(state.store.checkins).sort(([a], [b]) => b.localeCompare(a));
      openModal({
        title: 'Histórico de registros',
        subtitle: 'Consulte suas anotações e corrija um dia quando necessário.',
        content: `
          <div class="field"><label for="history-date">Dia</label><input id="history-date" type="date" max="${todayISO()}" value="${todayISO()}"></div>
          <div class="field"><label for="history-status">Registro</label><select id="history-status"><option value="clean">Não consumi</option><option value="used">Consumi</option></select></div>
          <div class="field"><label for="history-note">Anotação (opcional)</label><textarea id="history-note" maxlength="500"></textarea></div>
          <button class="primary-btn" id="history-save">Salvar dia</button>
          <div class="reason-list" style="margin-top:16px">
            ${entries.map(([date, item]) => `<button class="reason" data-history-date="${escapeHtml(date)}" style="text-align:left"><strong>${escapeHtml(dateLabel(date))} · ${item.status === 'clean' ? 'Sem consumo' : 'Com consumo'}</strong>${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}</button>`).join('') || '<p class="empty">Ainda não há registros.</p>'}
          </div>
        `,
        onOpen({ close }) {
          const load = () => {
            const item = state.store.checkins[$('#history-date').value];
            $('#history-status').value = item?.status || 'clean';
            $('#history-note').value = item?.note || '';
          };
          $('#history-date').addEventListener('change', load);
          $$('[data-history-date]').forEach(button => button.addEventListener('click', () => {
            $('#history-date').value = button.dataset.historyDate;
            load();
            $('#history-date').focus();
          }));
          load();
          $('#history-save').addEventListener('click', async () => {
            const date = $('#history-date');
            if (!date.value || !date.reportValidity()) return;
            const ok = await mutate(() => endpoints.checkin({ date: date.value, status: $('#history-status').value, note: $('#history-note').value }), 'Dia salvo.');
            if (ok) close();
          });
        }
      });
    });
    $('#evolution-info')?.addEventListener('click', () => {
      openModal({
        title: 'Como ler sua evolução',
        subtitle: 'O objetivo é mostrar tendência, não exigir perfeição.',
        content: `
          <div class="reason-list">
            <div class="reason"><strong>Dias sem consumo:</strong> mostram seus registros positivos.</div>
            <div class="reason"><strong>Dias com consumo:</strong> continuam no histórico sem apagar os dias anteriores.</div>
            <div class="reason"><strong>Rotina e economia:</strong> ajudam a enxergar ganhos que vão além da sequência.</div>
          </div>
        `
      });
    });
  }
};
