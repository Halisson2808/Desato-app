// Rastreamento anônimo: id aleatório do navegador, sessão de 30 min e de onde a pessoa veio.
// Sem nome, e-mail ou IP. Falhas são ignoradas para nunca atrapalhar a pessoa.
const SESSION_MINUTES = 30;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// Acessar localStorage pode lançar erro em modo privado: por isso fica dentro de try.
const local = (() => { try { return window.localStorage; } catch { return null; } })();
const read = (area, key) => { try { return area?.getItem(key) || ''; } catch { return ''; } };
const write = (area, key, value) => { try { area?.setItem(key, value); } catch { /* sem armazenamento */ } };
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

function visitorId() {
  let id = read(local, 'desato-visitor');
  if (!id) { id = newId(); write(local, 'desato-visitor', id); }
  return id;
}

// Uma sessão nova começa depois de 30 min parado; guarda a origem e a página de entrada dela.
function currentSession() {
  const now = Date.now();
  let session = null;
  try { session = JSON.parse(read(local, 'desato-session') || 'null'); } catch { session = null; }
  const params = new URLSearchParams(location.search);
  // Campanha diferente na URL também abre sessão nova (recarregar a mesma URL não).
  const newCampaign = session && [...UTM_KEYS, 'src'].some(key => params.get(key) && params.get(key) !== session[key]);
  if (!session || now - session.last > SESSION_MINUTES * 60_000 || newCampaign) {
    let referrer = '';
    try { const ref = document.referrer ? new URL(document.referrer) : null; if (ref && ref.host !== location.host) referrer = ref.host.replace(/^www\./, ''); } catch { referrer = ''; }
    session = { id: newId(), referrer, landing: (location.pathname + location.search).slice(0, 300), src: params.get('src') || '' };
    for (const key of UTM_KEYS) session[key] = params.get(key) || '';
  }
  session.last = now;
  write(local, 'desato-session', JSON.stringify(session));
  return session;
}

function device() {
  const width = Math.min(window.screen?.width || window.innerWidth, window.innerWidth || 9999);
  return /iPad|Tablet/i.test(navigator.userAgent) || (width >= 600 && width < 1024 && 'ontouchstart' in window) ? 'tablet'
    : /Mobi|Android|iPhone/i.test(navigator.userAgent) || width < 600 ? 'mobile' : 'desktop';
}

export function track(event, extra = {}) {
  try {
    const session = currentSession();
    const payload = JSON.stringify({
      visitor: visitorId(), session: session.id, event, path: location.pathname,
      step: Number.isInteger(extra.step) ? extra.step : undefined, detail: extra.detail ? String(extra.detail).slice(0, 120) : '',
      referrer: session.referrer, src: session.src, landing: session.landing, device: device(),
      ...Object.fromEntries(UTM_KEYS.map(key => [key, session[key]]))
    });
    const blob = new Blob([payload], { type: 'application/json' });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/track', blob))) {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch { /* rastreamento nunca quebra a página */ }
}

// Leva a origem da sessão para o link de pagamento (a Cakto mostra utm nos relatórios).
export function withCampaign(url) {
  try {
    const session = currentSession(), target = new URL(url);
    for (const key of [...UTM_KEYS, 'src']) if (session[key] && !target.searchParams.has(key)) target.searchParams.set(key, session[key]);
    return target.toString();
  } catch { return url; }
}
