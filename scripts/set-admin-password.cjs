// Define a senha do administrador do Desato. Rode no SEU terminal:  npm run admin:password
// A senha é digitada aqui (sem aparecer na tela) e vai direto para o Supabase; não fica salva em arquivo.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const PROJECT = 'szvxlhubtvhazlzohpse';
const URL_BASE = `https://${PROJECT}.supabase.co`;
const ADMIN_EMAIL = 'halissonsantos13@gmail.com';

function token() {
  const file = path.join(root, '.env.supabase');
  const match = fs.existsSync(file) && /SUPABASE_ACCESS_TOKEN=(.+)/.exec(fs.readFileSync(file, 'utf8'));
  if (!match) { console.error('Falta SUPABASE_ACCESS_TOKEN em .env.supabase.'); process.exit(1); }
  return match[1].trim().replace(/^["']|["']$/g, '');
}

function ask(question) {
  return new Promise(resolve => {
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = '';
    stdin.setRawMode?.(true); stdin.resume(); stdin.setEncoding('utf8');
    const onData = char => {
      if (char === '\r' || char === '\n') { stdin.setRawMode?.(false); stdin.pause(); stdin.off('data', onData); process.stdout.write('\n'); resolve(value); }
      else if (char === '\u0003') { process.stdout.write('\n'); process.exit(1); }
      else if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
      else value += char;
    };
    stdin.on('data', onData);
  });
}

(async () => {
  const first = await ask('Nova senha do painel (mínimo 10 caracteres): ');
  if (first.length < 10) { console.error('Senha curta demais. Use pelo menos 10 caracteres.'); process.exit(1); }
  if (await ask('Repita a senha: ') !== first) { console.error('As senhas não conferem.'); process.exit(1); }

  // Chave de serviço lida na hora pela API do Supabase (com o token do projeto); nunca é exibida.
  const keys = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json());
  const service = Array.isArray(keys) && (keys.find(k => k.type === 'secret')?.api_key || keys.find(k => k.name === 'service_role')?.api_key);
  if (!service) { console.error('Não consegui obter a chave de serviço do projeto.'); process.exit(1); }
  const headers = { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' };

  const list = await fetch(`${URL_BASE}/auth/v1/admin/users?per_page=1000`, { headers }).then(r => r.json());
  const user = list.users?.find(u => u.email?.toLowerCase() === ADMIN_EMAIL);
  if (!user) { console.error(`Conta ${ADMIN_EMAIL} não encontrada.`); process.exit(1); }

  const response = await fetch(`${URL_BASE}/auth/v1/admin/users/${user.id}`, { method: 'PUT', headers, body: JSON.stringify({ password: first }) });
  if (!response.ok) { console.error('O Supabase recusou a senha (talvez fraca demais). Tente outra.'); process.exit(1); }
  console.log('Senha definida. Entre em /admin com o seu e-mail e essa senha.');
})().catch(() => { console.error('Falhou. Confira a internet e o token em .env.supabase.'); process.exit(1); });
