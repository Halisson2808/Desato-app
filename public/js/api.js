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
    const error = new Error(data.error || `Erro ${res.status}`); error.status = res.status; throw error;
  }
  return data;
}

export const endpoints = {
  state: () => api('/api/state'),
  saveSupportPlan: body => api('/api/support/plan', { method: 'PUT', body: JSON.stringify(body) }),
  favoriteGuide: (id, favorite) => api(`/api/support/favorites/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ favorite }) }),
  summary: () => api('/api/summary'),
  profile: body => api('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
  money: body => api('/api/money', { method: 'PUT', body: JSON.stringify(body) }),
  checkin: body => api('/api/checkin', { method: 'POST', body: JSON.stringify(body) }),
  hydration: body => api('/api/hydration', { method: 'POST', body: JSON.stringify(body) }),
  sos: body => api('/api/sos-session', { method: 'POST', body: JSON.stringify(body) }),
  addGrocery: text => api('/api/groceries', { method: 'POST', body: JSON.stringify({ text }) }),
  patchGrocery: (id, body) => api(`/api/groceries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteGrocery: id => api(`/api/groceries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  addTask: body => api('/api/routine/tasks', { method: 'POST', body: JSON.stringify(body) }),
  patchTask: (id, body) => api(`/api/routine/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask: id => api(`/api/routine/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  completeTask: body => api('/api/routine/complete', { method: 'POST', body: JSON.stringify(body) })
};
