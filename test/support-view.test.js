const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let supportView, supportGuides;
const root = path.join(__dirname, '..');
const moduleURL = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
before(async () => {
  const utilities = moduleURL(fs.readFileSync(path.join(root, 'public/js/utils.js'), 'utf8'));
  const content = moduleURL(fs.readFileSync(path.join(root, 'public/js/content/support-guides.js'), 'utf8'));
  const source = fs.readFileSync(path.join(root, 'public/js/views/support.js'), 'utf8').replace("'../utils.js'", JSON.stringify(utilities)).replace("'../content/support-guides.js'", JSON.stringify(content));
  ({ supportView } = await import(moduleURL(source)));
  ({ supportGuides } = await import(content));
});
const state = () => ({ route: 'apoio', ui: { supportGuideId: null, supportFavoritesOnly: false }, store: { support: { plan: null, favoriteGuideIds: [] } } });
test('tela oferece seis situações, plano e biblioteca de três guias', () => {
  const html = supportView.html({ state: state() });
  assert.equal((html.match(/class="support-situation"/g) || []).length, 6);
  assert.equal((html.match(/class="support-guide-card"/g) || []).length, 3);
  assert.ok(html.includes('Preparar meu plano'));
  assert.equal(new Set(supportGuides.map(guide => guide.id)).size, 9);
});
test('leitor abre todos os guias, com três passos e próxima ação', () => {
  for (const guide of supportGuides) {
    const current = state(); current.ui.supportGuideId = guide.id;
    const html = supportView.html({ state: current });
    assert.ok(html.includes(guide.title));
    assert.equal((html.match(/<li>/g) || []).length, 3);
    assert.ok(html.includes('Usar no meu plano'));
    assert.ok(html.includes('support-back'));
  }
});
test('favoritos incluem situações e guias e oferecem estado vazio', () => {
  const current = state(); current.ui.supportFavoritesOnly = true;
  assert.ok(supportView.html({ state: current }).includes('Seus guias favoritos ficam aqui.'));
  current.store.support.favoriteGuideIds = ['pressao-amigos'];
  const html = supportView.html({ state: current });
  assert.equal((html.match(/class="support-guide-card"/g) || []).length, 1);
  assert.ok(html.includes('aria-pressed="true"'));
});
test('plano pessoal escapa HTML em todos os campos', () => {
  const current = state();
  current.store.support.plan = Object.fromEntries(['situation', 'firstAction', 'exit', 'help'].map(key => [key, '<script>alert(1)</script>']));
  const html = supportView.html({ state: current });
  assert.equal(html.includes('<script>'), false);
  assert.equal((html.match(/&lt;script&gt;/g) || []).length, 4);
});
test('sem dados: guias disponíveis, sem inventar plano ou permitir salvar', () => {
  const current = state(); current.store = null;
  assert.ok(supportView.html({ state: current }).includes('support-retry'));
  current.ui.supportGuideId = 'retomar';
  const html = supportView.html({ state: current });
  assert.ok(html.includes('data-plan-from="retomar" disabled'));
  assert.ok(html.includes('data-support-route="inicio"'));
  assert.ok(html.includes('favorite-guide="retomar"'));
});
