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
