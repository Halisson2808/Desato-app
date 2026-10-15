import { $, $$, escapeHtml } from '../utils.js';
import { SITUATIONS } from '../content/situations.js';

const QUESTIONS = [
  ['drink', 'O que você vai beber no lugar?'],
  ['refuse', 'Sua frase pronta para recusar'],
  ['leaveAt', 'Quando você vai embora ou mudar de plano?']
];

// Rota interna "apoio" preservada; a tela agora é Situações difíceis.
export const supportView = {
  html({ state }) {
    const plans = state.store?.situations || {};
    const editing = SITUATIONS.find(item => item.id === state.ui.situationId);
    const draft = editing ? { ...(plans[editing.id] || {}), ...(state.ui.situationDraft || {}) } : null;

    return `
      <div class="situations-screen">
        <div class="screen-title"><h2>Situações difíceis</h2><p>Prepare sua resposta antes de o momento chegar. Na hora, é só abrir o plano.</p></div>

        ${editing ? `
        <section class="situation-editor" id="situation-editor">
          <div class="situation-editor-head">
            <div><span>MONTAR PLANO</span><h3>${escapeHtml(editing.title)}</h3><p>${escapeHtml(editing.hint)}</p></div>
            <button class="journey-close" id="situation-close" aria-label="Fechar">×</button>
          </div>
          ${QUESTIONS.map(([key, label], index) => `
            <div class="situation-question">
              <label for="situation-${key}"><b>${index + 1}</b>${label}</label>
              <input id="situation-${key}" maxlength="160" value="${escapeHtml(draft[key] || '')}" placeholder="Escreva ou toque numa sugestão">
              <div class="situation-suggestions">${editing.suggestions[key].map(text => `<button type="button" data-suggest="${key}">${escapeHtml(text)}</button>`).join('')}</div>
            </div>`).join('')}
          <button class="primary-btn" id="situation-save">Salvar plano</button>
        </section>` : ''}

        <div class="situation-grid">
          ${SITUATIONS.map(item => {
            const plan = plans[item.id];
            return `
            <article class="situation-card ${plan ? 'ready' : ''}">
              <div class="situation-card-top"><h3>${escapeHtml(item.title)}</h3><span class="situation-badge">${plan ? 'Plano pronto' : 'Sem plano'}</span></div>
              <p>${escapeHtml(item.hint)}</p>
              ${plan ? `
                <button class="situation-now" data-now="${item.id}">Estou nessa situação agora</button>
                <button class="situation-edit" data-edit="${item.id}">Editar plano</button>`
              : `<button class="situation-build" data-edit="${item.id}">Montar meu plano</button>`}
            </article>`;
          }).join('')}
        </div>

        <section class="situation-sos">
          <div><strong>A vontade já chegou?</strong><span>O SOS guia você por alguns minutos até ela baixar.</span></div>
          <button id="situation-go-sos">Abrir SOS</button>
        </section>
      </div>`;
  },

  bind({ state, endpoints, mutate, redraw, openModal, navigate, toast }) {
    const keepDraft = () => {
      if (!$('#situation-editor')) return;
      state.ui.situationDraft = Object.fromEntries(QUESTIONS.map(([key]) => [key, $(`#situation-${key}`).value]));
    };
    $$('[data-edit]').forEach(button => button.addEventListener('click', () => {
      state.ui.situationId = button.dataset.edit;
      state.ui.situationDraft = null;
      redraw();
      $('#situation-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    $('#situation-close')?.addEventListener('click', () => { state.ui.situationId = null; state.ui.situationDraft = null; redraw(); });
    $$('[data-suggest]').forEach(button => button.addEventListener('click', () => {
      $(`#situation-${button.dataset.suggest}`).value = button.textContent;
      keepDraft();
    }));
    $$('#situation-editor input').forEach(input => input.addEventListener('input', keepDraft));
    $('#situation-save')?.addEventListener('click', async () => {
      const body = Object.fromEntries(QUESTIONS.map(([key]) => [key, $(`#situation-${key}`).value.trim()]));
      const missing = QUESTIONS.find(([key]) => !body[key]);
      if (missing) { toast('Preencha as três respostas do plano.'); $(`#situation-${missing[0]}`).focus(); return; }
      const id = state.ui.situationId;
      const ok = await mutate(() => endpoints.situation(id, body), 'Plano salvo. Ele fica pronto para a hora certa.');
      if (ok) { state.ui.situationId = null; state.ui.situationDraft = null; redraw(); }
    });
    $$('[data-now]').forEach(button => button.addEventListener('click', () => {
      const item = SITUATIONS.find(entry => entry.id === button.dataset.now);
      const plan = state.store.situations[item.id];
      openModal({
        title: item.title,
        subtitle: 'Você já decidiu o que fazer. Agora é só seguir.',
        content: `
          <div class="situation-now-plan">
            ${QUESTIONS.map(([key, label], index) => `<div><span>${index + 1} · ${label}</span><strong>${escapeHtml(plan[key])}</strong></div>`).join('')}
          </div>
          <button class="primary-btn" id="now-done">Vou seguir meu plano</button>
          <button class="secondary-btn situation-now-sos" id="now-sos">Está difícil? Abrir SOS</button>`,
        onOpen({ close }) {
          $('#now-done').addEventListener('click', close);
          $('#now-sos').addEventListener('click', () => { close(); navigate('sos'); });
        }
      });
    }));
    $('#situation-go-sos').addEventListener('click', () => navigate('sos'));
  }
};
