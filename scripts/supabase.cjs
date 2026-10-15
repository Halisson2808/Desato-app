// Roda a CLI do Supabase sempre com a conta do Desato.
// O token fica em .env.supabase (ignorado pelo Git), então logins de outros projetos não interferem.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const envFile = path.join(root, '.env.supabase');
const env = { ...process.env };
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && !line.trim().startsWith('#')) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error('Falta SUPABASE_ACCESS_TOKEN em .env.supabase. Veja .env.supabase.example.');
  process.exit(1);
}
// Chama o JS da CLI pelo Node: evita o cmd do Windows, que quebra com espaço no caminho.
const cli = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js');
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { cwd: root, env, stdio: 'inherit' });
process.exit(result.status ?? 1);
