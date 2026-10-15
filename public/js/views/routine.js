import { $, $$, escapeHtml, todayISO } from '../utils.js';
import { JOURNEY, JOURNEY_WEEKS, JOURNEY_LENGTH, journeyStatus } from '../content/journey.js';

// Rota interna "rotina" preservada; a tela agora é a Jornada de 30 dias.
export const routineView = {
  html({ state }) {
    const today = state.summary?.today || todayISO();
    const journey = state.store.journey || {};
    const status = journeyStatus(journey, today);
    const requested = Number(state.ui.journeyDay);
    const open = requested && (journey[requested] || (requested === status.current && !status.waiting)) ? requested : null;
    const lesson = open ? JOURNEY[open - 1] : null;
    const saved = open ? journey[open] : null;

    const dayState = day => journey[day] ? 'done' : day === status.current && !status.waiting && !status.finished ? 'current' : 'locked';
    const hero = status.finished
      ? `<h3>Você completou a jornada.</h3><p>Releia suas respostas sempre que precisar. Elas são o seu mapa.</p>`
      : status.waiting
        ? `<h3>Dia ${status.completed} concluído.</h3><p>O dia ${status.current} abre amanhã. Um passo por dia é o ritmo certo.</p>`
        : `<h3>Dia ${status.current}: ${escapeHtml(JOURNEY[status.current - 1].title)}</h3><p>Lição de ${JOURNEY[status.current - 1].minutes} minutos e uma tarefa prática.</p><button class="journey-start" data-open-day="${status.current}">${status.completed ? 'Continuar jornada' : 'Começar a jornada'}</button>`;

    return `
      <div class="journey-screen">
        <div class="screen-title"><h2>Jornada</h2><p>30 dias de lições curtas para mudar sua relação com o álcool.</p></div>

        <section class="journey-hero">
          <div class="journey-progress-head"><span>DIA ${status.completed} DE ${JOURNEY_LENGTH}</span><strong>${status.percent}%</strong></div>
          <div class="journey-track" role="progressbar" aria-valuemin="0" aria-valuemax="${JOURNEY_LENGTH}" aria-valuenow="${status.completed}"><span style="width:${status.percent}%"></span></div>
          ${hero}
        </section>

        ${lesson ? `
        <section class="journey-lesson" id="journey-lesson">
          <div class="journey-lesson-head">
            <span>DIA ${lesson.day} · ${lesson.minutes} MIN</span>
            <button class="journey-close" id="journey-close" aria-label="Fechar lição">×</button>
          </div>
          <h3>${escapeHtml(lesson.title)}</h3>
          ${lesson.lesson.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
          <div class="journey-task"><strong>Tarefa de hoje</strong><p>${escapeHtml(lesson.task)}</p></div>
          <label class="journey-question" for="journey-answer">${escapeHtml(lesson.question)}</label>
          <textarea id="journey-answer" maxlength="500" rows="4" placeholder="Escreva com as suas palavras">${escapeHtml(saved?.answer || '')}</textarea>
          <button class="primary-btn" id="journey-save">${saved ? 'Salvar resposta' : `Concluir dia ${lesson.day}`}</button>
        </section>` : ''}

        ${JOURNEY_WEEKS.map(week => `
          <section class="journey-week">
            <h4>${escapeHtml(week.title)}</h4>
            <div class="journey-days">
              ${JOURNEY.slice(week.from - 1, week.to).map(item => {
                const kind = dayState(item.day);
                return `<button class="journey-day ${kind} ${open === item.day ? 'open' : ''}" data-open-day="${item.day}" ${kind === 'locked' ? 'disabled' : ''} aria-label="Dia ${item.day}: ${escapeHtml(item.title)}${kind === 'done' ? ', concluído' : kind === 'locked' ? ', bloqueado' : ''}">
                  <span class="journey-day-number">${kind === 'done' ? '✓' : item.day}</span>
                  <span class="journey-day-title">${kind === 'locked' ? `Dia ${item.day}` : escapeHtml(item.title)}</span>
                </button>`;
              }).join('')}
            </div>
          </section>`).join('')}
      </div>`;
  },

  bind({ state, endpoints, mutate, redraw, toast }) {
    const open = Number(state.ui.journeyDay);
    $$('[data-open-day]').forEach(button => button.addEventListener('click', () => {
      state.ui.journeyDay = Number(button.dataset.openDay);
      redraw();
      $('#journey-lesson')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    $('#journey-close')?.addEventListener('click', () => { state.ui.journeyDay = null; redraw(); });
    $('#journey-save')?.addEventListener('click', async () => {
      const answer = $('#journey-answer').value.trim();
      if (!answer) { toast('Escreva sua resposta para concluir o dia.'); $('#journey-answer').focus(); return; }
      const first = !state.store.journey?.[open];
      const ok = await mutate(() => endpoints.journey({ day: open, answer }), first ? `Dia ${open} concluído. Até amanhã!` : 'Resposta atualizada.');
      if (ok && first) { state.ui.journeyDay = null; redraw(); }
    });
  }
};
