import { $, $$, escapeHtml, todayISO } from '../utils.js';
const periodNames={manha:'Manhã',tarde:'Tarde',noite:'Noite'};
const initialTasks={agua:['Beber um copo de água ao acordar','manha','💧'],cafe:['Tomar um café da manhã simples','manha','🍌'],caminhada:['Caminhar por 15 minutos','tarde','🚶'],atividade:['Fazer algo que ocupe a mente','tarde','🎯'],jantar:['Jantar no horário','noite','🍲'],desacelerar:['Desacelerar antes de dormir','noite','🌙']};
export function isInitialTask(task){const initial=initialTasks[task.id];return Boolean(initial&&task.title===initial[0]&&task.period===initial[1]&&task.icon===initial[2]);}
export const situations=[
  {id:'work',title:'Depois do trabalho',situation:'Quando eu terminar o trabalho e pensar em beber',period:'tarde',actions:['Tomar banho assim que chegar em casa','Preparar uma atividade para o horário depois do trabalho','Combinar uma conversa no meu horário difícil']},
  {id:'social',title:'Festas e encontros',situation:'Quando eu estiver em um encontro com bebida',period:'noite',actions:['Preparar uma frase para recusar bebida','Combinar minha volta antes de sair','Escolher uma atividade sem bebida para o encontro']},
  {id:'alone',title:'Quando estou sozinho',situation:'Quando eu estiver sozinho e pensar em beber',period:'noite',actions:['Escolher uma atividade para esse horário','Combinar uma conversa com alguém de confiança','Preparar uma alternativa para o momento de vontade']},
  {id:'stress',title:'Quando fico estressado',situation:'Quando eu estiver estressado e pensar em beber',period:'tarde',actions:['Fazer uma pausa e abrir o SOS','Preparar uma conversa para esse momento','Ir para um lugar onde eu possa fazer uma pausa']}
];
function actionRow(task,completed,legacy=false){return `<div class="plan-action-row ${completed?'is-done':''} ${legacy?'legacy-action':''}"><button class="plan-action-check" data-task="${escapeHtml(task.id)}" aria-pressed="${Boolean(completed)}" aria-label="${completed?'Desmarcar':'Concluir'} ${escapeHtml(task.title)}">${completed?'✓':'○'}</button><span>${escapeHtml(task.title)}</span><button class="plan-action-edit" data-edit-action="${escapeHtml(task.id)}" aria-label="Editar ${escapeHtml(task.title)}">···</button></div>`;}
export const routineView={
  html({state}){
    const {store}=state,date=state.summary.today||todayISO();
    const plan=store.support?.plan,completed=store.routine.completions[date]||{};
    const active=store.routine.tasks.filter(task=>task.active!==false);
    const initial=active.filter(isInitialTask);
    const actions=active.filter(task=>!initial.includes(task));
    const paused=store.routine.tasks.filter(task=>task.active===false);
    const done=actions.filter(task=>completed[task.id]).length;
    return `<div class="routine-plan-screen"><div class="screen-title"><h2>Meu plano</h2><p>Prepare uma ação para os momentos em que fica mais difícil não beber.</p></div>
    ${plan?`<section class="day-plan-card"><div class="day-plan-heading"><span>MEU MOMENTO DIFÍCIL</span><button id="edit-plan">Editar plano</button></div><p class="day-plan-situation">${escapeHtml(plan.situation)}</p><div class="day-plan-first"><span>MINHA PRIMEIRA AÇÃO</span><h3>${escapeHtml(plan.firstAction)}</h3></div>${plan.exit||plan.help?`<details class="plan-alternatives"><summary>Se eu precisar de outra saída</summary>${plan.exit?`<p><strong>Minha alternativa:</strong> ${escapeHtml(plan.exit)}</p>`:''}${plan.help?`<p><strong>Meu pedido de apoio:</strong> ${escapeHtml(plan.help)}</p>`:''}</details>`:''}</section>`:`<section class="plan-onboarding"><span>COMECE PELO SEU MOMENTO</span><h3>Quando fica mais difícil não beber?</h3><p>Escolha uma situação para preparar seu primeiro passo.</p><div class="plan-situations">${situations.map(item=>`<button data-plan-situation="${item.id}">${item.title}<span aria-hidden="true">›</span></button>`).join('')}</div><button id="custom-plan" class="plan-custom-link">Quero escrever outra situação</button></section>`}
    <section class="card daily-plan-actions"><div class="plan-list-heading"><div><span>HOJE</span><h3>Minhas ações</h3></div>${actions.length?`<span class="plan-done-count">${done} de ${actions.length} feitas</span>`:''}</div>${actions.length?`<div class="plan-action-list">${actions.map(task=>actionRow(task,completed[task.id])).join('')}</div>`:`<p class="plan-empty">${plan?'Adicione uma ação do seu plano ao dia de hoje.':'Sua primeira ação aparecerá aqui quando você salvar o plano.'}</p>`}<button class="plan-add-action" id="add-plan-action">+ Escolher uma ação</button></section>
    ${initial.length?`<details class="plan-preserved"><summary>Hábitos que você já tinha (${initial.length})</summary><p>Você pode manter esses hábitos ou pausá-los ao montar seu plano.</p>${initial.map(task=>actionRow(task,completed[task.id],true)).join('')}</details>`:''}
    <section class="plan-sos-link"><div><strong>A vontade apareceu agora?</strong><span>Abra os exercícios que você já tem no SOS.</span></div><button id="plan-sos">Abrir SOS →</button></section>
    ${paused.length?`<details class="plan-preserved"><summary>Ações pausadas (${paused.length})</summary>${paused.map(task=>`<button class="plan-paused-row" data-edit-action="${escapeHtml(task.id)}"><span>${escapeHtml(task.title)}</span><span>Editar / reativar ›</span></button>`).join('')}</details>`:''}</div>`;
  },
  bind(ctx){
    const {state,endpoints,mutate,navigate}=ctx;
    $$('[data-plan-situation]').forEach(button=>button.addEventListener('click',()=>openPlan(ctx,situations.find(item=>item.id===button.dataset.planSituation))));
    $('#custom-plan')?.addEventListener('click',()=>openPlan(ctx,null));
    $('#edit-plan')?.addEventListener('click',()=>openPlan(ctx,null,state.store.support.plan));
    $('#add-plan-action').addEventListener('click',()=>openAction(ctx));
    $('#plan-sos').addEventListener('click',()=>navigate('sos'));
    $$('[data-edit-action]').forEach(button=>button.addEventListener('click',()=>openAction(ctx,state.store.routine.tasks.find(task=>task.id===button.dataset.editAction))));
    $$('[data-task]').forEach(button=>button.addEventListener('click',async()=>{const date=state.summary.today||todayISO(),id=button.dataset.task;await mutate(()=>endpoints.completeTask({taskId:id,date,completed:!Boolean(state.store.routine.completions[date]?.[id])}));}));
  }
};
function openPlan(ctx,scenario=null,existing=null){
  const {state,endpoints,mutate,openModal}=ctx;
  const initial=state.store.routine.tasks.filter(task=>task.active!==false&&isInitialTask(task));
  const isNew=!existing;
  const expectedUser=state.authUser?.id;
  const sameAccount=()=>Boolean(state.store)&&state.authUser?.id===expectedUser;
  openModal({title:isNew?'Prepare seu primeiro passo':'Meu plano',subtitle:'Escolha o momento e uma ação concreta para ele.',content:`<div class="field"><label for="plan-situation">Em qual situação?</label><input id="plan-situation" maxlength="500" required value="${escapeHtml(existing?.situation||scenario?.situation||'')}" placeholder="Ex.: quando termino o trabalho"></div>${scenario?`<div class="plan-action-suggestions"><span>IDEIAS PARA ESSE MOMENTO</span>${scenario.actions.map((action,index)=>`<button type="button" data-plan-preset="${index}">${escapeHtml(action)}</button>`).join('')}</div>`:''}<div class="field"><label for="plan-first">Qual será sua primeira ação?</label><input id="plan-first" maxlength="${isNew?100:500}" required value="${escapeHtml(existing?.firstAction||'')}" placeholder="Ex.: tomar banho assim que chegar"></div><details class="plan-optional"><summary>Preparar uma alternativa (opcional)</summary><div class="field"><label for="plan-exit">O que fazer se precisar mudar de plano?</label><textarea id="plan-exit" maxlength="500">${escapeHtml(existing?.exit||'')}</textarea></div><div class="field"><label for="plan-help">Que apoio você gostaria de pedir?</label><textarea id="plan-help" maxlength="500">${escapeHtml(existing?.help||'')}</textarea></div></details>${isNew&&initial.length?'<label class="plan-replace"><input id="replace-initial" type="checkbox" checked><span>Usar as ações do meu plano no lugar dos hábitos iniciais. O histórico será mantido.</span></label>':''}<button class="primary-btn" id="save-personal-plan">${isNew?'Salvar e usar meu plano':'Salvar plano'}</button>`,onOpen({close}){
    $$('[data-plan-preset]').forEach(button=>button.addEventListener('click',()=>{ $('#plan-first').value=scenario.actions[Number(button.dataset.planPreset)];$('#plan-first').focus();}));
    $('#save-personal-plan').addEventListener('click',async()=>{
      if(!sameAccount())return;
      if(!$('#plan-situation').reportValidity()||!$('#plan-first').reportValidity())return;
      const payload={situation:$('#plan-situation').value.trim(),firstAction:$('#plan-first').value.trim(),exit:$('#plan-exit').value.trim(),help:$('#plan-help').value.trim()};
      if(!payload.situation||!payload.firstAction)return;
      const replace=$('#replace-initial')?.checked||false;
      const saved=await mutate(()=>endpoints.saveSupportPlan(payload),'Plano salvo.');if(!saved)return;
      if(!sameAccount()){close();return;}
      if(isNew&&!state.store.routine.tasks.some(task=>task.active!==false&&task.title===payload.firstAction)){
        const created=await mutate(()=>endpoints.addTask({title:payload.firstAction,period:scenario?.period||'tarde',icon:'✓'}));
        if(!created){ctx.toast('Seu plano foi salvo. A ação não foi adicionada; tente em Escolher uma ação.');close();return;}
        if(!sameAccount()){close();return;}
      }
      if(replace&&initial.length){
        let results=[];
        const toPause=state.store.routine.tasks.filter(task=>task.active!==false&&isInitialTask(task));
        const updated=await mutate(async()=>{results=await Promise.allSettled(toPause.map(task=>endpoints.patchTask(task.id,{active:false})));});
        if(updated&&results.some(result=>result.status==='rejected'))ctx.toast('Seu plano está salvo, mas alguns hábitos não puderam ser pausados.');
      }
      close();
    });
  }});
}
function openAction(ctx,task=null){
  const {state,endpoints,mutate,openModal}=ctx;
  const plan=state.store.support?.plan;
  const expectedUser=state.authUser?.id;
  const sameAccount=()=>Boolean(state.store)&&state.authUser?.id===expectedUser;
  const hasInitial=!task&&state.store.routine.tasks.some(row=>row.active!==false&&isInitialTask(row));
  const suggestions=task?[]:[plan?.firstAction,'Preparar minha alternativa antes do horário difícil','Revisar uma coisa do meu plano ao fim do dia'].filter(value=>value&&value.length<=100);
  openModal({title:task?'Editar ação':'Uma ação para o meu dia',subtitle:'Uma ação pequena, ligada ao momento que você quer preparar.',content:`${suggestions.length?`<div class="plan-action-suggestions">${suggestions.map((title,index)=>`<button data-action-preset="${index}">${escapeHtml(title)}</button>`).join('')}</div>`:''}<div class="field"><label for="action-title">O que você vai fazer?</label><input id="action-title" maxlength="100" required value="${escapeHtml(task?.title||'')}" placeholder="Ex.: preparar minha volta antes do encontro"></div><details class="plan-optional"><summary>Período do dia</summary><div class="field"><label for="action-period">Quando organizar esta ação?</label><select id="action-period">${Object.entries(periodNames).map(([id,title])=>`<option value="${id}" ${id===(task?.period||'tarde')?'selected':''}>${title}</option>`).join('')}</select></div></details>${hasInitial?'<label class="plan-replace"><input id="action-replace-initial" type="checkbox" checked><span>Usar esta ação no lugar dos hábitos iniciais, mantendo o histórico.</span></label>':''}${task?`<button class="secondary-btn" id="pause-action">${task.active===false?'Reativar ação':'Pausar ação'}</button>`:''}<button class="primary-btn" id="save-action">${task?'Salvar ação':'Adicionar ao meu dia'}</button>`,onOpen({close}){
    $$('[data-action-preset]').forEach(button=>button.addEventListener('click',()=>{$('#action-title').value=suggestions[Number(button.dataset.actionPreset)];$('#action-title').focus();}));
    $('#save-action').addEventListener('click',async()=>{
      if(!sameAccount()||!$('#action-title').reportValidity())return;
      const body={title:$('#action-title').value.trim(),period:$('#action-period').value,icon:task?.icon||'✓'};
      if(!body.title)return;
      const replace=$('#action-replace-initial')?.checked||false;
      const duplicate=!task&&state.store.routine.tasks.some(row=>row.active!==false&&row.title===body.title);
      const saved=duplicate||await mutate(()=>task?endpoints.patchTask(task.id,body):endpoints.addTask(body),'Ação salva.');
      if(!saved)return;
      if(!sameAccount()){close();return;}
      if(replace){
        let results=[];
        const initial=state.store.routine.tasks.filter(row=>row.active!==false&&isInitialTask(row));
        const updated=await mutate(async()=>{results=await Promise.allSettled(initial.map(row=>endpoints.patchTask(row.id,{active:false})));});
        if(updated&&results.some(result=>result.status==='rejected'))ctx.toast('Ação salva, mas alguns hábitos não puderam ser pausados.');
      }
      close();
    });
    $('#pause-action')?.addEventListener('click',async()=>{if(!sameAccount())return;const saved=await mutate(()=>endpoints.patchTask(task.id,{active:task.active===false}),task.active===false?'Ação reativada.':'Ação pausada; seu histórico foi mantido.');if(saved)close();});
  }});
}
