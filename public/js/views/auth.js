import { $, $$, escapeHtml } from '../utils.js';
import { authMessage } from '../auth.js';
const modes = {
  login: ['Bem-vindo ao Desato', 'Entre para continuar seu acompanhamento.', 'Entrar'],
  signup: ['Crie sua conta', 'Seu progresso começa com um passo.', 'Criar conta'],
  forgot: ['Recuperar minha senha', 'Enviaremos um link para você escolher uma nova senha.', 'Enviar link de recuperação'],
  reset: ['Escolha uma nova senha', 'Defina uma senha para continuar na sua conta.', 'Salvar nova senha']
};
export const authView = {
  html(ctx) {
    const mode = ctx.state.authMode || 'login';
    const [title, subtitle, submit] = modes[mode];
    const password = ['login', 'signup', 'reset'].includes(mode);
    const newPassword = mode !== 'login';
    return `<section class="auth-layout"><div class="auth-card">
      <div class="auth-brand"><img src="/icon.svg" width="46" height="46" alt=""><strong>Desato</strong></div>
      <h1>${title}</h1><p class="auth-subtitle">${subtitle}</p>
      <p id="auth-feedback" class="auth-feedback ${ctx.state.authFeedback ? '' : 'hidden'}" role="status">${escapeHtml(ctx.state.authFeedback || '')}</p>
      <form id="auth-form">
        ${mode === 'signup' ? '<div class="field"><label for="auth-name">Seu nome</label><input id="auth-name" name="name" autocomplete="name" maxlength="80" required></div>' : ''}
        ${mode !== 'reset' ? `<div class="field"><label for="auth-email">E-mail</label><input id="auth-email" name="email" type="email" autocomplete="username" maxlength="254" value="${escapeHtml(ctx.email || '')}" placeholder="voce@exemplo.com" required></div>` : ''}
        ${password ? `<div class="field"><label for="auth-password">${newPassword ? 'Nova senha' : 'Senha'}</label><div class="auth-password-wrap"><input id="auth-password" name="password" type="password" autocomplete="${newPassword ? 'new-password' : 'current-password'}" minlength="${newPassword ? 8 : 1}" maxlength="128" required><button type="button" data-toggle-password="auth-password" aria-controls="auth-password" aria-pressed="false">Mostrar</button></div>${newPassword ? '<small>Pelo menos 8 caracteres.</small>' : ''}</div>` : ''}
        ${['signup','reset'].includes(mode) ? '<div class="field"><label for="auth-confirm">Confirme a senha</label><input id="auth-confirm" name="confirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div>' : ''}
        ${mode === 'login' ? '<div class="auth-options"><label><input id="auth-remember" type="checkbox" checked> Lembrar meu e-mail</label><button type="button" data-auth-mode="forgot">Esqueci a senha</button></div>' : ''}
        <button class="primary-btn auth-submit" type="submit" id="auth-submit">${submit}</button>
      </form>
      ${mode === 'login' ? '<p class="auth-switch">Ainda não tem conta? <button data-auth-mode="signup">Criar conta</button></p>' : mode !== 'reset' ? '<p class="auth-switch"><button data-auth-mode="login">Voltar para entrar</button></p>' : ''}
    </div></section>`;
  },
  bind(ctx) {
    const mode = ctx.state.authMode || 'login';
    $$('[data-auth-mode]').forEach(button => button.addEventListener('click', () => ctx.showAuth(button.dataset.authMode)));
    $$('[data-toggle-password]').forEach(button => button.addEventListener('click', () => {
      const input = $(`#${button.dataset.togglePassword}`);
      const visible = input.type === 'password'; input.type = visible ? 'text' : 'password';
      button.textContent = visible ? 'Ocultar' : 'Mostrar'; button.setAttribute('aria-pressed', String(visible));
    }));
    const feedback = message => { const el = $('#auth-feedback'); el.textContent = message; el.classList.remove('hidden'); };
    let busy = false;
    const run = async action => {
      if (busy) return;
      busy = true;
      const buttons = [...document.querySelectorAll('.auth-card button')]; buttons.forEach(button => button.disabled = true);
      const submit = $('#auth-submit'); const oldLabel = submit.textContent; submit.textContent = 'Aguarde…';
      try { await action(); } catch (error) { feedback(authMessage(error)); }
      finally { busy = false; buttons.forEach(button => button.disabled = false); if (submit.isConnected) submit.textContent = oldLabel; }
    };
    $('#auth-form').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const confirm = form.elements.namedItem('confirm');
      if (confirm) confirm.setCustomValidity(confirm.value === form.elements.namedItem('password').value ? '' : 'As senhas precisam ser iguais.');
      if (!form.reportValidity()) return;
      const email = form.elements.namedItem('email')?.value.trim() || '';
      const password = form.elements.namedItem('password')?.value || '';
      await run(async () => {
        let result;
        if (mode === 'login') {
          const remember = $('#auth-remember').checked;
          if (remember) localStorage.setItem('desato-remember-email', email); else localStorage.removeItem('desato-remember-email');
          result = await ctx.auth.signIn(email, password);
        } else if (mode === 'signup') result = await ctx.auth.signUp(form.elements.namedItem('name').value.trim(), email, password);
        else if (mode === 'forgot') result = await ctx.auth.forgot(email);
        else result = await ctx.auth.reset(password);
        if (result.error) throw result.error;
        form.querySelectorAll('input[type="password"], #auth-password, #auth-confirm').forEach(input => input.value = '');
        if (mode === 'forgot') feedback('Se houver uma conta com esse e-mail, você receberá um link para recuperar a senha. Abra o link neste mesmo navegador.');
        if (mode === 'signup' && !result.data?.session) feedback('Confira seu e-mail para confirmar o cadastro. Depois, volte para entrar.');
        if (mode === 'reset') await ctx.passwordChanged();
      });
    });
    $('#auth-confirm')?.addEventListener('input', event => event.target.setCustomValidity(''));
  }
};
