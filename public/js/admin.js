import { initializeAuth, accessSession, auth } from './auth.js';
import { FUNNELS } from './quiz-model.js';

// Painel de administrador: entra com e-mail e senha; os números vêm do banco (só admin lê).
const root = document.querySelector('#admin');
const quiz = FUNNELS[0];
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = value => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
const pct = (part, total) => total ? `${Math.round(part / total * 100)}%` : '—';
let days = 7, data = null, tab = 'users';

const EVENT_LABELS = {
  page_view: 'Abriu a página', quiz_start: 'Começou o quiz', question_view: 'Viu a pergunta', answer: 'Respondeu',
  bridge_view: 'Tela de transição', result_view: 'Viu o resultado', offer_view: 'Viu a oferta', checkout_click: 'Clicou em comprar',
  login_view: 'Abriu a entrada do app', login_success: 'Entrou no app', login_denied: 'E-mail sem compra'
};
const questionTitle = id => quiz.questions.find(q => q.id === id)?.title || id || '';
const questionByStep = step => quiz.questions[step - 1];
function answerLabel(step, value) {
  const question = questionByStep(step);
  if (!question) return value;
  if (question.type === 'money') return `R$ ${value}`;
  if (question.type === 'frequency') return `${String(value).replace('.', ',')}x por semana`;
  return String(value).split(',').map(item => question.options?.find(o => o.value === item)?.label || item).join(' + ');
}

// Sessão aberta com senha? (o servidor confere de novo; aqui só decide qual tela mostrar)
function openedWithPassword(session) {
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Array.isArray(payload.amr) && payload.amr.some(item => item?.method === 'password');
  } catch { return false; }
}

function loginScreen(message = '') {
  root.innerHTML = `<section class="admin-login">
    <img src="/favicon.png" width="64" height="64" alt="">
    <h1>Painel do Desato</h1><p>Área restrita ao administrador.</p>
    <form id="admin-form">
      <label for="admin-email">E-mail</label><input id="admin-email" type="email" autocomplete="username" required>
      <label for="admin-pass">Senha</label><input id="admin-pass" type="password" autocomplete="current-password" required>
      <p class="admin-error" id="admin-error" ${message ? '' : 'hidden'}>${escape(message)}</p>
      <button type="submit" id="admin-submit">Entrar</button>
    </form></section>`;
  document.querySelector('#admin-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.querySelector('#admin-submit'), error = document.querySelector('#admin-error');
    button.disabled = true; button.textContent = 'Entrando…'; error.hidden = true;
    const { error: failure } = await auth.passwordLogin(document.querySelector('#admin-email').value.trim(), document.querySelector('#admin-pass').value);
    document.querySelector('#admin-pass').value = '';
    if (failure) { error.textContent = 'E-mail ou senha incorretos.'; error.hidden = false; button.disabled = false; button.textContent = 'Entrar'; return; }
    load();
  });
}

function passwordScreen(fromDashboard = false) {
  root.innerHTML = `<section class="admin-login">
    <img src="/favicon.png" width="64" height="64" alt="">
    <h1>${fromDashboard ? 'Trocar senha' : 'Criar sua senha'}</h1><p>Use pelo menos 10 caracteres.</p>
    <form id="pass-form">
      <label for="pass-new">Nova senha</label><input id="pass-new" type="password" autocomplete="new-password" minlength="10" required>
      <label for="pass-again">Repita a senha</label><input id="pass-again" type="password" autocomplete="new-password" minlength="10" required>
      <p class="admin-error" id="pass-error" hidden></p>
      <button type="submit" id="pass-submit">Salvar senha</button>
      ${fromDashboard ? '<button type="button" class="admin-link" id="pass-back">Voltar ao painel</button>' : ''}
    </form></section>`;
  document.querySelector('#pass-back')?.addEventListener('click', dashboard);
  document.querySelector('#pass-form').addEventListener('submit', async event => {
    event.preventDefault();
    const first = document.querySelector('#pass-new').value, again = document.querySelector('#pass-again').value, error = document.querySelector('#pass-error');
    if (first.length < 10) { error.textContent = 'Use pelo menos 10 caracteres.'; error.hidden = false; return; }
    if (first !== again) { error.textContent = 'As senhas não conferem.'; error.hidden = false; return; }
    const button = document.querySelector('#pass-submit'); button.disabled = true;
    const { error: failure } = await auth.setPassword(first);
    document.querySelector('#pass-new').value = ''; document.querySelector('#pass-again').value = '';
    if (failure) { error.textContent = 'O Supabase recusou essa senha. Tente uma mais forte.'; error.hidden = false; button.disabled = false; return; }
    if (fromDashboard) { dashboard(); return; }
    // Depois de criar pelo link do e-mail, entra de novo com a senha (o painel exige sessão aberta com senha).
    await auth.signOut().catch(() => {});
    loginScreen('Senha criada. Agora entre com o seu e-mail e a senha.');
  });
}

async function load() {
  const session = await accessSession();
  if (!session || !openedWithPassword(session)) return loginScreen();
  root.innerHTML = '<p class="admin-loading">Carregando os números…</p>';
  const response = await fetch(tab === 'users' ? '/api/admin/users' : `/api/admin/overview?days=${days}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
  const body = await response.json().catch(() => ({}));
  if (response.status === 403 || response.status === 401) { await auth.signOut().catch(() => {}); return loginScreen(body.error || 'Acesso restrito ao administrador.'); }
  if (!response.ok) { root.innerHTML = `<p class="admin-loading">${escape(body.error || 'Não consegui carregar.')} <button id="retry">Tentar de novo</button></p>`; document.querySelector('#retry').onclick = load; return; }
  data = body; tab === 'users' ? usersTab() : dashboard();
}

const table = (headers, rows) => rows.length
  ? `<div class="admin-table-wrap"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
  : '<p class="admin-empty">Sem dados neste período.</p>';

function funnelRows() {
  const f = data.funnel, steps = data.steps || [];
  const rows = [['Entraram na página', f.visits], ['Começaram o quiz', f.started]];
  for (const s of steps) {
    if (questionByStep(s.step)?.id === 'spend') rows.push(['Tela de transição', f.bridge]);
    rows.push([`Pergunta ${s.step}: ${questionTitle(s.question || questionByStep(s.step)?.id)}`, s.answered, s.viewed]);
  }
  rows.push(['Viram o resultado', f.result], ['Viram a oferta', f.offer], ['Clicaram em comprar', f.checkout]);
  return rows;
}

// Topo do painel: abas + (só no tráfego) o filtro de período.
function topBar() {
  return `<header class="admin-top"><div><img src="/favicon.png" width="36" height="36" alt=""><h1>Painel do Desato</h1></div>
      <div class="admin-period">${tab === 'traffic' ? [[1, 'Hoje'], [7, '7 dias'], [30, '30 dias'], [90, '90 dias']].map(([d, l]) => `<button data-days="${d}" class="${d === days ? 'on' : ''}">${l}</button>`).join('') : ''}<button id="admin-out" class="ghost">Sair</button></div></header>
    <nav class="admin-tabs"><button data-tab="users" class="${tab === 'users' ? 'on' : ''}">Usuários</button><button data-tab="traffic" class="${tab === 'traffic' ? 'on' : ''}">Tráfego e quiz</button></nav>`;
}
function bindTop() {
  root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { if (tab !== b.dataset.tab) { tab = b.dataset.tab; load(); } }));
  root.querySelectorAll('[data-days]').forEach(b => b.addEventListener('click', () => { days = Number(b.dataset.days); load(); }));
  document.querySelector('#admin-out').addEventListener('click', async () => { await auth.signOut().catch(() => {}); loginScreen(); });
}
const when = value => value ? new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

// Aba Usuários: contas, compras, assinaturas do upsell e quando cada um entrou.
function usersTab() {
  const t = data.totals;
  root.innerHTML = `${topBar()}
    <section class="admin-kpis">
      ${[['Contas criadas', t.accounts], ['Compraram o app', t.buyers], ['Assinantes do upsell', t.subscribers, 'Em breve'], ['Entraram nos últimos 7 dias', t.active_7d], ['Marcaram o dia (7 dias)', t.checkins_7d], ['Reembolsos/chargebacks', t.refunded]]
        .map(([label, value, extra]) => `<article><span>${label}</span><strong>${num(value)}</strong>${extra ? `<small>${extra}</small>` : ''}</article>`).join('')}
    </section>
    ${data.buyers_without_account ? `<p class="admin-hint">${num(data.buyers_without_account)} ${data.buyers_without_account === 1 ? 'pessoa comprou e ainda não entrou' : 'pessoas compraram e ainda não entraram'} no app.</p>` : ''}
    <section class="admin-card"><h2>Usuários e quando entraram</h2><p class="admin-hint">Ordenado pela última entrada. "Último dia marcado" é o último "Você bebeu hoje?" respondido.</p>
      ${table(['E-mail', 'Criou a conta', 'Última entrada', 'Compra', 'Upsell', 'Dias marcados', 'Último dia marcado'],
        data.users.map(u => [`${escape(u.email)}${u.role === 'admin' ? ' <span class="admin-tag">admin</span>' : ''}`, when(u.created_at), when(u.last_sign_in_at),
          u.purchase === 'paid' ? 'Paga' : u.purchase ? escape(u.purchase) : '—', u.subscription ? escape(u.subscription) : '—', num(u.checkins),
          u.last_checkin ? u.last_checkin.split('-').reverse().join('/') : '—']))}
    </section>`;
  bindTop();
}

function dashboard() {
  const t = data.totals, f = data.funnel, rows = funnelRows(), top = rows[0][1] || 0;
  const maxDay = Math.max(1, ...data.daily.map(d => d.visitors));
  const answersByStep = {};
  for (const a of data.answers) (answersByStep[a.step] ||= []).push(a);
  root.innerHTML = `${topBar()}

    <section class="admin-kpis">
      ${[['Visitantes', t.visitors], ['Sessões', t.sessions], ['Começaram o quiz', f.started, pct(f.started, f.visits)], ['Viram a oferta', f.offer, pct(f.offer, f.visits)], ['Clicaram em comprar', f.checkout, pct(f.checkout, f.visits)]]
        .map(([label, value, extra]) => `<article><span>${label}</span><strong>${num(value)}</strong>${extra ? `<small>${extra} das visitas</small>` : ''}</article>`).join('')}
    </section>

    <section class="admin-card"><h2>Funil do quiz</h2><p class="admin-hint">Pessoas (sessões) que chegaram em cada etapa. A barra mostra o quanto sobrou das visitas; o número vermelho é quem desistiu na etapa.</p>
      <div class="admin-funnel">${rows.map(([label, value], i) => {
        const prev = i ? rows[i - 1][1] : value, lost = Math.max(0, (prev || 0) - (value || 0));
        return `<div class="admin-funnel-row"><span class="label">${escape(label)}</span><div class="bar"><i style="width:${top ? Math.max(2, (value || 0) / top * 100) : 0}%"></i></div><strong>${num(value)}</strong><small>${pct(value, top)}</small><em>${i && lost ? `−${num(lost)}` : ''}</em></div>`;
      }).join('')}</div></section>

    <section class="admin-grid">
      <div class="admin-card"><h2>De onde vieram</h2>${table(['Origem', 'Sessões', 'Quiz', 'Oferta', 'Comprar'], data.sources.map(s => [escape(s.source), num(s.sessions), num(s.started), num(s.offer), num(s.checkout)]))}</div>
      <div class="admin-card"><h2>Aparelhos</h2>${table(['Aparelho', 'Sessões'], Object.entries(data.devices).map(([d, n]) => [{ mobile: 'Celular', tablet: 'Tablet', desktop: 'Computador' }[d] || d, num(n)]))}
        <h2 class="mt">App</h2>${table(['Entrada do app', 'Total'], [['Abriram a tela de entrada', num(data.app.login_views)], ['Entraram com e-mail', num(data.app.logins)], ['E-mail sem compra', num(data.app.denied)]])}</div>
    </section>

    <section class="admin-card"><h2>Campanhas (utm e src)</h2>${table(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'src', 'Sessões', 'Oferta', 'Comprar'],
      data.campaigns.map(c => [escape(c.utm_source), escape(c.utm_medium), escape(c.utm_campaign), escape(c.utm_content), escape(c.src), num(c.sessions), num(c.offer), num(c.checkout)]))}</section>

    <section class="admin-grid">
      <div class="admin-card"><h2>URLs de entrada</h2>${table(['URL', 'Sessões'], data.landings.map(l => [`<code>${escape(l.landing || '/')}</code>`, num(l.sessions)]))}</div>
      <div class="admin-card"><h2>Sites de origem</h2>${table(['Site', 'Sessões'], data.referrers.map(r => [escape(r.referrer), num(r.sessions)]))}</div>
    </section>

    <section class="admin-card"><h2>Por dia</h2>
      ${data.daily.length ? `<div class="admin-days">${data.daily.map(d => `<div title="${d.day}: ${d.visitors} visitantes, ${d.started} no quiz, ${d.offer} na oferta, ${d.checkout} clicaram comprar"><i style="height:${d.visitors / maxDay * 100}%"></i><b style="height:${d.checkout / maxDay * 100}%"></b><span>${d.day.slice(8, 10)}/${d.day.slice(5, 7)}</span></div>`).join('')}</div><p class="admin-hint">Barra clara: visitantes. Barra escura: clicaram em comprar. Toque numa barra para ver os números.</p>` : '<p class="admin-empty">Sem dados neste período.</p>'}</section>

    <section class="admin-card"><h2>Respostas do quiz</h2>
      ${Object.keys(answersByStep).length ? Object.entries(answersByStep).map(([step, list]) => {
        const total = list.reduce((sum, a) => sum + a.count, 0);
        return `<div class="admin-answers"><h3>${step}. ${escape(questionTitle(questionByStep(Number(step))?.id))}</h3>${list.slice(0, 8).map(a => `<div><span>${escape(answerLabel(Number(step), a.answer))}</span><div class="bar"><i style="width:${a.count / total * 100}%"></i></div><strong>${num(a.count)}</strong></div>`).join('')}</div>`;
      }).join('') : '<p class="admin-empty">Sem respostas neste período.</p>'}</section>

    <section class="admin-card"><h2>Últimas sessões, passo a passo</h2>
      ${data.sessions.length ? data.sessions.map(s => `<details class="admin-session"><summary><span>${new Date(s.started_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><b>${escape(s.source)}</b><span>${{ mobile: 'Celular', tablet: 'Tablet', desktop: 'Computador' }[s.device] || s.device}</span><span class="last">${escape(EVENT_LABELS[s.events?.at(-1)?.event] || '')}</span></summary>
        <p class="admin-hint">Entrou por <code>${escape(s.landing || '/')}</code>${s.utm_campaign ? ` · campanha ${escape(s.utm_campaign)}` : ''}</p>
        <ol>${(s.events || []).map(e => `<li><time>${new Date(e.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time> ${escape(EVENT_LABELS[e.event] || e.event)}${e.step ? ` ${e.step}` : ''}${e.event === 'answer' ? `: <b>${escape(answerLabel(e.step, e.detail))}</b>` : e.event === 'question_view' ? ` — ${escape(questionTitle(e.detail))}` : e.event === 'page_view' ? ` <code>${escape(e.path)}</code>` : ''}</li>`).join('')}</ol></details>`).join('') : '<p class="admin-empty">Sem sessões neste período.</p>'}</section>`;
  bindTop();
}

initializeAuth(() => {}).then(async () => {
  const params = new URLSearchParams(location.search);
  // Link de senha velho ou já usado: limpa o endereço e avisa, sem mostrar o erro técnico.
  if (params.get('error') || location.hash.includes('error=')) { history.replaceState(null, '', '/admin'); return loginScreen('Esse link de senha expirou ou já foi usado. Entre com o seu e-mail e a sua senha.'); }
  const code = params.get('code');
  if (!code) return load();
  history.replaceState(null, '', '/admin');
  const { error } = await auth.exchangeCode(code);
  if (error) return loginScreen('O link expirou ou já foi usado. Peça outro em "Criar ou esqueci minha senha".');
  passwordScreen();
}).catch(() => loginScreen('Não consegui iniciar. Recarregue a página.'));
