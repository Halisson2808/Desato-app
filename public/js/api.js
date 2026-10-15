import { accessSession, auth } from './auth.js';
let accountId = null;
export function setAccountId(id) { accountId = id || null; }
export async function api(path, options = {}) {
  const expectedAccount = accountId;
  const session = await accessSession();
  if (expectedAccount !== accountId || (expectedAccount && session?.user?.id !== expectedAccount)) throw new Error('A conta mudou. Tente novamente na conta atual.');
  const token = session?.access_token;
  const config = { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
  const res = await fetch(path, config);
  let data;
  try { data = await res.json(); } catch { throw new Error('Resposta inválida do servidor. Reinicie o aplicativo.'); }
  if (!res.ok) {
    if (res.status === 401 && token) await auth.signOut().catch(() => {});
    const error = new Error(data.error || `Erro ${res.status}`); error.status = res.status; error.checkoutUrl = data.checkoutUrl; throw error;
  }
  return data;
}

export const endpoints = {
  state: () => api('/api/state'),
  summary: () => api('/api/summary'),
  profile: body => api('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
  money: body => api('/api/money', { method: 'PUT', body: JSON.stringify(body) }),
  checkin: body => api('/api/checkin', { method: 'POST', body: JSON.stringify(body) }),
  hydration: body => api('/api/hydration', { method: 'POST', body: JSON.stringify(body) }),
  sos: body => api('/api/sos-session', { method: 'POST', body: JSON.stringify(body) }),
  journey: body => api('/api/journey', { method: 'POST', body: JSON.stringify(body) }),
  situation: (id, body) => api(`/api/situations/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) })
};
