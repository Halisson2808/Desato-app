import { $$, escapeHtml, todayISO } from '../utils.js';
import { BODY_MILESTONES, BODY_TIPS, WATER_GOAL, cleanStreak } from '../content/body.js';

// Rota interna "alimentacao" preservada; a tela agora é Corpo e saúde.
export const foodView = {
  html({ state }) {
    const today = state.summary?.today || todayISO();
    const streak = cleanStreak(state.store.checkins, today);
    const cups = state.store.hydration[today] || 0;
    const next = BODY_MILESTONES.find(item => item.days > streak);
    const reached = BODY_MILESTONES.filter(item => item.days <= streak).length;

    return `
      <div class="body-screen">
        <div class="screen-title"><h2>Corpo e saúde</h2><p>O que muda no seu corpo a cada dia sem beber.</p></div>

        <section class="body-hero">
          <span>SEQUÊNCIA ATUAL</span>
          <strong>${streak} ${streak === 1 ? 'dia' : 'dias'} sem beber</strong>
          <p>${next
            ? `${next.days - streak === 1 ? 'Falta' : 'Faltam'} <b>${next.days - streak} ${next.days - streak === 1 ? 'dia' : 'dias'}</b> para: ${escapeHtml(next.title.toLowerCase())}.`
            : 'Você passou por todos os marcos. Seu corpo agradece.'}</p>
          <small>Contamos os dias seguidos marcados como “Não bebi” no Início.</small>
        </section>

        <section class="card body-timeline">
          <div class="home-section-head"><div><span>LINHA DO TEMPO</span><h3>${reached} de ${BODY_MILESTONES.length} marcos alcançados</h3></div></div>
          <ol>
            ${BODY_MILESTONES.map(item => {
              const done = item.days <= streak;
              const current = item === next;
              const progress = current ? Math.round(streak / item.days * 100) : 0;
              return `<li class="${done ? 'done' : current ? 'current' : ''}">
                <span class="body-dot" aria-hidden="true">${done ? '✓' : ''}</span>
                <div>
                  <small>${item.days === 365 ? '1 ano' : `${item.days} ${item.days === 1 ? 'dia' : 'dias'}`}</small>
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.text)}</p>
                  ${current ? `<div class="body-mini-track"><span style="width:${progress}%"></span></div>` : ''}
                </div>
              </li>`;
            }).join('')}
          </ol>
          <p class="body-note">Os efeitos variam de pessoa para pessoa. Em caso de sintomas ao parar de beber, procure um médico.</p>
        </section>

        <section class="card body-water">
          <div class="home-section-head"><div><span>ÁGUA DE HOJE</span><h3>${cups} de ${WATER_GOAL} copos</h3></div></div>
          <div class="water-cups" id="hydration-row">
            ${Array.from({ length: WATER_GOAL }, (_, i) => `<button class="water-cup ${i < cups ? 'full' : ''}" data-cup="${i + 1 === cups ? i : i + 1}" aria-label="${i + 1} ${i ? 'copos' : 'copo'}"><span></span></button>`).join('')}
          </div>
          <p>Toque no copo para marcar. Água ajuda a separar sede de vontade de beber.</p>
        </section>

        <section class="body-tips">
          <h3>Dicas para os primeiros dias</h3>
          <div class="body-tip-grid">
            ${BODY_TIPS.map(tip => `<article><strong>${escapeHtml(tip.title)}</strong><p>${escapeHtml(tip.text)}</p></article>`).join('')}
          </div>
        </section>
      </div>`;
  },

  bind({ state, endpoints, mutate }) {
    const today = state.summary?.today || todayISO();
    $$('#hydration-row [data-cup]').forEach(button => button.addEventListener('click', () =>
      mutate(() => endpoints.hydration({ date: today, cups: Number(button.dataset.cup) }))));
  }
};
