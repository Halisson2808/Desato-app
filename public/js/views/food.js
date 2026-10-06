import { $, $$, escapeHtml, todayISO } from '../utils.js';

const meals = [
  { icon: '🥣', title: 'Café da manhã', text: 'Aveia com banana + ovos ou pão com queijo + fruta.', tags: ['simples','rápido'] },
  { icon: '🍛', title: 'Almoço', text: 'Arroz, feijão, proteína, salada e legumes.', tags: ['completo','econômico'] },
  { icon: '🍎', title: 'Lanche', text: 'Fruta, iogurte, castanhas ou sanduíche simples.', tags: ['prático'] },
  { icon: '🍲', title: 'Jantar', text: 'Sopa, arroz e feijão, omelete ou refeição leve.', tags: ['fácil'] }
];

const recipes = [
  { title: 'Omelete com tomate', time: '10 min', ingredients: ['2 ovos','1 tomate','sal','cheiro-verde'], steps: 'Bata os ovos, misture os ingredientes e prepare em frigideira antiaderente.' },
  { title: 'Aveia com banana', time: '5 min', ingredients: ['1 banana','3 colheres de aveia','leite ou água','canela'], steps: 'Misture tudo e aqueça por alguns minutos, ou consuma frio.' },
  { title: 'Arroz, feijão e frango', time: '25 min', ingredients: ['arroz','feijão','frango','legumes'], steps: 'Use alimentos já preparados e monte um prato simples com proteína, cereal, leguminosa e legumes.' },
  { title: 'Sanduíche de ovo', time: '10 min', ingredients: ['pão','ovo','tomate','folhas'], steps: 'Prepare o ovo, monte com tomate e folhas e sirva.' }
];

export const foodView = {
  html({ state }) {
    const cups = state.store.hydration[todayISO()] || 0;
    return `
      <div class="screen-title">
        <h2>Alimentação</h2>
        <p>Uma área simples para organizar refeições, água e compras. Sem transformar o app em dieta.</p>
      </div>

      <div class="segmented" id="food-tabs">
        <button data-tab="hoje" class="${state.ui.foodTab === 'hoje' ? 'active' : ''}">Hoje</button>
        <button data-tab="receitas" class="${state.ui.foodTab === 'receitas' ? 'active' : ''}">Receitas</button>
        <button data-tab="lista" class="${state.ui.foodTab === 'lista' ? 'active' : ''}">Lista</button>
      </div>

      <section data-food-panel="hoje" class="${state.ui.foodTab === 'hoje' ? '' : 'hidden'}">
        <div class="meal-list">
          ${meals.map(m => `
            <div class="meal-card">
              <div class="meal-visual">${m.icon}</div>
              <div><strong>${m.title}</strong><p>${m.text}</p><div class="recipe-tags">${m.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div></div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-head"><div><h3>Água hoje</h3><p>Use como lembrete simples, sem meta obrigatória.</p></div><span class="small muted">${cups} copos</span></div>
          <div class="card">
            <div class="hydration-row" id="hydration-row">
              ${Array.from({length:8}, (_,i) => `<button class="cup ${i < cups ? 'filled' : ''}" data-cup="${i+1}" aria-label="${i+1} copos">💧</button>`).join('')}
            </div>
            <button class="secondary-btn" id="clear-water" style="margin-top:12px">Zerar hoje</button>
          </div>
        </div>

        <div class="section">
          <div class="notice success"><strong>Objetivo desta aba:</strong> facilitar escolhas e organização. Ela não substitui orientação individual de nutricionista ou profissional de saúde.</div>
        </div>
      </section>

      <section data-food-panel="receitas" class="${state.ui.foodTab === 'receitas' ? '' : 'hidden'}">
        <div class="meal-list">
          ${recipes.map((r, i) => `
            <button class="meal-card" data-recipe="${i}" style="text-align:left;width:100%">
              <div class="meal-visual">🍽️</div>
              <div><strong>${r.title}</strong><p>${r.time} · ingredientes simples</p><div class="recipe-tags"><span class="tag">abrir receita</span></div></div>
            </button>
          `).join('')}
        </div>
      </section>

      <section data-food-panel="lista" class="${state.ui.foodTab === 'lista' ? '' : 'hidden'}">
        <div class="card">
          <div class="section-head" style="margin-top:0"><div><h3>Lista de compras</h3><p>Marque conforme comprar.</p></div></div>
          <div class="grocery-list">
            ${state.store.groceries.map(item => `
              <div class="grocery-item ${item.checked ? 'checked' : ''}">
                <button class="check ${item.checked ? 'checked' : ''}" data-grocery-check="${item.id}" aria-label="Marcar ${escapeHtml(item.text)} como comprado" aria-pressed="${item.checked}">${item.checked ? '✓' : ''}</button>
                <div class="grocery-text">${escapeHtml(item.text)}</div>
                <button class="grocery-remove" data-grocery-delete="${item.id}" aria-label="Excluir item">×</button>
              </div>
            `).join('') || '<div class="empty">Sua lista está vazia.</div>'}
          </div>
          <div class="input-grid" style="grid-template-columns:1fr auto;margin-top:12px">
            <input id="grocery-new" placeholder="Adicionar item" style="border:1px solid #d5e1dc;background:#fbfdfc;border-radius:13px;padding:12px 13px;min-width:0">
            <button class="primary-btn" id="grocery-add" style="width:auto;min-width:92px">Adicionar</button>
          </div>
        </div>
      </section>
    `;
  },

  bind(ctx) {
    const { state, endpoints, mutate, openModal } = ctx;

    $$('#food-tabs button').forEach(btn => btn.addEventListener('click', () => {
      state.ui.foodTab = btn.dataset.tab;
      $$('#food-tabs button').forEach(x => x.classList.toggle('active', x === btn));
      $$('[data-food-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.foodPanel !== btn.dataset.tab));
    }));

    $$('#hydration-row [data-cup]').forEach(btn => btn.addEventListener('click', async () => {
      await mutate(() => endpoints.hydration({ date: todayISO(), cups: Number(btn.dataset.cup) }));
    }));
    $('#clear-water')?.addEventListener('click', async () => mutate(() => endpoints.hydration({ date: todayISO(), cups: 0 })));

    $$('[data-recipe]').forEach(btn => btn.addEventListener('click', () => {
      const r = recipes[Number(btn.dataset.recipe)];
      openModal({
        title: r.title,
        subtitle: `${r.time} · receita simples`,
        content: `
          <div class="field"><label>Ingredientes</label><div class="reason-list">${r.ingredients.map(i => `<div class="reason">• ${escapeHtml(i)}</div>`).join('')}</div></div>
          <div class="field"><label>Como fazer</label><div class="reason">${escapeHtml(r.steps)}</div></div>
        `
      });
    }));

    $$('[data-grocery-check]').forEach(btn => btn.addEventListener('click', async () => {
      const item = state.store.groceries.find(x => x.id === btn.dataset.groceryCheck);
      if (item) await mutate(() => endpoints.patchGrocery(item.id, { checked: !item.checked }));
    }));

    $$('[data-grocery-delete]').forEach(btn => btn.addEventListener('click', async () => {
      await mutate(() => endpoints.deleteGrocery(btn.dataset.groceryDelete));
    }));

    const add = async () => {
      const input = $('#grocery-new');
      const text = input?.value.trim();
      if (!text) return;
      await mutate(() => endpoints.addGrocery(text), 'Item adicionado.');
    };
    $('#grocery-add')?.addEventListener('click', add);
    $('#grocery-new')?.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  }
};
