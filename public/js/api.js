export async function api(path, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  };
  const res = await fetch(path, config);
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text || 'Resposta inválida.' }; }
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
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
