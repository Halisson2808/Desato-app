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
      <div class="admin-period">${tab !== 'users' ? [[1, 'Hoje'], [7, '7 dias'], [30, '30 dias'], [90, '90 dias']].map(([d, l]) => `<button data-days="${d}" class="${d === days ? 'on' : ''}">${l}</button>`).join('') : ''}<button id="admin-out" class="ghost">Sair</button></div></header>
    <nav class="admin-tabs"><button data-tab="users" class="${tab === 'users' ? 'on' : ''}">Usuários</button><button data-tab="traffic" class="${tab === 'traffic' ? 'on' : ''}">Tráfego</button><button data-tab="quiz" class="${tab === 'quiz' ? 'on' : ''}">Quiz</button></nav>`;
}
// Dica flutuante: aparece ao passar o mouse (ou tocar) em qualquer elemento com data-tip.
let tipEl = null;
function bindTips() {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'admin-tip'; tipEl.hidden = true; document.body.appendChild(tipEl); }
  const show = (target, event) => {
    tipEl.innerHTML = target.getAttribute('data-tip'); tipEl.hidden = false;
    const box = tipEl.getBoundingClientRect();
    tipEl.style.left = Math.max(8, Math.min(window.innerWidth - box.width - 8, event.clientX + 14)) + 'px';
    tipEl.style.top = Math.max(8, Math.min(window.innerHeight - box.height - 8, event.clientY + 14)) + 'px';
  };
  root.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('pointermove', event => show(el, event));
    el.addEventListener('pointerdown', event => show(el, event));
    el.addEventListener('pointerleave', () => { tipEl.hidden = true; });
  });
}
function bindTop() {
  bindTips();
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
      ${[['Contas criadas', t.accounts], ['Compraram o app', t.buyers], ['Assinantes do upsell', t.subscribers, 'Em breve'], ['Entraram nos últimos 7 dias', t.active_7d], ['Reembolsos/chargebacks', t.refunded]]
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

// Dias do período, do mais antigo ao de hoje (fuso de São Paulo); dias sem visita entram com zero.
function periodDays() {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  const list = [];
  for (let i = days - 1; i >= 0; i--) list.push(fmt.format(new Date(Date.now() - i * 86_400_000)));
  const byDay = Object.fromEntries((data.daily || []).map(d => [String(d.day).slice(0, 10), d]));
  return list.map(day => ({ day, visitors: 0, started: 0, offer: 0, checkout: 0, ...(byDay[day] || {}) }));
}
// Gráfico de linhas: visitantes e cliques em comprar, um ponto por dia do período.
function lineChart(points) {
  const W = 640, H = 220, L = 34, R = 12, T = 14, B = 28;
  const max = Math.max(1, ...points.map(p => p.visitors));
  const step = points.length > 1 ? (W - L - R) / (points.length - 1) : 0;
  const x = i => points.length > 1 ? L + i * step : (W + L - R) / 2;
  const y = v => T + (H - T - B) * (1 - v / max);
  const line = key => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const every = Math.ceil(points.length / 8);
  const grid = [0, .5, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}" class="grid"/><text x="${L - 6}" y="${y(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="admin-line" role="img" aria-label="Visitantes e cliques em comprar por dia">${grid}
    <path d="${line('visitors')}" class="l-visitors"/><path d="${line('checkout')}" class="l-checkout"/>
    ${points.map((p, i) => {
      const w = points.length > 1 ? step : W - L - R, x0 = x(i) - w / 2;
      const tip = `<strong>${p.day.split('-').reverse().join('/')}</strong><br>${num(p.visitors)} ${p.visitors === 1 ? 'visitante' : 'visitantes'}<br>${num(p.started)} no quiz · ${num(p.offer)} na oferta<br>${num(p.checkout)} clicaram em comprar`;
      return `<g class="day" data-tip="${escape(tip)}"><rect class="hit" x="${x0.toFixed(1)}" y="${T}" width="${w.toFixed(1)}" height="${H - T - B}"/><line class="guide" x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}"/><circle cx="${x(i)}" cy="${y(p.visitors)}" r="4" class="d-visitors"/><circle cx="${x(i)}" cy="${y(p.checkout)}" r="3.5" class="d-checkout"/></g>${i % every === 0 || i === points.length - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${p.day.slice(8, 10)}/${p.day.slice(5, 7)}</text>` : ''}`;
    }).join('')}
  </svg>
  <div class="admin-legend"><span><i class="c1"></i>Visitantes</span><span><i class="c2"></i>Clicaram em comprar</span></div>`;
}
// Pizza (rosca) com porcentagem e quantidade na legenda.
const PIE_COLORS = ['#1d6b48', '#4fa376', '#9fd0b3', '#e0b43c', '#d98a3d', '#c4453b', '#6a8fc4', '#8c7bb8', '#8a9a92'];
function pieChart(items) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (!total) return '<p class="admin-empty">Sem dados neste período.</p>';
  const top = items.slice(0, 8), rest = items.slice(8).reduce((sum, i) => sum + i.value, 0);
  const slices = rest ? [...top, { label: 'Outros', value: rest }] : top;
  const R = 70, C = 2 * Math.PI * R; let offset = 0;
  const rings = slices.map((s, i) => { const len = s.value / total * C, el = `<circle r="${R}" cx="90" cy="90" fill="none" stroke="${PIE_COLORS[i % PIE_COLORS.length]}" stroke-width="34" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 90 90)" class="slice" data-tip="${escape(`<strong>${escape(s.label)}</strong><br>${num(s.value)} ${s.value === 1 ? 'sessão' : 'sessões'} · ${Math.round(s.value / total * 100)}%`)}"></circle>`; offset += len; return el; }).join('');
  return `<div class="admin-pie"><svg viewBox="0 0 180 180" role="img" aria-label="Sites de origem">${rings}<text x="90" y="86" text-anchor="middle" class="pie-total">${num(total)}</text><text x="90" y="104" text-anchor="middle" class="pie-sub">sessões</text></svg>
    <ul>${slices.map((s, i) => `<li data-tip="${escape(`<strong>${escape(s.label)}</strong><br>${num(s.value)} ${s.value === 1 ? 'sessão' : 'sessões'} · ${Math.round(s.value / total * 100)}%`)}"><i style="background:${PIE_COLORS[i % PIE_COLORS.length]}"></i><span>${escape(s.label)}</span><b>${num(s.value)}</b><small>${Math.round(s.value / total * 100)}%</small></li>`).join('')}</ul></div>`;
}

function dashboard() {
  const t = data.totals, f = data.funnel, rows = funnelRows(), top = rows[0][1] || 0;
  const points = periodDays();
  const answersByStep = {};
  for (const a of data.answers) (answersByStep[a.step] ||= []).push(a);
  root.innerHTML = `${topBar()}

    <section class="admin-kpis">
      ${(tab === 'quiz'
        ? [['Entraram na página', f.visits], ['Começaram o quiz', f.started, pct(f.started, f.visits)], ['Viram o resultado', f.result, pct(f.result, f.visits)], ['Viram a oferta', f.offer, pct(f.offer, f.visits)], ['Clicaram em comprar', f.checkout, pct(f.checkout, f.visits)]]
        : [['Visitantes', t.visitors], ['Sessões', t.sessions], ['Páginas vistas', t.pageviews]])
        .map(([label, value, extra]) => `<article><span>${label}</span><strong>${num(value)}</strong>${extra ? `<small>${extra} das visitas</small>` : ''}</article>`).join('')}
    </section>
${tab === 'quiz' ? `
    <section class="admin-card"><h2>Funil do quiz</h2><p class="admin-hint">Pessoas (sessões) que chegaram em cada etapa. A barra mostra o quanto sobrou das visitas; o número vermelho é quem desistiu na etapa.</p>
      <div class="admin-funnel">${rows.map(([label, value], i) => {
        const prev = i ? rows[i - 1][1] : value, lost = Math.max(0, (prev || 0) - (value || 0));
        return `<div class="admin-funnel-row"><span class="label">${escape(label)}</span><div class="bar"><i style="width:${top ? Math.max(2, (value || 0) / top * 100) : 0}%"></i></div><strong>${num(value)}</strong><small>${pct(value, top)}</small><em>${i && lost ? `−${num(lost)}` : ''}</em></div>`;
      }).join('')}</div></section>` : ''}
${tab === 'traffic' ? `
    <section class="admin-grid">
      <div class="admin-card"><h2>De onde vieram</h2>${table(['Origem', 'Sessões', 'Quiz', 'Oferta', 'Comprar'], data.sources.map(s => [escape(s.source), num(s.sessions), num(s.started), num(s.offer), num(s.checkout)]))}</div>
      <div class="admin-card"><h2>Aparelhos</h2>${table(['Aparelho', 'Sessões'], Object.entries(data.devices).map(([d, n]) => [{ mobile: 'Celular', tablet: 'Tablet', desktop: 'Computador' }[d] || d, num(n)]))}
        <h2 class="mt">App</h2>${table(['Entrada do app', 'Total'], [['Abriram a tela de entrada', num(data.app.login_views)], ['Entraram com e-mail', num(data.app.logins)], ['E-mail sem compra', num(data.app.denied)]])}</div>
    </section>` : ''}
${tab === 'traffic' ? `
    <section class="admin-card"><h2>Campanhas (utm e src)</h2>${table(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'src', 'Sessões', 'Oferta', 'Comprar'],
      data.campaigns.map(c => [escape(c.utm_source), escape(c.utm_medium), escape(c.utm_campaign), escape(c.utm_content), escape(c.src), num(c.sessions), num(c.offer), num(c.checkout)]))}</section>` : ''}
${tab === 'traffic' ? `
    <section class="admin-grid">
      <div class="admin-card"><h2>URLs de entrada</h2>${table(['URL', 'Sessões'], data.landings.map(l => [`<code>${escape(l.landing || '/')}</code>`, num(l.sessions)]))}</div>
      <div class="admin-card"><h2>Sites de origem</h2>${pieChart(data.referrers.map(r => ({ label: r.referrer, value: r.sessions })))}</div>
    </section>` : ''}
${tab === 'traffic' ? `
    <section class="admin-card"><h2>Por dia · últimos ${days === 1 ? '1 dia' : days + ' dias'}</h2>${lineChart(points)}</section>` : ''}
${tab === 'quiz' ? `
    <section class="admin-card"><h2>Respostas do quiz</h2>
      ${Object.keys(answersByStep).length ? Object.entries(answersByStep).map(([step, list]) => {
        const total = list.reduce((sum, a) => sum + a.count, 0);
        return `<div class="admin-answers"><h3>${step}. ${escape(questionTitle(questionByStep(Number(step))?.id))}</h3>${list.slice(0, 8).map(a => `<div><span>${escape(answerLabel(Number(step), a.answer))}</span><div class="bar"><i style="width:${a.count / total * 100}%"></i></div><strong>${num(a.count)}</strong></div>`).join('')}</div>`;
      }).join('') : '<p class="admin-empty">Sem respostas neste período.</p>'}</section>` : ''}
${tab === 'quiz' ? `
    <section class="admin-card"><h2>Últimas sessões, passo a passo</h2>
      ${data.sessions.length ? data.sessions.map(s => `<details class="admin-session"><summary><span>${new Date(s.started_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><b>${escape(s.source)}</b><span>${{ mobile: 'Celular', tablet: 'Tablet', desktop: 'Computador' }[s.device] || s.device}</span><span class="last">${escape(EVENT_LABELS[s.events?.at(-1)?.event] || '')}</span></summary>
        <p class="admin-hint">Entrou por <code>${escape(s.landing || '/')}</code>${s.utm_campaign ? ` · campanha ${escape(s.utm_campaign)}` : ''}</p>
        <ol>${(s.events || []).map(e => `<li><time>${new Date(e.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time> ${escape(EVENT_LABELS[e.event] || e.event)}${e.step ? ` ${e.step}` : ''}${e.event === 'answer' ? `: <b>${escape(answerLabel(e.step, e.detail))}</b>` : e.event === 'question_view' ? ` — ${escape(questionTitle(e.detail))}` : e.event === 'page_view' ? ` <code>${escape(e.path)}</code>` : ''}</li>`).join('')}</ol></details>`).join('') : '<p class="admin-empty">Sem sessões neste período.</p>'}</section>` : ''}`;
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
