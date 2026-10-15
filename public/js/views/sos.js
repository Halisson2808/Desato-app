import { $ } from '../utils.js';

// Respiração: 6 ciclos de 4 s inspirando e 6 s soltando (cerca de 6 respirações por minuto).
const BREATH = { cycles: 6, inhale: 4, exhale: 6 };
const SURF_SECONDS = 60;
const COUNT_START = 100;
const COUNT_STEP = 7;
const COUNT_TARGET = 10;
const TOMORROW_SECONDS = 20;

const LEVELS = [
  [1, 'Fraca'], [2, 'Leve'], [3, 'Média'], [4, 'Forte'], [5, 'Muito forte']
];
const BODY_SPOTS = ['Boca e garganta', 'Peito', 'Estômago', 'Mãos', 'Cabeça', 'Não sei dizer'];
const TOMORROW = [
  ['disposto', 'Acordar bem e com disposição'],
  ['lembrar', 'Lembrar de tudo o que aconteceu'],
  ['orgulho', 'Sentir orgulho de mim'],
  ['pessoas', 'Estar presente para quem eu amo'],
  ['dinheiro', 'Guardar esse dinheiro']
];
const NEXT_ACTIONS = [
  ['banho', 'Tomar um banho'],
  ['caminhar', 'Sair para caminhar'],
  ['comer', 'Preparar algo para comer'],
  ['ligar', 'Falar com alguém'],
  ['organizar', 'Organizar alguma coisa'],
  ['dormir', 'Me deitar e descansar']
];

const STEPS = [
  { tag: 'Respirar', title: 'Siga o círculo com a sua respiração' },
  { tag: 'Observar', title: 'Observe a vontade de beber sem obedecer a ela' },
  { tag: 'Ocupar a cabeça', title: `Tire ${COUNT_STEP} do número, ${COUNT_TARGET} vezes seguidas` },
  { tag: 'Pensar no amanhã', title: 'Como você quer acordar amanhã?' },
  { tag: 'Seguir em frente', title: 'Escolha o que fazer agora' }
];

const chips = (items, name, selected) => items.map(([value, label]) =>
  `<button type="button" class="sos-chip ${selected === value ? 'selected' : ''}" data-${name}="${value}" aria-pressed="${selected === value}">${label}</button>`
).join('');

export const sosView = {
  html() {
    return `
      <section class="sos-focus" id="sos-focus">
        <header class="sos-focus-top">
          <div class="sos-title">
            <span class="sos-badge" aria-hidden="true">SOS</span>
            <div><h1>Modo SOS</h1><p>Um passo de cada vez até a vontade passar.</p></div>
          </div>
          <button type="button" class="sos-cancel" id="sos-cancel" hidden>Cancelar</button>
        </header>
        <div class="sos-progress" id="sos-progress" hidden>
          ${STEPS.map((step, i) => `<span data-step-dot="${i}"><i></i><small>${step.tag}</small></span>`).join('')}
        </div>
        <div id="sos-stage" aria-live="polite"></div>
      </section>
      <section class="sos-footnote">
        <span>Importante:</span> se houver sintomas físicos intensos ou uma emergência, procure atendimento imediatamente.
      </section>
    `;
  },

  bind(ctx) {
    const stage = $('#sos-stage');
    const cancelBtn = $('#sos-cancel');
    const progress = $('#sos-progress');
    const state = { before: null, step: -1, timer: null };

    const stop = () => { clearInterval(state.timer); state.timer = null; };
    // Interrompe cronômetros se a pessoa sair da tela.
    const alive = () => {
      if (stage.isConnected) return true;
      stop();
      return false;
    };
    const countdown = (seconds, onTick, onDone) => {
      stop();
      let left = seconds;
      onTick(left);
      state.timer = setInterval(() => {
        if (!alive()) return;
        left -= 1;
        onTick(left);
        if (left <= 0) { stop(); onDone(); }
      }, 1000);
    };

    const save = async (action) => {
      try {
        await ctx.endpoints.sos({ intensity: state.before ?? 3, action });
      } catch {
        ctx.toast('Não consegui salvar este SOS. Verifique a conexão.');
      }
    };

    const markProgress = () => {
      progress.hidden = state.step < 0;
      cancelBtn.hidden = state.step < 0;
      document.querySelectorAll('[data-step-dot]').forEach((dot, i) => {
        dot.classList.toggle('active', i === state.step);
        dot.classList.toggle('done', i < state.step);
      });
    };

    const frame = (body, { canContinue = false, label = 'Continuar' } = {}) => {
      const step = STEPS[state.step];
      stage.innerHTML = `
        <div class="sos-card">
          <span class="sos-step-tag">Etapa ${state.step + 1} de ${STEPS.length} · ${step.tag}</span>
          <h2>${step.title}</h2>
          ${body}
          <div class="sos-controls">
            <button type="button" class="sos-ghost" id="sos-restart">Reiniciar etapa</button>
            <button type="button" class="sos-next" id="sos-next" ${canContinue ? '' : 'disabled'}>${label}</button>
          </div>
          ${adminSkip}
        </div>`;
      bindSkip();
      $('#sos-restart').addEventListener('click', () => go(state.step));
      $('#sos-next').addEventListener('click', () => go(state.step + 1));
    };
    // Atalho só para administradores revisarem as telas; não grava sessão de SOS.
    const adminSkip = ctx.state.admin ? '<button type="button" class="sos-admin-skip" id="sos-admin-skip">Pular etapa (admin)</button>' : '';
    const bindSkip = () => $('#sos-admin-skip')?.addEventListener('click', () => {
      if (state.before === null) state.before = 3;
      if (state.step < STEPS.length - 1) go(state.step + 1);
      else { stop(); renderDone(state.before, NEXT_ACTIONS[0][1]); }
    });
    const unlock = () => { const next = $('#sos-next'); if (next) next.disabled = false; };

    const renderIntro = () => {
      state.before = null;
      stage.innerHTML = `
        <div class="sos-card sos-intro">
          <h2>Vamos passar por isso juntos.</h2>
          <p>São 5 etapas curtas, cerca de 5 minutos no total. Cada uma só termina quando você fizer o que ela pede.</p>
          <p class="sos-question">Qual a força da sua vontade de beber agora?</p>
          <div class="sos-scale">${LEVELS.map(([v, l]) => `<button type="button" data-level="${v}"><strong>${v}</strong><small>${l}</small></button>`).join('')}</div>
          <button type="button" class="sos-next" id="sos-start" disabled>Começar</button>
          ${adminSkip}
        </div>`;
      bindSkip();
      stage.querySelectorAll('[data-level]').forEach(btn => btn.addEventListener('click', () => {
        state.before = Number(btn.dataset.level);
        stage.querySelectorAll('[data-level]').forEach(b => b.classList.toggle('selected', b === btn));
        $('#sos-start').disabled = false;
      }));
      $('#sos-start').addEventListener('click', () => go(0));
    };

    const renderBreath = () => {
      frame(`
        <p class="sos-copy">Inspire pelo nariz enquanto o círculo cresce. Solte devagar pela boca enquanto ele diminui.</p>
        <div class="sos-breath" id="sos-breath"><div class="sos-breath-core"><strong id="breath-word">Prepare-se</strong><span id="breath-sec"></span></div></div>
        <p class="sos-meter" id="breath-cycle">Respiração 0 de ${BREATH.cycles}</p>`);
      const circle = $('#sos-breath');
      let cycle = 0;
      const phase = (inhale) => {
        if (!alive()) return;
        const seconds = inhale ? BREATH.inhale : BREATH.exhale;
        circle.style.transitionDuration = `${seconds}s`;
        circle.classList.toggle('grow', inhale);
        $('#breath-word').textContent = inhale ? 'Inspire' : 'Solte';
        if (inhale) $('#breath-cycle').textContent = `Respiração ${cycle + 1} de ${BREATH.cycles}`;
        countdown(seconds, left => { $('#breath-sec').textContent = left > 0 ? left : ''; }, () => {
          if (inhale) return phase(false);
          cycle += 1;
          if (cycle < BREATH.cycles) return phase(true);
          $('#breath-word').textContent = 'Muito bem';
          $('#breath-cycle').textContent = 'Seu corpo já está mais calmo.';
          unlock();
        });
      };
      countdown(3, left => { $('#breath-sec').textContent = left; }, () => phase(true));
    };

    const renderSurf = () => {
      frame(`
        <p class="sos-copy">A vontade de beber é como uma onda: cresce, chega ao pico e depois diminui sozinha, normalmente em 15 a 30 minutos, mesmo que você não beba. Ela costuma aparecer no corpo: boca seca, aperto no peito, inquietação, mãos agitadas. Perceber onde ela está ajuda a enxergá-la como uma sensação passageira, e não como uma ordem.</p>
        <p class="sos-question">Onde você sente essa vontade no seu corpo agora?</p>
        <div class="sos-chips">${chips(BODY_SPOTS.map(s => [s, s]), 'spot')}</div>
        <div class="sos-timer" id="surf-box" hidden>
          <strong id="surf-sec">${SURF_SECONDS}</strong>
          <p id="surf-msg"></p>
        </div>`);
      const messages = [
        'Repare na sensação. Ela é forte, mas é só uma sensação.',
        'Perceba se ela muda de lugar ou de intensidade.',
        'Respire e imagine que você está em cima da onda, sem cair.',
        'Ela já não está igual a um minuto atrás.'
      ];
      stage.querySelectorAll('[data-spot]').forEach(btn => btn.addEventListener('click', () => {
        if (state.timer) return;
        stage.querySelectorAll('[data-spot]').forEach(b => { b.classList.toggle('selected', b === btn); b.disabled = b !== btn; });
        $('#surf-box').hidden = false;
        countdown(SURF_SECONDS, left => {
          $('#surf-sec').textContent = left;
          $('#surf-msg').textContent = messages[Math.min(messages.length - 1, Math.floor((SURF_SECONDS - left) / (SURF_SECONDS / messages.length)))];
        }, () => {
          $('#surf-sec').textContent = '✓';
          $('#surf-msg').textContent = 'Você observou a vontade sem agir. Isso já é controle.';
          unlock();
        });
      }));
    };

    const renderCount = () => {
      let current = COUNT_START;
      let right = 0;
      frame(`
        <p class="sos-copy">Uma conta de cada vez: tire ${COUNT_STEP} do número que aparece e digite o resultado. O resultado vira o próximo número. Exemplo com outro número: 50 − ${COUNT_STEP} = ${50 - COUNT_STEP}, depois ${50 - COUNT_STEP} − ${COUNT_STEP} = ${50 - 2 * COUNT_STEP}. Fazer isso de cabeça ocupa a mente e afasta a vontade.</p>
        <div class="sos-count">
          <div class="sos-count-now"><small>Quanto é</small><strong id="count-now">${current}</strong><span class="sos-count-op">− ${COUNT_STEP} = ?</span></div>
          <form id="count-form" class="sos-count-form" autocomplete="off">
            <input id="count-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" aria-label="Resultado" required>
            <button type="submit" class="sos-next">OK</button>
          </form>
          <p class="sos-meter" id="count-feedback">0 de ${COUNT_TARGET}</p>
          <div class="sos-trail" id="count-trail"><span>${current}</span></div>
        </div>`);
      const input = $('#count-input');
      input.focus();
      $('#count-form').addEventListener('submit', event => {
        event.preventDefault();
        if (right >= COUNT_TARGET) return;
        const value = Number(input.value.trim());
        input.value = '';
        if (value !== current - COUNT_STEP) {
          $('#count-feedback').textContent = `Ainda não. Quanto é ${current} − ${COUNT_STEP}?`;
          input.classList.remove('wrong'); void input.offsetWidth; input.classList.add('wrong');
          return;
        }
        current = value;
        right += 1;
        $('#count-now').textContent = current;
        $('#count-trail').insertAdjacentHTML('beforeend', `<span>${current}</span>`);
        if (right < COUNT_TARGET) {
          $('#count-feedback').textContent = `${right} de ${COUNT_TARGET}`;
          return;
        }
        $('#count-feedback').textContent = 'Pronto. Sua cabeça ficou ocupada com outra coisa.';
        input.disabled = true;
        unlock();
      });
    };

    const renderTomorrow = () => {
      frame(`
        <p class="sos-copy">Daqui a pouco essa vontade vai estar menor. O que você decidir agora é o que vai encontrar amanhã de manhã.</p>
        <div class="sos-chips sos-chips-column">${chips(TOMORROW, 'tomorrow')}</div>
        <div class="sos-timer" id="tomorrow-box" hidden>
          <p class="sos-promise" id="tomorrow-text"></p>
          <small>Fique com essa imagem por <b id="tomorrow-sec">${TOMORROW_SECONDS}</b> segundos.</small>
        </div>`);
      stage.querySelectorAll('[data-tomorrow]').forEach(btn => btn.addEventListener('click', () => {
        if (state.timer) return;
        stage.querySelectorAll('[data-tomorrow]').forEach(b => { b.classList.toggle('selected', b === btn); b.disabled = b !== btn; });
        $('#tomorrow-box').hidden = false;
        $('#tomorrow-text').textContent = `Amanhã eu quero: ${btn.textContent.toLowerCase()}.`;
        countdown(TOMORROW_SECONDS, left => { $('#tomorrow-sec').textContent = left; }, unlock);
      }));
    };

    const renderNext = () => {
      let action = null;
      let after = null;
      frame(`
        <p class="sos-copy">Não volte para onde estava. Escolha uma ação simples para fazer assim que sair desta tela.</p>
        <div class="sos-chips">${chips(NEXT_ACTIONS, 'next-action')}</div>
        <p class="sos-question">E a vontade de beber, como está agora?</p>
        <div class="sos-scale">${LEVELS.map(([v, l]) => `<button type="button" data-after="${v}"><strong>${v}</strong><small>${l}</small></button>`).join('')}</div>`,
      { label: 'Concluir SOS' });
      const check = () => { $('#sos-next').disabled = !(action && after); };
      stage.querySelectorAll('[data-next-action]').forEach(btn => btn.addEventListener('click', () => {
        action = btn.dataset.nextAction;
        stage.querySelectorAll('[data-next-action]').forEach(b => b.classList.toggle('selected', b === btn));
        check();
      }));
      stage.querySelectorAll('[data-after]').forEach(btn => btn.addEventListener('click', () => {
        after = Number(btn.dataset.after);
        stage.querySelectorAll('[data-after]').forEach(b => b.classList.toggle('selected', b === btn));
        check();
      }));
      const next = $('#sos-next');
      next.replaceWith(next.cloneNode(true));
      $('#sos-next').addEventListener('click', async () => {
        $('#sos-next').disabled = true;
        await save(`concluido depois:${after} acao:${action}`);
        if (alive()) renderDone(after, NEXT_ACTIONS.find(([v]) => v === action)[1]);
      });
    };

    const renderDone = (after, actionLabel) => {
      state.step = STEPS.length;
      markProgress();
      cancelBtn.hidden = true;
      const diff = state.before - after;
      const message = diff > 0
        ? `A vontade caiu de ${state.before} para ${after}. Você fez isso acontecer.`
        : 'A vontade ainda está aí, e tudo bem. Você atravessou estes minutos sem ceder a ela.';
      stage.innerHTML = `
        <div class="sos-card sos-done">
          <div class="sos-done-check">✓</div>
          <h2>Você completou o SOS.</h2>
          <p>${message}</p>
          <p class="sos-promise">Agora: ${actionLabel.toLowerCase()}.</p>
          ${diff <= 0 ? '<p class="sos-copy">Se a vontade continuar forte, faça o SOS de novo ou fale com alguém de confiança.</p>' : ''}
          <div class="sos-controls">
            <button type="button" class="sos-ghost" id="sos-again">Fazer de novo</button>
            <button type="button" class="sos-next" id="sos-go-routine">Ir para meu plano</button>
          </div>
        </div>`;
      $('#sos-again').addEventListener('click', () => { state.step = -1; markProgress(); renderIntro(); });
      $('#sos-go-routine').addEventListener('click', () => ctx.navigate('rotina'));
    };

    const renderers = [renderBreath, renderSurf, renderCount, renderTomorrow, renderNext];
    const go = (index) => {
      stop();
      state.step = index;
      markProgress();
      renderers[index]();
    };

    cancelBtn.addEventListener('click', async () => {
      const step = state.step;
      stop();
      state.step = -1;
      markProgress();
      renderIntro();
      if (step >= 0 && step < STEPS.length) await save(`cancelado etapa:${step + 1}`);
    });

    markProgress();
    renderIntro();
  }
};
