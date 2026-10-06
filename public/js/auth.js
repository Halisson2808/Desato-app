import { createClient } from '../vendor/supabase.js';
let client;
let config;
let recovery = false;
export async function initializeAuth(onChange) {
  const response = await fetch('/api/config', { cache: 'no-store' });
  if (!response.ok) throw new Error('Não consegui carregar o login. Reinicie o servidor do Desato e tente novamente.');
  config = await response.json();
  if (config.mode === 'json') return { config, session: null };
  client = createClient(config.supabaseUrl, config.publishableKey, { auth: {
    persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
    storageKey: 'desato-auth-session', flowType: 'pkce'
  } });
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') { recovery = true; sessionStorage.setItem('desato-password-recovery', '1'); }
    setTimeout(() => onChange(event, session), 0);
  });
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return { config, session: data.session, recovery: recovery || sessionStorage.getItem('desato-password-recovery') === '1' };
}
export async function accessSession() {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session || null;
}
const redirect = () => location.origin;
export const auth = {
  signIn: (email, password) => client.auth.signInWithPassword({ email, password }),
  signUp: (name, email, password) => client.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: redirect(false) } }),
  forgot: email => client.auth.resetPasswordForEmail(email, { redirectTo: redirect(true) }),
  reset: password => client.auth.updateUser({ password }),
  updateEmail: email => client.auth.updateUser({ email }, { emailRedirectTo: redirect(false) }),
  signOut: async () => {
    sessionStorage.removeItem('desato-password-recovery');
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }
};
export function authMessage(error) {
  const message = error?.message || '';
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'Confirme o cadastro pelo link enviado ao seu e-mail antes de entrar.';
  if (/password|weak_password/i.test(message)) return 'Use uma senha com pelo menos 8 caracteres. Confira os requisitos informados pelo Supabase.';
  if (/rate limit|too many|security purposes/i.test(message)) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (/email address.*not authorized|email.*sending|smtp/i.test(message)) return 'O serviço de e-mail ainda precisa ser configurado no Supabase para este endereço.';
  if (/fetch|network/i.test(message)) return 'Não consegui conectar. Confira sua conexão e tente novamente.';
  if (/signup.*disabled|signups.*disabled/i.test(message)) return 'O cadastro está desativado na configuração do Supabase.';
  return message || 'Não foi possível concluir. Tente novamente.';
}
