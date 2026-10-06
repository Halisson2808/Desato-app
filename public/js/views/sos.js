import { $ } from '../utils.js';

const steps = [
  {
    tag: 'Acalme o corpo',
    title: 'Respire antes de decidir qualquer coisa',
    icon: '01',
    copy: 'Faça três respirações lentas. Puxe o ar pelo nariz, segure por um instante e solte mais devagar do que entrou.',
    action: 'Inspire devagar · segure · solte devagar',
    helper: 'Não precisa contar o tempo. Só faça três ciclos completos.'
  },
  {
    tag: 'Mude o estado do corpo',
    title: 'Levante e coloque o corpo em movimento',
    icon: '02',
    copy: 'Saia da posição em que você está. Estique os braços, mexa os ombros, caminhe um pouco e beba água.',
    action: 'Levante · alongue · caminhe · beba água',
    helper: 'A ideia é quebrar o automático e mudar o que seu corpo está fazendo agora.'
  },
  {
    tag: 'Quebre o ambiente',
    title: 'Vá para outro lugar por alguns minutos',
    icon: '03',
    copy: 'Mude de cômodo ou saia para um espaço diferente. Tire de perto qualquer coisa que esteja ligada ao impulso.',
    action: 'Mude de lugar e deixe o gatilho fora de alcance',
    helper: 'Um ambiente diferente ajuda a interromper a sequência que estava acontecendo.'
  },
  {
    tag: 'Ocupe a mente',
    title: 'Faça sua cabeça prestar atenção em outra coisa',
    icon: '04',
    copy: 'Olhe ao redor e identifique: 5 coisas que vê, 4 que consegue tocar, 3 sons que escuta, 2 cheiros e 1 sabor.',
    action: '5 coisas · 4 toques · 3 sons · 2 cheiros · 1 sabor',
    helper: 'Faça de verdade, sem pressa. O objetivo é puxar sua atenção para o presente.'
  },
  {
    tag: 'Troque a próxima ação',
    title: 'Agora escolha algo simples para fazer em seguida',
    icon: '05',
    copy: 'Você já saiu do impulso inicial. Em vez de voltar para o que estava fazendo, escolha uma ação pequena e concreta.',
    action: 'Tomar banho · caminhar · preparar algo para comer · organizar alguma coisa',
    helper: 'Não precisa resolver o resto do dia. Escolha só a próxima ação.'
  }
];

export const sosView = {
  html() {
    return `
      <div class="screen-title sos-screen-title">
        <h2>SOS</h2>
        <p>Um processo curto para atravessar o momento de vontade sem ficar escolhendo entre várias ferramentas.</p>
      </div>

      <section class="sos-flow" id="sos-flow">
        <div class="sos-flow-top">
          <div>
            <span class="sos-eyebrow">MODO SOS</span>
            <h3>Siga um passo de cada vez</h3>
            <p>Você só precisa fazer o passo que está na tela agora.</p>
          </div>
          <div class="sos-shield" aria-hidden="true">SOS</div>
        </div>

        <div class="sos-stepper" id="sos-stepper">
          ${steps.map((_, i) => `<span class="sos-step-dot ${i === 0 ? 'active' : ''}" data-step-dot="${i}">${i + 1}</span>`).join('')}
        </div>

        <div id="sos-step-content"></div>
      </section>

      <section class="sos-footnote">
        <span>Importante:</span> se houver sintomas físicos intensos ou uma emergência, procure atendimento imediatamente.
      </section>
    `;
  },

  bind(ctx) {
    let current = 0;
    const root = $('#sos-step-content');

    const draw = () => {
      const step = steps[current];
      document.querySelectorAll('[data-step-dot]').forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
        dot.classList.toggle('done', i < current);
      });

      root.innerHTML = `
        <div class="sos-step-card">
          <div class="sos-step-number">${step.icon}</div>
          <div class="sos-step-copy">
            <span>${step.tag}</span>
            <h2>${step.title}</h2>
            <p>${step.copy}</p>
          </div>

          ${current === 0 ? `
            <div class="breath-visual" aria-hidden="true"><div class="breath-core">Respire</div></div>
          ` : ''}

          <div class="sos-action-box">
            <strong>Faça agora</strong>
            <p>${step.action}</p>
            <small>${step.helper}</small>
          </div>

          <div class="sos-controls">
            ${current > 0 ? `<button class="secondary-btn" id="sos-back">Voltar</button>` : `<button class="secondary-btn" id="sos-restart" disabled>Passo 1 de 5</button>`}
            <button class="primary-btn" id="sos-next">${current === steps.length - 1 ? 'Concluir SOS' : 'Concluí este passo'}</button>
          </div>
        </div>
      `;

      $('#sos-back')?.addEventListener('click', () => {
        current = Math.max(0, current - 1);
        draw();
      });

      $('#sos-next')?.addEventListener('click', async () => {
        if (current < steps.length - 1) {
          current += 1;
          draw();
          return;
        }

        const button = $('#sos-next');
        button.disabled = true;
        try {
          await ctx.endpoints.sos({ intensity: 3, action: 'completed-flow' });
        } catch {
          ctx.toast('Você concluiu os passos, mas o registro não foi salvo. Verifique a conexão.');
        }
        if (!root.isConnected) return;
        root.innerHTML = `
          <div class="sos-complete-card">
            <div class="sos-complete-check">✓</div>
            <span>PROCESSO CONCLUÍDO</span>
            <h2>Você atravessou os 5 passos.</h2>
            <p>Agora siga para uma ação simples da sua rotina e continue o dia sem transformar este momento no centro de tudo.</p>
            <div class="sos-complete-actions">
              <button class="primary-btn" id="sos-go-routine">Ir para minha rotina</button>
              <button class="secondary-btn" id="sos-again">Fazer SOS novamente</button>
            </div>
          </div>
        `;
        document.querySelectorAll('[data-step-dot]').forEach(dot => dot.classList.add('done'));
        $('#sos-go-routine')?.addEventListener('click', () => ctx.navigate('rotina'));
        $('#sos-again')?.addEventListener('click', () => { current = 0; draw(); });
      });
    };

    draw();
  }
};
