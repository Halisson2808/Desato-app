import { createClient } from '../vendor/supabase.js';
let client;
let config;
export async function initializeAuth(onChange) {
  const response = await fetch('/api/config', { cache: 'no-store' });
  if (!response.ok) throw new Error('Não consegui carregar o login. Reinicie o servidor do Desato e tente novamente.');
  config = await response.json();
  if (config.mode === 'json') return { config, session: null };
  // Por enquanto a sessão não fica salva no aparelho: a cada abertura a pessoa toca em Entrar
  // com o e-mail já preenchido. Remove sessões salvas por versões anteriores.
  try { localStorage.removeItem('desato-auth-session'); } catch { /* armazenamento indisponível */ }
  client = createClient(config.supabaseUrl, config.publishableKey, { auth: {
    persistSession: false, autoRefreshToken: true, detectSessionInUrl: false,
    storageKey: 'desato-auth-session', flowType: 'pkce'
  } });
  client.auth.onAuthStateChange((event, session) => {
    setTimeout(() => onChange(event, session), 0);
  });
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return { config, session: data.session };
}
export async function accessSession() {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session || null;
}
export const auth = {
  // Confere a compra no servidor do Supabase e recebe a sessão direto, sem e-mail.
  emailLogin: async email => {
    let response;
    try {
      response = await fetch(`${config.supabaseUrl}/functions/v1/email-login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: config.publishableKey }, body: JSON.stringify({ email })
      });
    } catch { throw new Error('network'); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível entrar. Tente novamente.');
    const { error } = await client.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
    if (error) throw error;
  },
  signOut: async () => {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }
};
export function authMessage(error) {
  const message = error?.message || '';
  if (/rate limit|too many/i.test(message)) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (/^network$|fetch|network/i.test(message)) return 'Não consegui conectar. Confira sua conexão e tente novamente.';
  return message || 'Não foi possível entrar. Tente novamente.';
}
