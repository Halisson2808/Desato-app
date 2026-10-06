import { $, $$, escapeHtml } from '../utils.js';
import { supportGuides } from '../content/support-guides.js';

function symbol(name) {
  const paths = {
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 11h16m-12 5 2 2 5-5"/>',
    home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',
    pause: '<circle cx="12" cy="12" r="9"/><path d="M9 8v8M15 8v8"/>',
    return: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    conversation: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0ZM7 10h10M7 14h6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
    support: '<path d="M12 21S3 16 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12ZM9 12h6M12 9v6"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.support}</svg>`;
}

function supportData(state) {
  return state.store?.support || { plan: null, favoriteGuideIds: [] };
}

function favoriteButton(guide, support, available) {
  const saved = support.favoriteGuideIds.includes(guide.id);
  return `<button class="support-bookmark ${saved ? 'is-saved' : ''}" data-favorite-guide="${guide.id}"
    aria-pressed="${saved}" aria-label="${saved ? 'Remover dos' : 'Adicionar aos'} favoritos: ${escapeHtml(guide.title)}"
    ${available ? '' : 'disabled'}><svg viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg><span>${saved ? 'Salvo' : 'Salvar'}</span></button>`;
}

function guideReader(guide, state) {
  const support = supportData(state);
  return `
    <section class="support-reader" id="support-reader" tabindex="-1">
      <div class="support-reader-top">
        <button class="support-back" id="support-back">← Voltar para Apoio</button>
        ${favoriteButton(guide, support, Boolean(state.store))}
      </div>
      <div class="support-reader-heading">
        <span class="support-eyebrow">APOIO · ${guide.readTime} DE LEITURA</span>
        <h2>${escapeHtml(guide.title)}</h2>
        <p>${escapeHtml(guide.intro)}</p>
      </div>
      <ol class="support-steps">
        ${guide.steps.map(step => `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></li>`).join('')}
      </ol>
      <div class="support-reflection"><span>Para levar com você</span><p>${escapeHtml(guide.prompt)}</p></div>
      <div class="support-reader-actions">
        <button class="primary-btn" data-plan-from="${guide.id}" ${state.store ? '' : 'disabled'}>Usar no meu plano</button>
        ${guide.primaryRoute ? `<button class="secondary-btn" data-support-route="${guide.primaryRoute}">${escapeHtml(guide.primaryLabel)}</button>` : ''}
      </div>
      ${!state.store ? '<p class="support-caption">Os guias estão disponíveis. Para salvar seu plano e favoritos, reconecte ao servidor.</p>' : ''}
    </section>
  `;
}

function planCard(plan, available) {
  return `
    <section class="support-plan">
      <div class="support-plan-heading"><div><span class="support-eyebrow">SEU PRÓXIMO PASSO</span><h3>Meu plano para momentos difíceis</h3></div><span class="support-plan-symbol" aria-hidden="true">${symbol('compass')}</span></div>
      ${plan ? `
        <div class="support-plan-summary"><span>Se acontecer</span><p>${escapeHtml(plan.situation)}</p><span>Minha primeira ação será</span><p>${escapeHtml(plan.firstAction)}</p></div>
        ${plan.exit || plan.help ? `<div class="support-plan-details">${plan.exit ? `<div><strong>Minha saída</strong><p>${escapeHtml(plan.exit)}</p></div>` : ''}${plan.help ? `<div><strong>Como pedir apoio</strong><p>${escapeHtml(plan.help)}</p></div>` : ''}</div>` : ''}
      ` : `<p class="support-plan-intro">Escolha uma situação e prepare o que fazer. Um plano simples, escrito do seu jeito, para consultar quando precisar.</p>`}
      <div class="support-plan-actions"><button class="primary-btn" data-edit-support-plan ${available ? '' : 'disabled'}>${plan ? 'Editar meu plano' : 'Preparar meu plano'}</button><button class="secondary-btn" data-support-route="sos">Abrir SOS</button></div>
      ${!available ? '<p class="support-caption">Não foi possível carregar seus dados. O plano ficará disponível ao reconectar.</p>' : ''}
    </section>
  `;
}

export const supportView = {
  html({ state }) {
    const selected = supportGuides.find(guide => guide.id === state.ui.supportGuideId);
    if (selected) return guideReader(selected, state);
    const support = supportData(state);
    const favoritesOnly = state.ui.supportFavoritesOnly;
    const library = favoritesOnly
      ? supportGuides.filter(guide => support.favoriteGuideIds.includes(guide.id))
      : supportGuides.filter(guide => guide.category === 'guide');
    return `
      <div class="screen-title"><h2>Apoio para o seu dia</h2><p>Encontre uma orientação para o que você está vivendo e prepare seu próximo passo.</p></div>
      ${!state.store ? '<div class="notice warning support-connection">Os guias continuam disponíveis. Seus dados não carregaram; reconecte para salvar seu plano e favoritos. <button class="section-link" id="support-retry">Tentar novamente</button></div>' : ''}
      <section class="support-situations">
        <div class="section-head"><div><h3>O que está mais difícil hoje?</h3><p>Escolha uma situação. Comece por uma ação possível.</p></div></div>
        <div class="support-situation-grid">
          ${supportGuides.filter(guide => guide.category === 'situation').map(guide => `<button class="support-situation" data-open-guide="${guide.id}"><span class="support-situation-icon">${symbol(guide.icon)}</span><span class="support-situation-copy"><strong>${escapeHtml(guide.title)}</strong><span>${escapeHtml(guide.description)}</span></span><span class="support-arrow" aria-hidden="true">↗</span></button>`).join('')}
        </div>
      </section>
      ${planCard(support.plan, Boolean(state.store))}
      <section class="support-library">
        <div class="section-head"><div><h3>Guias para guardar por perto</h3><p>Orientações curtas para consultar no seu ritmo.</p></div></div>
        <div class="support-filters" role="group" aria-label="Filtrar guias"><button data-support-filter="all" aria-pressed="${!favoritesOnly}" class="${!favoritesOnly ? 'active' : ''}">Guias curtos</button><button data-support-filter="saved" aria-pressed="${favoritesOnly}" class="${favoritesOnly ? 'active' : ''}">Meus favoritos <span>${support.favoriteGuideIds.length}</span></button></div>
        <div class="support-guide-grid">
          ${library.map(guide => `<article class="support-guide-card"><div class="support-guide-meta"><span>${guide.readTime} de leitura</span>${favoriteButton(guide, support, Boolean(state.store))}</div><button class="support-guide-open" data-open-guide="${guide.id}"><h4>${escapeHtml(guide.title)}</h4><p>${escapeHtml(guide.description)}</p><span>Ler orientação <span aria-hidden="true">→</span></span></button></article>`).join('') || '<div class="support-empty"><strong>Seus guias favoritos ficam aqui.</strong><p>Abra uma orientação e toque em Salvar para encontrá-la novamente.</p></div>'}
        </div>
      </section>
      <p class="support-footnote">O Desato organiza apoio para o dia a dia. Para conversar sobre tratamento e sua saúde, procure acompanhamento profissional.</p>
    `;
  },
  bind(ctx) {
    const { state, navigate, endpoints, mutate, refresh } = ctx;
    $$('[data-open-guide]').forEach(button => button.addEventListener('click', () => {
      state.ui.supportGuideId = button.dataset.openGuide;
      draw(ctx);
      $('#support-reader')?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
    $('#support-back')?.addEventListener('click', () => {
      const id = state.ui.supportGuideId;
      state.ui.supportGuideId = null;
      draw(ctx);
      $(`[data-open-guide="${id}"]`)?.focus();
    });
    $$('[data-favorite-guide]').forEach(button => button.addEventListener('click', async () => {
      if (!state.store) return;
      const id = button.dataset.favoriteGuide;
      const saved = supportData(state).favoriteGuideIds.includes(id);
      const ok = await mutate(() => endpoints.favoriteGuide(id, !saved), saved ? 'Guia removido dos favoritos.' : 'Guia salvo nos favoritos.');
      if (ok && state.route === 'apoio') $(`[data-favorite-guide="${id}"]`)?.focus();
    }));
    $$('[data-support-filter]').forEach(button => button.addEventListener('click', () => {
      state.ui.supportFavoritesOnly = button.dataset.supportFilter === 'saved';
      draw(ctx);
      $(`[data-support-filter="${button.dataset.supportFilter}"]`)?.focus();
    }));
    $$('[data-edit-support-plan]').forEach(button => button.addEventListener('click', () => openPlan(ctx)));
    $$('[data-plan-from]').forEach(button => button.addEventListener('click', () => openPlan(ctx, supportGuides.find(guide => guide.id === button.dataset.planFrom))));
    $$('[data-support-route]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.supportRoute)));
    $('#support-retry')?.addEventListener('click', () => refresh(false));
  }
};

function draw(ctx) {
  $('#view').innerHTML = supportView.html(ctx);
  supportView.bind(ctx);
}

function openPlan(ctx, guide) {
  if (!ctx.state.store) { ctx.toast('Reconecte ao servidor para salvar seu plano.'); return; }
  const plan = guide?.suggestion || supportData(ctx.state).plan || {};
  const fields = [
    ['situation', 'Quando fica difícil?', 'Ex.: quando me oferecem bebida no encontro', true],
    ['firstAction', 'Qual será sua primeira ação?', 'Ex.: dizer minha decisão e pedir outra opção', true],
    ['exit', 'Como você pode sair dessa situação? (opcional)', 'Uma saída ou mudança de ambiente possível', false],
    ['help', 'Como você quer pedir apoio? (opcional)', 'Uma frase ou um pedido que você pode fazer', false]
  ];
  ctx.openModal({
    title: guide ? 'Adaptar ao meu plano' : 'Meu plano para momentos difíceis',
    subtitle: guide ? 'Revise a sugestão. Só ao salvar ela substituirá seu plano atual.' : 'Escreva do seu jeito. A situação e a primeira ação são os únicos campos obrigatórios.',
    content: `<form id="support-plan-form">${fields.map(([key, label, placeholder, required]) => `<div class="field"><label for="support-${key}">${label}</label><textarea id="support-${key}" name="${key}" maxlength="500" rows="2" placeholder="${placeholder}" ${required ? 'required' : ''}>${escapeHtml(plan[key] || '')}</textarea></div>`).join('')}<button type="submit" class="primary-btn">Salvar meu plano</button></form>`,
    onOpen({ close, root }) {
      const form = root.querySelector('#support-plan-form');
      form.querySelectorAll('textarea').forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
      form.addEventListener('submit', async event => {
        event.preventDefault();
        for (const key of ['situation', 'firstAction']) {
          const input = form.elements.namedItem(key);
          input.setCustomValidity(input.value.trim() ? '' : 'Preencha este campo.');
        }
        if (!form.reportValidity()) return;
        const body = Object.fromEntries(fields.map(([key]) => [key, form.elements.namedItem(key).value.trim()]));
        const ok = await ctx.mutate(() => ctx.endpoints.saveSupportPlan(body), 'Seu plano foi salvo.');
        if (ok) close();
      });
    }
  });
}
