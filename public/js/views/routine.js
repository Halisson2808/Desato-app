import { $, $$, escapeHtml, todayISO } from '../utils.js';

const periodNames = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };
const periodHints = { manha: 'Comece o dia com ações simples.', tarde: 'Mantenha o corpo e a mente ocupados.', noite: 'Desacelere e encerre o dia com calma.' };

export const routineView = {
  html({ state }) {
    const { store, summary } = state;
    const date = todayISO();
    const completed = store.routine.completions[date] || {};
    const activeTasks = store.routine.tasks.filter(t => t.active !== false);
    const pct = summary.routine.total ? Math.round(summary.routine.done / summary.routine.total * 100) : 0;

    return `
      <div class="screen-title">
        <h2>Minha rotina</h2>
        <p>A rotina não mede o vício. Ela organiza pequenos hábitos para ajudar você a passar pelo dia.</p>
      </div>

      <section class="card progress-block">
        <div class="progress-row"><strong>${summary.routine.done} de ${summary.routine.total} concluídos</strong><span>${pct}%</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </section>

      <section class="section">
        <div class="segmented" id="period-tabs">
          <button data-period="manha" class="${state.ui.routinePeriod === 'manha' ? 'active' : ''}">Manhã</button>
          <button data-period="tarde" class="${state.ui.routinePeriod === 'tarde' ? 'active' : ''}">Tarde</button>
          <button data-period="noite" class="${state.ui.routinePeriod === 'noite' ? 'active' : ''}">Noite</button>
        </div>
        <div id="routine-periods">
          ${['manha','tarde','noite'].map((period, idx) => `
            <div class="routine-period ${state.ui.routinePeriod === period ? '' : 'hidden'}" data-period-panel="${period}">
              <div class="section-head"><div><h3>${periodNames[period]}</h3><p>${periodHints[period]}</p></div></div>
              <div class="task-list">
                ${activeTasks.filter(t => t.period === period).map(task => `
                  <div class="task ${completed[task.id] ? 'completed' : ''}" data-task-row="${task.id}">
                    <div class="task-icon">${escapeHtml(task.icon || '✓')}</div>
                    <div><div class="task-title">${escapeHtml(task.title)}</div><div class="task-meta">${periodNames[period]}</div></div>
                    <button class="check ${completed[task.id] ? 'checked' : ''}" data-task="${task.id}" aria-label="Marcar ${escapeHtml(task.title)}" aria-pressed="${Boolean(completed[task.id])}">${completed[task.id] ? '✓' : ''}</button>
                  </div>
                `).join('') || `<div class="empty">Nenhum hábito neste período.</div>`}
              </div>
              <button class="add-btn" data-add-task="${period}">+ Adicionar hábito</button>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><div><h3>Gerenciar rotina</h3><p>Escolha o que realmente faz sentido para você.</p></div></div>
        <div class="card settings-list">
          ${store.routine.tasks.map(task => `
            <button class="setting-row" data-manage-task="${task.id}">
              <div class="setting-icon">${escapeHtml(task.icon || '✓')}</div>
              <div class="setting-copy"><strong>${escapeHtml(task.title)}</strong><span>${periodNames[task.period]} · ${task.active !== false ? 'ativo' : 'pausado'}</span></div>
              <div class="chev">›</div>
            </button>
          `).join('')}
        </div>
      </section>

      <section class="section">
        <div class="notice success"><strong>Ideia central:</strong> você não precisa completar tudo. O registro principal de “consumi / não consumi” fica no Início; a Rotina é só apoio para o dia.</div>
      </section>
    `;
  },

  bind(ctx) {
    const { state, endpoints, mutate, openModal } = ctx;

    $$('#period-tabs button').forEach(btn => btn.addEventListener('click', () => {
      state.ui.routinePeriod = btn.dataset.period;
      $$('#period-tabs button').forEach(x => x.classList.toggle('active', x === btn));
      $$('[data-period-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.periodPanel !== btn.dataset.period));
    }));

    $$('[data-task]').forEach(btn => btn.addEventListener('click', async () => {
      const id = btn.dataset.task;
      const current = Boolean(state.store.routine.completions[todayISO()]?.[id]);
      await mutate(() => endpoints.completeTask({ taskId: id, completed: !current, date: todayISO() }));
    }));

    $$('[data-add-task]').forEach(btn => btn.addEventListener('click', () => openTaskCreator(ctx, btn.dataset.addTask)));
    $$('[data-manage-task]').forEach(btn => btn.addEventListener('click', () => openTaskEditor(ctx, btn.dataset.manageTask)));
  }
};

function openTaskCreator(ctx, period) {
  const { endpoints, mutate, openModal } = ctx;
  openModal({
    title: 'Adicionar hábito',
    subtitle: 'Prefira algo pequeno e realista, que possa caber no seu dia.',
    content: `
      <div class="field"><label>Hábito</label><input id="task-title" placeholder="Ex.: caminhar 10 minutos"></div>
      <div class="input-grid">
        <div class="field"><label>Período</label><select id="task-period"><option value="manha" ${period==='manha'?'selected':''}>Manhã</option><option value="tarde" ${period==='tarde'?'selected':''}>Tarde</option><option value="noite" ${period==='noite'?'selected':''}>Noite</option></select></div>
        <div class="field"><label>Ícone</label><input id="task-icon" value="✓" maxlength="4"></div>
      </div>
      <button class="primary-btn" id="create-task">Adicionar</button>
    `,
    onOpen({ close }) {
      $('#create-task')?.addEventListener('click', async () => {
        const title = $('#task-title').value.trim();
        if (!title) return;
        const ok = await mutate(() => endpoints.addTask({ title, period: $('#task-period').value, icon: $('#task-icon').value || '✓' }), 'Hábito adicionado.');
        if (ok) close();
      });
    }
  });
}

function openTaskEditor(ctx, id) {
  const { state, endpoints, mutate, openModal } = ctx;
  const task = state.store.routine.tasks.find(t => t.id === id);
  if (!task) return;
  openModal({
    title: 'Editar hábito',
    subtitle: 'A rotina pode mudar com você.',
    content: `
      <div class="field"><label>Hábito</label><input id="edit-task-title" value="${escapeHtml(task.title)}"></div>
      <div class="input-grid">
        <div class="field"><label>Período</label><select id="edit-task-period"><option value="manha" ${task.period==='manha'?'selected':''}>Manhã</option><option value="tarde" ${task.period==='tarde'?'selected':''}>Tarde</option><option value="noite" ${task.period==='noite'?'selected':''}>Noite</option></select></div>
        <div class="field"><label>Ícone</label><input id="edit-task-icon" value="${escapeHtml(task.icon || '✓')}" maxlength="4"></div>
      </div>
      <button class="secondary-btn" id="toggle-task">${task.active !== false ? 'Pausar hábito' : 'Reativar hábito'}</button>
      <div class="btn-row"><button class="danger-btn" id="delete-task">Excluir</button><button class="primary-btn" id="save-task">Salvar</button></div>
    `,
    onOpen({ close }) {
      $('#save-task')?.addEventListener('click', async () => {
        const ok = await mutate(() => endpoints.patchTask(id, { title: $('#edit-task-title').value, period: $('#edit-task-period').value, icon: $('#edit-task-icon').value }), 'Hábito atualizado.');
        if (ok) close();
      });
      $('#toggle-task')?.addEventListener('click', async () => {
        const ok = await mutate(() => endpoints.patchTask(id, { active: task.active === false }), task.active !== false ? 'Hábito pausado.' : 'Hábito reativado.');
        if (ok) close();
      });
      $('#delete-task')?.addEventListener('click', async () => {
        if (!confirm('Excluir este hábito da rotina?')) return;
        const ok = await mutate(() => endpoints.deleteTask(id), 'Hábito excluído.');
        if (ok) close();
      });
    }
  });
}
