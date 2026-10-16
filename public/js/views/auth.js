import { $, escapeHtml } from '../utils.js';
import { authMessage } from '../auth.js';

// Entrada só com o e-mail da compra: sem senha e sem link por e-mail.
export const authView = {
  html(ctx) {
    return `<section class="auth-layout"><div class="auth-card">
      <div class="auth-brand"><img src="/icon.svg" width="46" height="46" alt=""><strong>Desato</strong></div>
      <h1>Bem-vindo ao Desato</h1><p class="auth-subtitle">Digite o e-mail que você usou na compra para entrar.</p>
      <p id="auth-feedback" class="auth-feedback ${ctx.state.authFeedback ? '' : 'hidden'}" role="status">${escapeHtml(ctx.state.authFeedback || '')}</p>
      <form id="auth-form" novalidate>
        <div class="field"><label for="auth-email">Seu e-mail</label><input id="auth-email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" value="${escapeHtml(ctx.email || '')}" placeholder="voce@exemplo.com" required></div>
        <button class="primary-btn auth-submit" type="submit" id="auth-submit">Entrar</button>
      </form>
      <p class="auth-switch">Ainda não comprou? <a href="/quiz">Conhecer o Desato</a></p>
    </div></section>`;
  },
  bind(ctx) {
    const feedback = message => { const el = $('#auth-feedback'); el.textContent = message; el.classList.remove('hidden'); };
    let busy = false;
    $('#auth-form').addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      const input = $('#auth-email');
      const email = input.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { feedback('Digite um e-mail válido.'); input.focus(); return; }
      busy = true;
      const submit = $('#auth-submit'); submit.disabled = true; submit.textContent = 'Entrando…';
      try {
        await ctx.auth.emailLogin(email);
        localStorage.setItem('desato-remember-email', email);
      } catch (error) {
        feedback(authMessage(error));
      } finally {
        busy = false;
        if (submit.isConnected) { submit.disabled = false; submit.textContent = 'Entrar'; }
      }
    });
  }
};
