import { $, $$, escapeHtml } from '../utils.js';

// PRÉVIA (só administrador): a aba Plano do roteiro "respiro, espero, sigo meu plano".
// Ainda não grava no banco; os horários ficam só na memória da página.
const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const SITUATIONS = ['Depois do trabalho', 'Sozinho em casa', 'Com amigos', 'Estresse', 'Fim de semana'];
const ACTIONS = ['Tomar um banho', 'Caminhar 15 minutos', 'Ligar para alguém', 'Preparar algo para comer', 'Ver uma série', 'Ir dormir mais cedo'];
const WAIT_MINUTES = 10;

const demo = () => ({
  plans: [{ day: 5, time: '19:00', situation: 'Depois do trabalho', actions: ['Tomar um banho', 'Preparar algo para comer'], drink: 'Água com gás e limão', phrase: 'Hoje não, valeu.', wins: 2 }],
  editing: null, ritual: null
});

function nextPlan(plans) {
  const now = new Date();
  const score = plan => {
    const [h, m] = plan.time.split(':').map(Number);
    let diff = (plan.day - now.getDay() + 7) % 7;
    if (diff === 0 && h * 60 + m < now.getHours() * 60 + now.getMinutes()) diff = 7;
    return diff * 1440 + h * 60 + m;
  };
  return [...plans].sort((a, b) => score(a) - score(b))[0];
}

const chips = (items, selected, name, multi) => items.map(item => {
  const on = multi ? selected.includes(item) : selected === item;
  return `<button type="button" class="plan-chip ${on ? 'on' : ''}" data-${name}="${escapeHtml(item)}" aria-pressed="${on}">${escapeHtml(item)}</button>`;
}).join('');

export const planView = {
  html({ state }) {
    const p = state.ui.planPreview ||= demo();
    if (p.ritual) return ritualHtml(p);
    if (p.editing) return editorHtml(p.editing);
    const next = nextPlan(p.plans);
    return `
      <div class="plan-screen">
        <p class="plan-preview-tag">PRÉVIA · só você vê · ainda não salva</p>
        <div class="screen-title"><h2>Meu plano</h2><p>Quando o seu horário chega, você já sabe o que fazer.</p></div>
        ${next ? `
        <section class="plan-hero">
          <span>SEU PRÓXIMO HORÁRIO</span>
          <strong>${DAYS[next.day]} · ${next.time}</strong>
          <p>${escapeHtml(next.situation)}</p>
          <ol class="plan-steps-preview"><li>Respiro</li><li>Espero</li><li>Sigo meu plano</li></ol>
          <button class="plan-go" data-go="${p.plans.indexOf(next)}">Chegou a hora</button>
        </section>` : ''}
        <section class="plan-list">
          <h3>Meus horários de risco</h3>
          ${p.plans.map((plan, i) => `
            <article class="plan-card">
              <div class="plan-card-time"><strong>${DAYS[plan.day].slice(0, 3)}</strong><span>${plan.time}</span></div>
              <div class="plan-card-body">
                <strong>${escapeHtml(plan.situation)}</strong>
                <p>${plan.actions.map(escapeHtml).join(' · ')}</p>
                <small>${plan.wins ? `Funcionou ${plan.wins} ${plan.wins === 1 ? 'vez' : 'vezes'}` : 'Plano pronto'}</small>
              </div>
              <button class="plan-card-edit" data-edit="${i}" aria-label="Editar">✎</button>
            </article>`).join('')}
          <button class="plan-add" id="plan-add">+ Preparar outro horário</button>
        </section>
      </div>`;
  },
  bind(ctx) {
    const { state, redraw, navigate } = ctx;
    const p = state.ui.planPreview;
    if (p.ritual) return bindRitual(ctx, p);
    if (p.editing) return bindEditor(ctx, p);
    $$('[data-go]').forEach(b => b.addEventListener('click', () => { p.ritual = { plan: Number(b.dataset.go), step: 0, done: [] }; redraw(); }));
    $$('[data-edit]').forEach(b => b.addEventListener('click', () => { p.editing = { index: Number(b.dataset.edit), ...structuredClone(p.plans[b.dataset.edit]) }; redraw(); }));
    $('#plan-add').addEventListener('click', () => { p.editing = { index: -1, day: 5, time: '19:00', situation: SITUATIONS[0], actions: [], drink: '', phrase: '', wins: 0 }; redraw(); });
    void navigate;
  }
};

function editorHtml(e) {
  return `
    <div class="plan-screen">
      <p class="plan-preview-tag">PRÉVIA · só você vê · ainda não salva</p>
      <div class="screen-title"><h2>${e.index < 0 ? 'Preparar um horário' : 'Editar horário'}</h2><p>Monte agora, com calma. Na hora, é só seguir.</p></div>
      <section class="plan-editor">
        <label>1. Quando a vontade costuma bater?</label>
        <div class="plan-when"><select id="pe-day">${DAYS.map((d, i) => `<option value="${i}" ${i === e.day ? 'selected' : ''}>${d}</option>`).join('')}</select><input id="pe-time" type="time" value="${e.time}"></div>
        <label>2. Em que situação?</label>
        <div class="plan-chips">${chips(SITUATIONS, e.situation, 'situation', false)}</div>
        <label>3. O que você vai fazer no lugar?</label>
        <div class="plan-chips">${chips(ACTIONS, e.actions, 'action', true)}</div>
        <label for="pe-drink">4. O que vai beber no lugar?</label>
        <input id="pe-drink" value="${escapeHtml(e.drink)}" placeholder="Ex.: água com gás e limão">
        <label for="pe-phrase">5. Sua frase se alguém te chamar para beber</label>
        <input id="pe-phrase" value="${escapeHtml(e.phrase)}" placeholder="Ex.: Hoje não, valeu.">
        <button class="primary-btn" id="pe-save">Salvar meu plano</button>
        <button class="plan-cancel" id="pe-cancel">Cancelar</button>
      </section>
    </div>`;
}

function bindEditor({ redraw, toast }, p) {
  const e = p.editing;
  const keep = () => { e.day = Number($('#pe-day').value); e.time = $('#pe-time').value || '19:00'; e.drink = $('#pe-drink').value; e.phrase = $('#pe-phrase').value; };
  $$('[data-situation]').forEach(b => b.addEventListener('click', () => { keep(); e.situation = b.dataset.situation; redraw(); }));
  $$('[data-action]').forEach(b => b.addEventListener('click', () => { keep(); const a = b.dataset.action; e.actions = e.actions.includes(a) ? e.actions.filter(x => x !== a) : [...e.actions, a]; redraw(); }));
  $('#pe-cancel').addEventListener('click', () => { p.editing = null; redraw(); });
  $('#pe-save').addEventListener('click', () => {
    keep();
    if (!e.actions.length) { toast('Escolha pelo menos uma coisa para fazer no lugar.'); return; }
    const { index, ...plan } = e;
    if (index < 0) p.plans.push(plan); else p.plans[index] = plan;
    p.editing = null; redraw(); toast('Plano pronto para esse horário.');
  });
}

function ritualHtml(p) {
  const r = p.ritual, plan = p.plans[r.plan];
  const head = `<div class="ritual-top"><span>${DAYS[plan.day]} · ${plan.time}</span><button id="rt-close">Sair</button></div>
    <div class="ritual-progress">${['Respiro', 'Espero', 'Sigo meu plano'].map((s, i) => `<span class="${i < r.step ? 'done' : i === r.step ? 'on' : ''}"><i></i>${s}</span>`).join('')}</div>`;
  let body;
  if (r.step === 0) body = `<h2>Respire</h2><p>Puxe o ar em 4 segundos e solte em 6. Siga o círculo.</p><div class="ritual-breath"><div></div></div><button class="ritual-next" id="rt-next">Já respirei</button>`;
  else if (r.step === 1) body = `<h2>Espere</h2><p>A vontade sobe… e vai embora. Fique aqui só ${WAIT_MINUTES} minutos.</p><div class="ritual-timer" id="rt-timer">${WAIT_MINUTES}:00</div><p class="ritual-note">Ela costuma perder força entre 15 e 30 minutos, mesmo sem beber.</p><button class="ritual-next" id="rt-next">Continuar</button>`;
  else if (r.step === 2) body = `<h2>Siga seu plano</h2><p>Você já decidiu isso com calma. Agora é só fazer.</p>
      <div class="ritual-checks">${plan.actions.map((a, i) => `<button class="ritual-check ${r.done.includes(i) ? 'on' : ''}" data-check="${i}"><span>${r.done.includes(i) ? '✓' : ''}</span>${escapeHtml(a)}</button>`).join('')}</div>
      ${plan.drink ? `<div class="ritual-info"><small>Para beber</small><strong>${escapeHtml(plan.drink)}</strong></div>` : ''}
      ${plan.phrase ? `<div class="ritual-info"><small>Se te chamarem</small><strong>“${escapeHtml(plan.phrase)}”</strong></div>` : ''}
      <button class="ritual-next" id="rt-next">Passou</button>`;
  else body = `<div class="ritual-done">✓</div><h2>Passou. A ${DAYS[plan.day].toLowerCase()} é sua de novo.</h2><p>Seu plano funcionou ${plan.wins} ${plan.wins === 1 ? 'vez' : 'vezes'}.</p><button class="ritual-next" id="rt-close2">Voltar ao meu plano</button>`;
  return `<section class="ritual">${head}<div class="ritual-body">${body}</div></section>`;
}

function bindRitual({ redraw }, p) {
  const r = p.ritual;
  const close = () => { clearInterval(r.timer); p.ritual = null; redraw(); };
  $('#rt-close').addEventListener('click', close);
  $('#rt-close2')?.addEventListener('click', close);
  $$('[data-check]').forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset.check); r.done = r.done.includes(i) ? r.done.filter(x => x !== i) : [...r.done, i]; redraw(); }));
  if (r.step === 1) {
    let left = WAIT_MINUTES * 60; const el = $('#rt-timer');
    r.timer = setInterval(() => { if (!el.isConnected) return clearInterval(r.timer); left = Math.max(0, left - 1); el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; }, 1000);
  }
  $('#rt-next')?.addEventListener('click', () => {
    clearInterval(r.timer);
    r.step += 1;
    if (r.step === 3) p.plans[r.plan].wins += 1;
    redraw();
  });
}
