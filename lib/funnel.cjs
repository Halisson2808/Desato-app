const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
function failure(status,message) { const error = new Error(message); error.status = status; return error; }
function createFunnelStore({mode,url,key,dataDir,fetchImpl=fetch}) {
  const limits = new Map();
  function throttle(address) {
    const now = Date.now();
    if (limits.size > 10000) for (const [id,item] of limits) if (now-item.start>3600000) limits.delete(id);
    const entry = limits.get(address);
    if (!entry || now-entry.start>3600000) {if(!entry && limits.size>=10000)throw failure(503,'Tente novamente em alguns instantes.');limits.set(address,{start:now,count:1});return;}
    if (++entry.count>1000) throw failure(429,'Muitas respostas neste momento. Tente novamente mais tarde.');
  }
  async function record(body,address,model) {
    throttle(address);
    if (!body || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.id) || typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token) || typeof body.completed !== 'boolean' || !Number.isInteger(body.revision) || body.revision<1 || body.revision>10000) throw failure(400,'Resposta inválida.');
    let answers;
    try {answers=model.validateFunnel(body.quizId,body.answers,body.completed);} catch(error) {throw failure(400,error.message);}
    const version = body.quizId+'-v2';
    if (mode === 'supabase') {
      let response;
      try {response=await fetchImpl(url+'/rest/v1/rpc/desato_record_funnel',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({p_id:body.id,p_token:body.token,p_version:version,p_answers:answers,p_completed:body.completed,p_revision:body.revision}),signal:AbortSignal.timeout(8000)});} catch {throw failure(503,'Não foi possível registrar suas respostas. Tente novamente.');}
      if (!response.ok) throw failure(503,'Não foi possível registrar suas respostas. Tente novamente.');
      if (await response.json() !== true) throw failure(409,'Não foi possível atualizar esta resposta.');
      return;
    }
    // Somente o modo JSON explicitamente configurado para desenvolvimento local.
    fs.mkdirSync(dataDir,{recursive:true});
    const filename=path.join(dataDir,'funnel-responses.json');
    const rows=fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8')):{};
    const hash=createHash('sha256').update(body.token).digest('hex');
    const previous=rows[body.id];
    if (previous && (previous.write_token_hash!==hash || previous.quiz_version!==version)) throw failure(409,'Não foi possível atualizar esta resposta.');
    if (previous && previous.revision>=body.revision) return;
    rows[body.id]={id:body.id,write_token_hash:hash,quiz_version:version,answers,completed:body.completed,revision:body.revision,created_at:previous?.created_at||new Date().toISOString(),updated_at:new Date().toISOString()};
    fs.writeFileSync(filename+'.tmp',JSON.stringify(rows,null,2),{mode:0o600});fs.renameSync(filename+'.tmp',filename);
  }
  return {record};
}
module.exports={createFunnelStore};
