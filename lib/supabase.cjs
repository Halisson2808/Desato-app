const { randomUUID } = require('node:crypto');

function failure(status, message) { const error = new Error(message); error.status = status; return error; }
function requiredText(value, limit, label, optional = false) {
  if (typeof value !== 'string' || value.trim().length > limit || (!optional && !value.trim())) throw failure(400, `${label} inválido.`);
  return value.trim();
}
function number(value, min, max, label, integer = false) {
  if (!['number', 'string'].includes(typeof value) || value === '' || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max || (integer && !Number.isInteger(Number(value)))) throw failure(400, `${label} inválido.`);
  return Number(value);
}
function boolean(value) { if (typeof value !== 'boolean') throw failure(400, 'Informe verdadeiro ou falso.'); return value; }

function createCloud({ url, key, fetchImpl = fetch }) {
  async function remoteFetch(...args) {
    try { return await fetchImpl(...args); } catch { throw failure(503, 'Não consegui conectar ao Supabase. Tente novamente.'); }
  }
  async function authenticate(req) {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
    if (!match) throw failure(401, 'Entre na sua conta para continuar.');
    const response = await remoteFetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${match[1]}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw failure(response.status >= 500 ? 503 : 401, response.status >= 500 ? 'Autenticação indisponível. Tente novamente.' : 'Sua sessão expirou. Entre novamente.');
    const user = await response.json();
    if (!user?.id) throw failure(401, 'Sessão inválida.');
    return { user, token: match[1] };
  }
  async function request(session, table, method = 'GET', body, params = {}) {
    const query = new URLSearchParams({ user_id: `eq.${session.user.id}`, ...params });
    const response = await remoteFetch(`${url}/rest/v1/desato_${table}?${query}`, {
      method, headers: { apikey: key, Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      // Não propaga mensagens SQL ou conteúdo pessoal do banco ao navegador/log.
      const status = [401, 403].includes(response.status) ? response.status : response.status < 500 ? 400 : 503;
      throw failure(status, status === 401 ? 'Sua sessão expirou. Entre novamente.' : status === 403 ? 'Você não tem acesso a esse registro.' : status === 400 ? 'Não foi possível salvar. Confira os dados informados.' : 'Banco indisponível. Tente novamente.');
    }
    const text = await response.text(); return text ? JSON.parse(text) : [];
  }
  async function rows(session, table, order) {
    const result = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await request(session, table, 'GET', undefined, { select: '*', order, limit: '1000', offset: String(offset) });
      if (!Array.isArray(page)) throw failure(503, 'Resposta inesperada do banco.');
      result.push(...page); if (page.length < 1000) return result;
    }
  }
  async function state(session, defaults) {
    const tables = [['profiles','user_id'],['money','user_id'],['checkins','day'],['hydration','day'],['sos_sessions','created_at.desc,id'],['journey_days','day'],['situation_plans','situation_id']];
    const data = Object.fromEntries(await Promise.all(tables.map(async ([table, order]) => [table, await rows(session, table, order)])));
    const profile = data.profiles[0];
    const store = defaults();
    store.profile = profile ? { name: profile.name, email: session.user.email || '', startDate: profile.start_date, goal: profile.goal } : { ...store.profile, name: typeof session.user.user_metadata?.name === 'string' ? session.user.user_metadata.name.slice(0, 80) : 'Você', email: session.user.email || '' };
    if (data.money[0]) store.money = { spendPerOuting: Number(data.money[0].spend_per_outing), outingsPerWeek: Number(data.money[0].outings_per_week), currency: data.money[0].currency };
    store.checkins = Object.fromEntries(data.checkins.map(row => [row.day, { status: row.status, note: row.note }]));
    store.hydration = Object.fromEntries(data.hydration.map(row => [row.day, row.cups]));
    store.sos.sessions = data.sos_sessions.slice(0, 100).map(row => ({ id: row.id, createdAt: row.created_at, intensity: row.intensity, action: row.action }));
    store.journey = Object.fromEntries(data.journey_days.map(row => [row.day, { answer: row.answer, completedAt: row.completed_at }]));
    store.situations = Object.fromEntries(data.situation_plans.map(row => [row.situation_id, { drink: row.drink, refuse: row.refuse, leaveAt: row.leave_at, updatedAt: row.updated_at }]));
    return store;
  }
  async function mutate(session, pathname, method, body, validDate, content = {}) {
    const user_id = session.user.id;
    const upsert = (table, value, conflict) => request(session, table, 'POST', { user_id, ...value }, { on_conflict: conflict });
    const patch = (table, id, value) => request(session, table, 'PATCH', value, { id: `eq.${id}` });
    const remove = (table, params) => request(session, table, 'DELETE', undefined, params);
    if (pathname === '/api/journey' && method === 'POST') {
      const day = number(body.day, 1, content.journeyLength || 30, 'Dia', true);
      const answer = requiredText(body.answer, 500, 'Resposta');
      if (day > 1 && !(await request(session, 'journey_days', 'GET', undefined, { day: `eq.${day - 1}`, select: 'day' })).length) throw failure(400, 'Conclua o dia anterior primeiro.');
      // Editar a resposta mantém a data original de conclusão.
      const existing = await request(session, 'journey_days', 'GET', undefined, { day: `eq.${day}`, select: 'day' });
      if (existing.length) await request(session, 'journey_days', 'PATCH', { answer }, { day: `eq.${day}` });
      else await upsert('journey_days', { day, answer }, 'user_id,day');
    } else if (/^\/api\/situations\/[^/]+$/.test(pathname) && method === 'PUT') {
      const id = decodeURIComponent(pathname.split('/').pop());
      if (!(content.situationIds || []).includes(id)) throw failure(404, 'Situação não encontrada.');
      await upsert('situation_plans', { situation_id: id, drink: requiredText(body.drink, 160, 'Bebida'), refuse: requiredText(body.refuse, 160, 'Frase'), leave_at: requiredText(body.leaveAt, 160, 'Saída') }, 'user_id,situation_id');
    } else if (pathname === '/api/profile' && method === 'PUT') {
      const value = {};
      if ('email' in body && body.email !== session.user.email) throw failure(400, 'Altere o e-mail pela configuração da conta.');
      if ('name' in body) value.name = requiredText(body.name, 80, 'Nome');
      if ('goal' in body) value.goal = requiredText(body.goal, 240, 'Objetivo', true);
      if ('startDate' in body) value.start_date = validDate(body.startDate);
      await upsert('profiles', value, 'user_id');
    } else if (pathname === '/api/money' && method === 'PUT') {
      await upsert('money', { spend_per_outing: number(body.spendPerOuting, 0, 1000000, 'Gasto'), outings_per_week: number(body.outingsPerWeek, 0, 14, 'Frequência') }, 'user_id');
    } else if (pathname === '/api/checkin' && method === 'POST') {
      if (!['clean', 'used'].includes(body.status)) throw failure(400, 'Registro inválido.');
      await upsert('checkins', { day: validDate(body.date), status: body.status, note: requiredText(body.note ?? '', 500, 'Anotação', true) }, 'user_id,day');
    } else if (pathname === '/api/hydration' && method === 'POST') {
      await upsert('hydration', { day: validDate(body.date), cups: number(body.cups, 0, 8, 'Copos', true) }, 'user_id,day');
    } else if (pathname === '/api/sos-session' && method === 'POST') {
      await upsert('sos_sessions', { id: `sos_${randomUUID()}`, intensity: number(body.intensity ?? 3, 1, 5, 'Intensidade', true), action: requiredText(body.action ?? 'opened', 80, 'Ação') }, 'user_id,id');
    } else throw failure(404, 'Rota não encontrada.');
  }
  // Assinatura ativa na Cakto, gravada pelo webhook; a regra fica toda no banco.
  async function hasAccess(session) {
    const response = await remoteFetch(`${url}/rest/v1/rpc/desato_has_access`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw failure(response.status === 401 ? 401 : 503, response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : 'Não consegui verificar sua assinatura. Tente novamente.');
    return (await response.json()) === true;
  }
  async function isAdmin(session) {
    const response = await remoteFetch(`${url}/rest/v1/rpc/desato_is_admin`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000) });
    if (!response.ok) return false;
    return (await response.json()) === true;
  }
  return { authenticate, hasAccess, isAdmin, state, mutate };
}
module.exports = { createCloud };
