import { $, escapeHtml, initials, dateLabel } from '../utils.js';

export const profileView = {
  html({ state }) {
    const p = state.store.profile;
    return `
      <div class="screen-title">
        <h2>Perfil</h2>
        <p>Só o essencial para manter o MVP simples.</p>
      </div>

      <section class="card profile-card profile-card-clean">
        <div class="avatar">${escapeHtml(initials(p.name))}</div>
        <div class="profile-main-copy">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.email)}</p>
          <span>Começou em ${dateLabel(p.startDate)}</span>
        </div>
      </section>

      <section class="section profile-settings-section">
        <div class="section-head"><div><h3>Minha conta</h3><p>Informações que aparecem no seu acompanhamento.</p></div></div>
        <div class="settings-list clean-settings">
          <button class="setting-row" id="profile-edit">
            <div class="setting-icon setting-icon-line">✎</div>
            <div class="setting-copy"><strong>Dados pessoais</strong><span>Nome, e-mail e data de início</span></div>
            <div class="chev">›</div>
          </button>
          <button class="setting-row" id="profile-goal">
            <div class="setting-icon setting-icon-line">◎</div>
            <div class="setting-copy"><strong>Meu objetivo</strong><span>${escapeHtml(p.goal || 'Defina uma frase curta')}</span></div>
            <div class="chev">›</div>
          </button>
        </div>
      </section>

      <section class="section">
        <div class="card profile-minimal-card">
          <div>
            <span class="profile-minimal-label">SEU ACOMPANHAMENTO</span>
            <strong>Simples de propósito.</strong>
            <p>Seu acompanhamento fica em Início, Rotina, SOS, Alimentação e Apoio. O perfil continua disponível pelo avatar no topo.</p>
          </div>
        </div>
      </section>
    `;
  },

  bind(ctx) {
    const { state, endpoints, mutate, openModal } = ctx;
    const p = state.store.profile;

    $('#profile-edit')?.addEventListener('click', () => {
      openModal({
        title: 'Dados pessoais',
        subtitle: 'Edite apenas as informações básicas do seu perfil.',
        content: `
          <div class="field"><label>Nome</label><input id="pf-name" value="${escapeHtml(p.name)}"></div>
          <div class="field"><label>E-mail</label><input id="pf-email" type="email" value="${escapeHtml(p.email)}"></div>
          <div class="field"><label>Data de início</label><input id="pf-date" type="date" value="${escapeHtml(p.startDate)}"></div>
          <button class="primary-btn" id="pf-save">Salvar alterações</button>
        `,
        onOpen({ close }) {
          $('#pf-save')?.addEventListener('click', async () => {
            const ok = await mutate(() => endpoints.profile({
              name: $('#pf-name').value.trim(),
              email: $('#pf-email').value.trim(),
              startDate: $('#pf-date').value
            }), 'Perfil atualizado.');
            if (ok) close();
          });
        }
      });
    });

    $('#profile-goal')?.addEventListener('click', () => {
      openModal({
        title: 'Meu objetivo',
        subtitle: 'Uma frase curta para lembrar o que você quer construir.',
        content: `
          <div class="field"><label>Objetivo</label><textarea id="pf-goal" maxlength="240">${escapeHtml(p.goal || '')}</textarea></div>
          <button class="primary-btn" id="goal-save">Salvar objetivo</button>
        `,
        onOpen({ close }) {
          $('#goal-save')?.addEventListener('click', async () => {
            const ok = await mutate(() => endpoints.profile({ goal: $('#pf-goal').value.trim() }), 'Objetivo salvo.');
            if (ok) close();
          });
        }
      });
    });
  }
};
