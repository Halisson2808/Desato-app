import { authMessage } from '../auth.js';
import { $, escapeHtml, initials, dateLabel } from '../utils.js';

export const profileView = {
  html({ state }) {
    const p = state.store.profile;
    return `
      <div class="screen-title">
        <h2>Perfil</h2>
        <p>Seus dados, seu objetivo e o acesso à sua conta.</p>
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

      ${state.storageMode === 'supabase' ? `<section class="section profile-settings-section"><div class="section-head"><div><h3>Acesso à conta</h3><p>Gerencie seu e-mail e sua senha.</p></div></div><div class="settings-list clean-settings"><button class="setting-row" id="profile-email"><div class="setting-icon">@</div><div class="setting-copy"><strong>Alterar e-mail</strong><span>Confirmação pelo Supabase</span></div><span class="chev">›</span></button><button class="setting-row" id="profile-password"><div class="setting-icon">✦</div><div class="setting-copy"><strong>Redefinir senha</strong><span>Receber um link no meu e-mail</span></div><span class="chev">›</span></button><button class="setting-row" id="profile-signout"><div class="setting-icon">↪</div><div class="setting-copy"><strong>Sair da conta</strong><span>Encerrar o acesso neste navegador</span></div><span class="chev">›</span></button></div></section>` : ''}
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

    $('#profile-signout')?.addEventListener('click', async () => {
      const button = $('#profile-signout'); button.disabled = true;
      try { await ctx.signOut(); } catch (error) { ctx.toast(authMessage(error)); button.disabled = false; }
    });
    $('#profile-password')?.addEventListener('click', async () => {
      const button = $('#profile-password'); button.disabled = true;
      try { const { error } = await ctx.auth.forgot(p.email); if (error) throw error; ctx.toast('Confira seu e-mail para escolher uma nova senha.'); }
      catch (error) { ctx.toast(authMessage(error)); }
      finally { button.disabled = false; }
    });
    $('#profile-email')?.addEventListener('click', () => openModal({
      title: 'Alterar e-mail', subtitle: 'Confirme a mudança pelos links enviados pelo Supabase.',
      content: `<form id="account-email-form"><div class="field"><label for="account-email">Novo e-mail</label><input id="account-email" type="email" autocomplete="email" maxlength="254" required></div><button class="primary-btn" type="submit">Enviar confirmação</button></form>`,
      onOpen({ close, root }) {
        const form = root.querySelector('#account-email-form');
        form.addEventListener('submit', async event => {
          event.preventDefault(); if (!form.reportValidity()) return;
          const button = form.querySelector('button'); button.disabled = true;
          try { const { error } = await ctx.auth.updateEmail(root.querySelector('#account-email').value.trim()); if (error) throw error; close(); ctx.toast('Confira os e-mails de confirmação para concluir a mudança.'); }
          catch (error) { ctx.toast(authMessage(error)); button.disabled = false; }
        });
      }
    }));
    $('#profile-edit')?.addEventListener('click', () => {
      openModal({
        title: 'Dados pessoais',
        subtitle: 'Edite apenas as informações básicas do seu perfil.',
        content: `
          <div class="field"><label>Nome</label><input id="pf-name" value="${escapeHtml(p.name)}"></div>
          <div class="field"><label>E-mail</label><input id="pf-email" type="email" value="${escapeHtml(p.email)}" ${state.storageMode === 'supabase' ? 'readonly' : ''}></div>
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
