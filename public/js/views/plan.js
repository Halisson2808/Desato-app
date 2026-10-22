import { $, $$, escapeHtml } from '../utils.js';
import { TASK_GROUPS, PLAN_MAX, TASK_MAX_LENGTH, activeSession, skippedTasks } from '../content/coping.js';

// Aba Plano: a pessoa monta, com calma, a lista do que fazer quando a vontade aparecer.
// Vontade leve → segue o plano. Vontade forte → SOS.
// Cada vez começa desmarcada; uma vez em andamento continua por algumas horas se a pessoa sair.

const chip = (task, on) => `<button type="button" class="plan-chip ${on ? 'on' : ''}" data-task="${escapeHtml(task)}" aria-pressed="${on}">${escapeHtml(task)}</button>`;

function editorHtml(draft, hasPlan) {
  const catalog = TASK_GROUPS.flatMap(group => group.tasks);
  const custom = draft.filter(task => !catalog.includes(task));
  return `
    <div class="plan-screen">
      <div class="screen-title"><h2>${hasPlan ? 'Editar meu plano' : 'Monte seu plano'}</h2><p>Escolha até ${PLAN_MAX} coisas que você vai fazer quando a vontade aparecer. Monte agora, com calma — na hora é só seguir.</p></div>
      <section class="plan-editor">
        <p class="plan-count" aria-live="polite"><strong>${draft.length}</strong> de ${PLAN_MAX} escolhidas</p>
        ${TASK_GROUPS.map(group => `<label>${escapeHtml(group.title)}</label><div class="plan-chips">${group.tasks.map(task => chip(task, draft.includes(task))).join('')}</div>`).join('')}
        <label for="plan-custom">Outra coisa que funciona para você</label>
        ${custom.length ? `<div class="plan-chips">${custom.map(task => chip(task, true)).join('')}</div>` : ''}
        <div class="plan-custom"><input id="plan-custom" maxlength="${TASK_MAX_LENGTH}" placeholder="Ex.: assistir um culto no YouTube"><button type="button" id="plan-custom-add">Adicionar</button></div>
        <button class="primary-btn" id="plan-save">Salvar meu plano</button>
        ${hasPlan ? '<button class="plan-cancel" id="plan-cancel">Cancelar</button>' : ''}
      </section>
    </div>`;
}

function homeHtml(plan) {
  const hint = skippedTasks(plan);
  return `
    <div class="plan-screen">
      <div class="screen-title"><h2>Meu plano</h2><p>Para quando a vontade aparecer, mas ainda dá para segurar.</p></div>
      <section class="plan-hero">
        <span>ESTOU COM VONTADE</span>
        <strong>Siga seu plano</strong>
        <p>${plan.tasks.length} ${plan.tasks.length === 1 ? 'tarefa' : 'tarefas'} que você mesmo escolheu.</p>
        <button class="plan-go" id="plan-start">Começar agora</button>
        <button class="plan-sos" id="plan-sos">A vontade está forte demais → SOS</button>
      </section>
      ${plan.uses ? `<p class="plan-stats">Você usou seu plano <strong>${plan.uses} ${plan.uses === 1 ? 'vez' : 'vezes'}</strong>${plan.wins ? ` e a vontade passou em <strong>${plan.wins}</strong>` : ''}.</p>` : ''}
      ${hint.length ? `<p class="plan-hint">Você tem pulado <strong>${hint.map(escapeHtml).join(', ')}</strong>. Que tal trocar por algo que você faria de verdade?</p>` : ''}
      <section class="plan-list">
        <h3>Minhas tarefas</h3>
        <ol class="plan-tasks">${plan.tasks.map(task => `<li>${escapeHtml(task)}</li>`).join('')}</ol>
        <button class="plan-add" id="plan-edit">Editar meu plano</button>
      </section>
    </div>`;
}

function runHtml(plan, run) {
  const all = run.done.length === plan.tasks.length;
  if (run.asking) return `
    <section class="ritual"><div class="ritual-top"><span>Meu plano</span><button id="run-back">Voltar</button></div>
      <div class="ritual-body">
        <h2>A vontade passou?</h2>
        <p>Você fez ${run.done.length} de ${plan.tasks.length}. ${run.done.length ? 'Cada uma conta.' : 'Tudo bem, você parou para pensar antes — isso já conta.'}</p>
        <button class="ritual-next" id="run-yes">Sim, passou</button>
        <button class="ritual-alt" id="run-no">Ainda não → SOS</button>
      </div></section>`;
  return `
    <section class="ritual"><div class="ritual-top"><span>Meu plano · ${run.done.length}/${plan.tasks.length}</span><button id="run-close">Sair</button></div>
      <div class="ritual-body">
        <h2>Siga seu plano</h2>
        <p>Você decidiu isso com a cabeça fria. Faça uma de cada vez e marque.</p>
        <div class="ritual-checks">${plan.tasks.map(task => { const on = run.done.includes(task); return `<button class="ritual-check ${on ? 'on' : ''}" data-check="${escapeHtml(task)}" aria-pressed="${on}"><span>${on ? '✓' : ''}</span>${escapeHtml(task)}</button>`; }).join('')}</div>
        <button class="ritual-next" id="run-finish">${all ? 'Fiz tudo!' : 'Terminei'}</button>
      </div></section>`;
}

const doneHtml = passed => `
  <section class="ritual"><div class="ritual-body">
    <div class="ritual-done">✓</div>
    <h2>${passed ? 'Você atravessou essa vontade.' : 'Você não ficou parado.'}</h2>
    <p>${passed ? 'Seu plano funcionou. Da próxima vez ele vai estar aqui, do mesmo jeito.' : 'Seguir o plano já foi um passo. Se precisar, o SOS está a um toque.'}</p>
    <button class="ritual-next" id="run-home">Voltar ao meu plano</button>
  </div></section>`;

export const planView = {
  html({ state }) {
    const plan = state.store.plan;
    const ui = state.ui.plan ||= {};
    if (ui.finished !== undefined) return doneHtml(ui.finished);
    if (!plan || ui.draft) return editorHtml(ui.draft ||= [...(plan?.tasks || [])], Boolean(plan));
    const active = activeSession(plan);
    if (ui.running || active) {
      ui.run ||= { done: [...(active?.done || [])] };
      ui.running = true;
      return runHtml(plan, ui.run);
    }
    return homeHtml(plan);
  },
  bind({ state, redraw, navigate, toast, mutate, endpoints }) {
    const plan = state.store.plan;
    const ui = state.ui.plan;
    const reset = () => { state.ui.plan = {}; redraw(); };

    $('#run-home')?.addEventListener('click', reset);

    if (ui.draft) {
      const toggle = task => {
        if (ui.draft.includes(task)) ui.draft = ui.draft.filter(item => item !== task);
        else if (ui.draft.length >= PLAN_MAX) { toast(`Escolha no máximo ${PLAN_MAX}. Um plano curto é mais fácil de seguir.`); return; }
        else ui.draft.push(task);
        redraw();
      };
      $$('[data-task]').forEach(button => button.addEventListener('click', () => toggle(button.dataset.task)));
      const addCustom = () => {
        const value = $('#plan-custom').value.trim().replace(/\s+/g, ' ');
        if (!value) return;
        if (!ui.draft.includes(value)) toggle(value);
      };
      $('#plan-custom-add').addEventListener('click', addCustom);
      $('#plan-custom').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addCustom(); } });
      $('#plan-cancel')?.addEventListener('click', reset);
      $('#plan-save').addEventListener('click', async () => {
        if (!ui.draft.length) { toast('Escolha pelo menos uma coisa para fazer.'); return; }
        const tasks = ui.draft;
        if (await mutate(() => endpoints.plan(tasks), 'Plano salvo. Ele vai estar aqui sempre que precisar.')) reset();
      });
      return;
    }

    if (ui.running) {
      const run = ui.run;
      const save = () => endpoints.planSession(run.done).catch(() => toast('Não consegui salvar a marcação. Confira sua conexão.'));
      $$('[data-check]').forEach(button => button.addEventListener('click', () => {
        const task = button.dataset.check;
        run.done = run.done.includes(task) ? run.done.filter(item => item !== task) : [...run.done, task];
        save(); redraw();
      }));
      $('#run-close')?.addEventListener('click', () => { state.ui.plan = {}; state.store.plan = { ...plan, active: { startedAt: plan.active?.startedAt || new Date().toISOString(), done: run.done } }; navigate('inicio'); });
      $('#run-finish')?.addEventListener('click', () => { run.asking = true; redraw(); });
      $('#run-back')?.addEventListener('click', () => { run.asking = false; redraw(); });
      const finish = async passed => {
        const ok = await mutate(() => endpoints.planFinish({ passed, done: run.done }));
        if (!ok) return;
        if (passed) { state.ui.plan = { finished: true }; redraw(); } else { state.ui.plan = {}; navigate('sos'); }
      };
      $('#run-yes')?.addEventListener('click', () => finish(true));
      $('#run-no')?.addEventListener('click', () => finish(false));
      return;
    }

    // Começar já registra a vez, para ela continuar se a pessoa sair e voltar.
    $('#plan-start')?.addEventListener('click', () => {
      ui.running = true; ui.run = { done: [] }; redraw();
      endpoints.planSession([]).catch(() => toast('Não consegui salvar. Confira sua conexão.'));
    });
    $('#plan-sos')?.addEventListener('click', () => navigate('sos'));
    $('#plan-edit')?.addEventListener('click', () => { ui.draft = [...plan.tasks]; redraw(); });
  }
};
