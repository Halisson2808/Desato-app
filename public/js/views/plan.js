import { $, $$, escapeHtml } from '../utils.js';
import { TASK_GROUPS, PLAN_SLOTS, PLAN_MAX, TASK_MAX_LENGTH, NAME_MAX_LENGTH, activeSession, skippedTasks, planName } from '../content/coping.js';

// Aba Plano: a pessoa monta até 2 planos com nome. Na lista aparecem só os nomes;
// as tarefas aparecem quando ela abre um plano.
// Cada vez começa desmarcada; uma vez em andamento continua por algumas horas se a pessoa sair.

const chip = (task, on) => `<button type="button" class="plan-chip ${on ? 'on' : ''}" data-task="${escapeHtml(task)}" aria-pressed="${on}">${escapeHtml(task)}</button>`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function listHtml(plans) {
  const free = PLAN_SLOTS.find(slot => !plans.some(plan => plan.slot === slot));
  return `
    <div class="plan-screen">
      <div class="screen-title"><h2>Meus planos</h2><p>${plans.length ? 'Escolha o plano que você vai seguir agora.' : `Monte até ${PLAN_SLOTS.length} planos com o que você vai fazer quando a vontade aparecer.`}</p></div>
      <section class="plan-picks">
        ${plans.map(plan => `
          <button class="plan-pick" data-open="${plan.slot}">
            <span class="plan-pick-icon" aria-hidden="true">${plan.slot}</span>
            <span class="plan-pick-body"><strong>${escapeHtml(planName(plan))}</strong><small>${activeSession(plan) ? 'Em andamento — toque para continuar' : 'Pronto para usar'}</small></span>
            <span class="plan-pick-arrow" aria-hidden="true">›</span>
          </button>`).join('')}
        ${free ? `<button class="plan-add" data-create="${free}">+ ${plans.length ? 'Criar outro plano' : 'Criar meu primeiro plano'}</button>` : ''}
      </section>
    </div>`;
}

function detailHtml(plan) {
  const hint = skippedTasks(plan);
  return `
    <div class="plan-screen">
      <button class="plan-back" id="plan-back">‹ Meus planos</button>
      <section class="plan-hero">
        <span>PLANO ${plan.slot}</span>
        <strong>${escapeHtml(planName(plan))}</strong>
        <p>${plural(plan.tasks.length, 'tarefa', 'tarefas')} que você mesmo escolheu.</p>
        <button class="plan-go" id="plan-start">Começar agora</button>
      </section>
      ${hint.length ? `<p class="plan-hint">Você tem pulado <strong>${hint.map(escapeHtml).join(', ')}</strong>. Que tal trocar por algo que você faria de verdade?</p>` : ''}
      <section class="plan-list">
        <h3>Tarefas</h3>
        <ol class="plan-tasks">${plan.tasks.map(task => `<li>${escapeHtml(task)}</li>`).join('')}</ol>
        <button class="plan-add" id="plan-edit">Editar plano</button>
        <button class="plan-cancel" id="plan-delete">Excluir plano</button>
      </section>
    </div>`;
}

function editorHtml(draft, isNew) {
  const catalog = TASK_GROUPS.flatMap(group => group.tasks);
  const custom = draft.tasks.filter(task => !catalog.includes(task));
  return `
    <div class="plan-screen">
      <div class="screen-title"><h2>${isNew ? 'Criar plano' : 'Editar plano'}</h2><p>Escolha até ${PLAN_MAX} coisas para fazer quando a vontade aparecer. Monte agora, com calma — na hora é só seguir.</p></div>
      <section class="plan-editor">
        <label for="plan-name">Nome do plano</label>
        <input id="plan-name" maxlength="${NAME_MAX_LENGTH}" value="${escapeHtml(draft.name)}" placeholder="Plano ${draft.slot}">
        <p class="plan-count" aria-live="polite"><strong>${draft.tasks.length}</strong> de ${PLAN_MAX} tarefas escolhidas</p>
        ${TASK_GROUPS.map(group => `<label>${escapeHtml(group.title)}</label><div class="plan-chips">${group.tasks.map(task => chip(task, draft.tasks.includes(task))).join('')}</div>`).join('')}
        <label for="plan-custom">Outra coisa que funciona para você</label>
        ${custom.length ? `<div class="plan-chips">${custom.map(task => chip(task, true)).join('')}</div>` : ''}
        <div class="plan-custom"><input id="plan-custom" maxlength="${TASK_MAX_LENGTH}" placeholder="Ex.: assistir um culto no YouTube"><button type="button" id="plan-custom-add">Adicionar</button></div>
        <button class="primary-btn" id="plan-save">Salvar plano</button>
        <button class="plan-cancel" id="plan-cancel">Cancelar</button>
      </section>
    </div>`;
}

function runHtml(plan, run) {
  const all = run.done.length === plan.tasks.length;
  return `
    <section class="ritual"><div class="ritual-top"><span>${escapeHtml(planName(plan))} · ${run.done.length}/${plan.tasks.length}</span><button id="run-close">Sair</button></div>
      <div class="ritual-body">
        <h2>Siga seu plano</h2>
        <p>Você decidiu isso com a cabeça fria. Faça uma de cada vez e marque.</p>
        <div class="ritual-checks">${plan.tasks.map(task => { const on = run.done.includes(task); return `<button class="ritual-check ${on ? 'on' : ''}" data-check="${escapeHtml(task)}" aria-pressed="${on}"><span>${on ? '✓' : ''}</span>${escapeHtml(task)}</button>`; }).join('')}</div>
        <button class="ritual-next" id="run-finish">${all ? 'Fiz tudo!' : 'Terminei'}</button>
      </div></section>`;
}

const doneHtml = count => `
  <section class="ritual"><div class="ritual-body">
    <div class="ritual-done">✓</div>
    <h2>${count ? 'Você seguiu seu plano.' : 'Você parou para pensar antes.'}</h2>
    <p>${count ? `Fez ${plural(count, 'tarefa', 'tarefas')}. Da próxima vez ele vai estar aqui, do mesmo jeito.` : 'Isso já conta. Da próxima vez, tente fazer pelo menos uma tarefa.'}</p>
    <button class="ritual-next" id="run-home">Voltar aos meus planos</button>
  </div></section>`;

export const planView = {
  html({ state }) {
    const plans = state.store.plans || [];
    const ui = state.ui.plan ||= {};
    if (ui.finished !== undefined) return doneHtml(ui.finished);
    if (ui.draft) return editorHtml(ui.draft, !plans.some(plan => plan.slot === ui.draft.slot));
    const plan = plans.find(item => item.slot === ui.open);
    if (!plan) return listHtml(plans);
    if (ui.running) return runHtml(plan, ui.run);
    return detailHtml(plan);
  },
  bind({ state, redraw, toast, mutate, endpoints }) {
    const plans = state.store.plans || [];
    const ui = state.ui.plan;
    const plan = plans.find(item => item.slot === ui.open);
    const reset = () => { state.ui.plan = {}; redraw(); };

    $('#run-home')?.addEventListener('click', reset);

    if (ui.draft) {
      const draft = ui.draft;
      const keepName = () => { draft.name = $('#plan-name').value; };
      const toggle = task => {
        keepName();
        if (draft.tasks.includes(task)) draft.tasks = draft.tasks.filter(item => item !== task);
        else if (draft.tasks.length >= PLAN_MAX) { toast(`Escolha no máximo ${PLAN_MAX}. Um plano curto é mais fácil de seguir.`); return; }
        else draft.tasks.push(task);
        redraw();
      };
      $$('[data-task]').forEach(button => button.addEventListener('click', () => toggle(button.dataset.task)));
      const addCustom = () => {
        const value = $('#plan-custom').value.trim().replace(/\s+/g, ' ');
        if (value && !draft.tasks.includes(value)) toggle(value);
      };
      $('#plan-custom-add').addEventListener('click', addCustom);
      $('#plan-custom').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addCustom(); } });
      $('#plan-cancel').addEventListener('click', () => { ui.draft = null; redraw(); });
      $('#plan-save').addEventListener('click', async () => {
        keepName();
        if (!draft.tasks.length) { toast('Escolha pelo menos uma tarefa.'); return; }
        const { slot, name, tasks } = draft;
        if (await mutate(() => endpoints.plan(slot, { name: name.trim(), tasks }), 'Plano salvo. Ele vai estar aqui sempre que precisar.')) { state.ui.plan = { open: slot }; redraw(); }
      });
      return;
    }

    if (!plan) {
      $$('[data-open]').forEach(button => button.addEventListener('click', () => {
        const slot = Number(button.dataset.open);
        const open = plans.find(item => item.slot === slot);
        const active = activeSession(open);
        // Uma vez em andamento abre direto no checklist.
        state.ui.plan = active ? { open: slot, running: true, run: { done: [...active.done] } } : { open: slot };
        redraw();
      }));
      $$('[data-create]').forEach(button => button.addEventListener('click', () => { ui.draft = { slot: Number(button.dataset.create), name: '', tasks: [] }; redraw(); }));
      return;
    }

    if (ui.running) {
      const run = ui.run;
      const save = () => endpoints.planSession(plan.slot, run.done).catch(() => toast('Não consegui salvar a marcação. Confira sua conexão.'));
      $$('[data-check]').forEach(button => button.addEventListener('click', () => {
        const task = button.dataset.check;
        run.done = run.done.includes(task) ? run.done.filter(item => item !== task) : [...run.done, task];
        plan.active = { startedAt: plan.active?.startedAt || new Date().toISOString(), done: run.done };
        save(); redraw();
      }));
      $('#run-close').addEventListener('click', reset);
      $('#run-finish').addEventListener('click', async () => {
        const count = run.done.length;
        if (await mutate(() => endpoints.planFinish(plan.slot, run.done))) { state.ui.plan = { finished: count }; redraw(); }
      });
      return;
    }

    $('#plan-back').addEventListener('click', reset);
    // Começar já registra a vez, para ela continuar se a pessoa sair e voltar.
    $('#plan-start').addEventListener('click', () => {
      plan.active = { startedAt: new Date().toISOString(), done: [] };
      ui.running = true; ui.run = { done: [] }; redraw();
      endpoints.planSession(plan.slot, []).catch(() => toast('Não consegui salvar. Confira sua conexão.'));
    });
    $('#plan-edit').addEventListener('click', () => { ui.draft = { slot: plan.slot, name: plan.name || '', tasks: [...plan.tasks] }; redraw(); });
    $('#plan-delete').addEventListener('click', async () => {
      if (!confirm(`Excluir "${planName(plan)}"?`)) return;
      if (await mutate(() => endpoints.planDelete(plan.slot), 'Plano excluído.')) reset();
    });
  }
};
