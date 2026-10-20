import { authMessage } from '../auth.js';
import { $, escapeHtml, initials, dateLabel } from '../utils.js';

export const profileView = {
  html({ state }) {
    const p = state.store.profile;
    return `
      <div class="screen-title">
        <h2>Perfil</h2>
        <p>Seus dados e o acesso à sua conta.</p>
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
        <div class="card profile-inline">
          <div class="field"><label for="pf-name">Nome</label><input id="pf-name" maxlength="80" value="${escapeHtml(p.name)}"></div>
          <div class="field"><label for="pf-email">E-mail</label><input id="pf-email" type="email" value="${escapeHtml(p.email)}" readonly aria-readonly="true"><small>O e-mail é o da sua compra e não pode ser trocado.</small></div>
          <button class="primary-btn" id="pf-save">Salvar nome</button>
        </div>
      </section>

      ${state.storageMode === 'supabase' ? `<section class="section profile-settings-section"><div class="section-head"><div><h3>Acesso à conta</h3><p>Você entra só com o seu e-mail.</p></div></div><div class="settings-list clean-settings"><button class="setting-row" id="profile-signout"><div class="setting-icon">↪</div><div class="setting-copy"><strong>Sair da conta</strong><span>Encerrar o acesso neste navegador</span></div><span class="chev">›</span></button></div></section>` : ''}
    `;
  },

  bind(ctx) {
    const { state, endpoints, mutate, openModal } = ctx;
    const p = state.store.profile;

    $('#profile-signout')?.addEventListener('click', async () => {
      const button = $('#profile-signout'); button.disabled = true;
      try { await ctx.signOut(); } catch (error) { ctx.toast(authMessage(error)); button.disabled = false; }
    });
    $('#pf-save')?.addEventListener('click', async () => {
      const name = $('#pf-name').value.trim();
      if (!name) { ctx.toast('Digite o seu nome.'); return; }
      await mutate(() => endpoints.profile({ name }), 'Nome atualizado.');
    });
  }
};
