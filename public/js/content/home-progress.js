export function validMonth(month,today) {
  return typeof month==='string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && month<=today.slice(0,7) ? month : today.slice(0,7);
}
export function monthCalendar(month,today,checkins={}) {
  const [year,number]=month.split('-').map(Number);
  const first=new Date(year,number-1,1,12),last=new Date(year,number,0,12);
  const cells=Array.from({length:first.getDay()},()=>null);
  for(let day=1;day<=last.getDate();day++) {
    const date=`${month}-${String(day).padStart(2,'0')}`;
    cells.push({date,day,future:date>today,status:checkins[date]?.status||null,note:checkins[date]?.note||''});
  }
  while(cells.length%7)cells.push(null);
  return cells;
}
export function homeProgress(store,month,today) {
  const eligible=monthCalendar(month,today,store.checkins).filter(cell=>cell&&!cell.future);
  const clean=eligible.filter(cell=>cell.status==='clean').length;
  const used=eligible.filter(cell=>cell.status==='used').length;
  const unknown=eligible.length-clean-used;
  const spend=Number(store.money?.spendPerOuting)||0,frequency=Number(store.money?.outingsPerWeek)||0;
  const weekly=spend*frequency,annual=weekly*52,daily=annual/365;
  const cleanTotal=Object.entries(store.checkins).filter(([date,item])=>date<=today&&item.status==='clean').length;
  return {clean,used,unknown,recorded:clean+used,eligible:eligible.length,percent:clean+used?Math.round(clean/(clean+used)*100):0,
    configured:spend>0&&frequency>0,weekly,monthly:annual/12,annual,daily,savedMonth:clean*daily,savedTotal:cleanTotal*daily,
    savedToday:store.checkins[today]?.status==='clean'?daily:0};
}
export function adjacentMonth(month,offset) {
  const [year,number]=month.split('-').map(Number);const date=new Date(year,number-1+offset,1,12);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}
const WEEKDAYS=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const shiftISO=(iso,delta)=>{const [y,m,d]=iso.split('-').map(Number);const date=new Date(y,m-1,d+delta,12);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;};
// Últimos 7 dias, incluindo hoje.
export function weekSummary(store,today) {
  const {daily}=homeProgress(store,today.slice(0,7),today);
  let clean=0,used=0;
  for(let i=0;i<7;i++){const status=store.checkins[shiftISO(today,-i)]?.status;if(status==='clean')clean++;else if(status==='used')used++;}
  return {clean,used,unknown:7-clean-used,saved:clean*daily,configured:daily>0};
}
// Dias da semana com consumo nos últimos 90 dias.
export function weekdayPattern(checkins,today,days=90) {
  const counts=[0,0,0,0,0,0,0];
  for(let i=0;i<days;i++){const iso=shiftISO(today,-i);if(checkins[iso]?.status==='used'){const [y,m,d]=iso.split('-').map(Number);counts[new Date(y,m-1,d,12).getDay()]++;}}
  const total=counts.reduce((a,b)=>a+b,0),max=Math.max(...counts);
  const top=total>=2?counts.map((count,day)=>count===max?WEEKDAYS[day]:null).filter(Boolean):[];
  return {counts,total,max,top:top.length<=3?top:[]};
}
// SOS dos últimos 30 dias; ação no formato "concluido depois:N acao:x".
export function sosStats(sessions=[],today,days=30) {
  const since=shiftISO(today,-(days-1));
  const recent=sessions.filter(session=>{const date=new Date(session.createdAt);if(Number.isNaN(date.getTime()))return false;const iso=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;return iso>=since&&iso<=today;});
  const drops=recent.map(session=>/^concluido depois:([1-5])/.exec(session.action||'')).map((match,i)=>match?recent[i].intensity-Number(match[1]):null).filter(value=>value!==null);
  return {total:recent.length,completed:drops.length,avgDrop:drops.length?drops.reduce((a,b)=>a+b,0)/drops.length:0};
}
export const weekdayLabels=['D','S','T','Q','Q','S','S'];
