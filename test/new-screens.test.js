const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');
const { build } = require('esbuild');
const root = path.join(__dirname, '..');
const today = '2026-10-11';
const load = file => import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(path.join(root, file), 'utf8')).toString('base64'));

async function boot(file, name, store) {
  const { document } = parseHTML('<html><body><main id="view"></main><div id="modal"></div></body></html>');
  document.defaultView.HTMLElement.prototype.focus = function () {};
  document.defaultView.HTMLElement.prototype.scrollIntoView = function () {};
  const context = vm.createContext({ document, console });
  const bundle = await build({ entryPoints: [path.join(root, file)], bundle: true, write: false, format: 'iife', globalName: 'ViewTest' });
  vm.runInContext(bundle.outputFiles[0].text, context);
  const view = context.ViewTest[name], writes = [], messages = [], routes = [];
  const state = { store, summary: { today }, ui: {} };
  const ctx = {
    state, toast: message => messages.push(message), navigate: route => routes.push(route), redraw: () => render(),
    endpoints: {
      journey: async body => { writes.push(body); store.journey[body.day] = { answer: body.answer, completedAt: `${today}T15:00:00` }; },
      situation: async (id, body) => { writes.push({ id, ...body }); store.situations[id] = body; },
      hydration: async body => { writes.push(body); store.hydration[body.date] = body.cups; }
    },
    mutate: async action => { await action(); render(); return true; },
    openModal: modal => { document.querySelector('#modal').innerHTML = modal.content; modal.onOpen({ close: () => { document.querySelector('#modal').innerHTML = ''; } }); }
  };
  function render() { document.querySelector('#view').innerHTML = view.html(ctx); view.bind(ctx); }
  render();
  const click = selector => document.querySelector(selector).dispatchEvent(new document.defaultView.Event('click'));
  const flush = () => new Promise(resolve => setImmediate(resolve));
  return { document, state, writes, messages, routes, click, flush };
}

test('jornada libera um dia por vez e só no dia seguinte', async () => {
  const { journeyStatus, JOURNEY } = await load('public/js/content/journey.js');
  assert.equal(JOURNEY.length, 30);
  assert.deepEqual(JOURNEY.map(item => item.day), Array.from({ length: 30 }, (_, i) => i + 1));
  assert.ok(JOURNEY.every(item => item.lesson.length && item.task && item.question));
  assert.deepEqual(journeyStatus({}, today), { completed: 0, current: 1, finished: false, waiting: false, percent: 0 });
  const doneToday = { 1: { completedAt: '2026-10-10T12:00:00' }, 2: { completedAt: `${today}T12:00:00` } };
  assert.equal(journeyStatus(doneToday, today).waiting, true);
  assert.equal(journeyStatus(doneToday, '2026-10-12').waiting, false);
  assert.equal(journeyStatus(doneToday, '2026-10-12').current, 3);
  assert.equal(journeyStatus({ 2: { completedAt: '2026-10-01T12:00:00' } }, today).completed, 0);
});

test('tela da jornada exige resposta, conclui o dia e bloqueia o seguinte', async () => {
  const store = { journey: {} };
  const app = await boot('public/js/views/routine.js', 'routineView', store);
  assert.equal(app.document.querySelectorAll('.journey-day.locked').length, 29);
  app.click('.journey-start');
  assert.ok(app.document.querySelector('#journey-lesson').textContent.includes('Por que você quer mudar?'));
  app.click('#journey-save');
  assert.equal(app.writes.length, 0);
  app.document.querySelector('#journey-answer').value = 'Quero acordar bem <b>';
  app.click('#journey-save'); await app.flush();
  assert.deepEqual(JSON.parse(JSON.stringify(app.writes)), [{ day: 1, answer: 'Quero acordar bem <b>' }]);
  assert.ok(app.document.querySelector('.journey-hero').textContent.includes('abre amanhã'));
  assert.equal(app.document.querySelector('[data-open-day="2"]').disabled, true);
  app.click('[data-open-day="1"]');
  assert.ok(app.document.querySelector('#journey-answer').innerHTML.includes('&lt;b&gt;'));
});

test('situações salvam três respostas e abrem o plano na hora', async () => {
  const store = { situations: {} };
  const app = await boot('public/js/views/support.js', 'supportView', store);
  assert.equal(app.document.querySelectorAll('.situation-card').length, 6);
  app.click('[data-edit="festa"]');
  app.click('[data-suggest="drink"]');
  app.document.querySelector('#situation-refuse').value = 'Hoje não';
  app.click('#situation-save'); await app.flush();
  assert.equal(app.writes.length, 0);
  assert.ok(app.messages.at(-1).includes('três respostas'));
  app.document.querySelector('#situation-leaveAt').value = 'Antes da meia-noite';
  app.click('#situation-save'); await app.flush();
  assert.equal(app.writes[0].id, 'festa');
  assert.equal(app.writes[0].refuse, 'Hoje não');
  app.click('[data-now="festa"]');
  assert.ok(app.document.querySelector('#modal').textContent.includes('Antes da meia-noite'));
  app.click('#now-sos');
  assert.deepEqual(app.routes, ['sos']);
});

test('corpo e saúde mostra sequência, próximo marco e marca água', async () => {
  const store = { checkins: { '2026-10-08': { status: 'used' }, '2026-10-09': { status: 'clean' }, '2026-10-10': { status: 'clean' }, '2026-10-11': { status: 'clean' } }, hydration: {} };
  const app = await boot('public/js/views/food.js', 'foodView', store);
  const hero = app.document.querySelector('.body-hero').textContent;
  assert.ok(hero.includes('3 dias sem beber'));
  assert.ok(hero.includes('4 dias'));
  assert.equal(app.document.querySelectorAll('.body-timeline li.done').length, 2);
  app.click('[data-cup="3"]'); await app.flush();
  assert.deepEqual(JSON.parse(JSON.stringify(app.writes)), [{ date: today, cups: 3 }]);
  assert.ok(!app.document.body.textContent.includes('Receita'));
});

test('análises do início: semana, dias da semana e SOS', async () => {
  const { weekSummary, weekdayPattern, sosStats } = await load('public/js/content/home-progress.js');
  const store = { money: { spendPerOuting: 100, outingsPerWeek: 2 }, checkins: {
    '2026-10-11': { status: 'clean' }, '2026-10-10': { status: 'used' }, '2026-10-09': { status: 'used' },
    '2026-10-08': { status: 'clean' }, '2026-10-03': { status: 'used' }, '2026-10-02': { status: 'used' }, '2026-09-01': { status: 'used' }
  } };
  const week = weekSummary(store, today);
  assert.equal(week.clean, 2); assert.equal(week.used, 2); assert.equal(week.unknown, 3);
  assert.ok(Math.abs(week.saved - 2 * 10400 / 365) < 1e-8);
  const pattern = weekdayPattern(store.checkins, today);
  assert.deepEqual(pattern.top, ['sexta', 'sábado']);
  assert.equal(pattern.total, 5);
  const sessions = [
    { createdAt: '2026-10-10T20:00:00', intensity: 5, action: 'concluido depois:2 acao:banho' },
    { createdAt: '2026-10-09T20:00:00', intensity: 4, action: 'concluido depois:3 acao:comer' },
    { createdAt: '2026-10-08T20:00:00', intensity: 4, action: 'cancelado etapa:2' },
    { createdAt: '2026-08-01T20:00:00', intensity: 5, action: 'concluido depois:1 acao:banho' }
  ];
  assert.deepEqual(sosStats(sessions, today), { total: 3, completed: 2, avgDrop: 2 });
  assert.deepEqual(sosStats([], today), { total: 0, completed: 0, avgDrop: 0 });
});
