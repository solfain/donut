// ============ DONUTBET — demo casino engine ============
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => Math.floor(n).toLocaleString('en-US');
const rand = (a,b) => a + Math.random()*(b-a);
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const AVATAR_COLORS = [['#38bdf8','#818cf8'],['#ff5c9e','#a855f7'],['#fbbf24','#ef4444'],['#22c55e','#14b8a6'],['#f472b6','#fb923c'],['#818cf8','#38bdf8']];
const BOTS = ['xX_DonutKing_Xx','DrDonutFan99','ShardGrinder','NoScopeNate','EnderQueen','CreeperHunter','GlazedGod','MendingMike','NetherNinja','SprinkleSue','LootGoblin_','PvP_Panda','DiamondDan','ElytraElla','TotemTom','WitherWanda'];
const GAMES = ['Crash','Coinflip','Mines','Roulette','Jackpot','Cases'];

// ---------- State ----------
let balance = parseInt(localStorage.getItem('donutbet_balance') ?? '10000', 10);
if (isNaN(balance)) balance = 10000;
let username = localStorage.getItem('donutbet_user') || 'Steve';
let claimReadyAt = parseInt(localStorage.getItem('donutbet_claim') || '0', 10);
let wageredToday = 0;

function save(){ localStorage.setItem('donutbet_balance', String(balance)); localStorage.setItem('donutbet_user', username); }
function setBalance(v, silent=false){
  balance = Math.max(0, Math.floor(v)); save();
  const el = $('#balance'); el.textContent = fmt(balance);
  if(!silent){ const box = $('#balanceBox'); box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
}
function addBalance(v){ setBalance(balance + v); }
function getBet(inputSel){
  const v = parseFloat($(inputSel).value);
  if (isNaN(v) || v < 10){ toast('Minimum bet is ◆ 10', 'red'); return null; }
  if (v > balance){ toast('Not enough shards — claim your bonus or deposit (demo)!', 'red'); return null; }
  return Math.floor(v);
}
function toast(msg, type=''){
  const t = document.createElement('div'); t.className = 'toast ' + type; t.innerHTML = msg;
  $('#toasts').appendChild(t); setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),320); }, 3600);
}
function fakeHash(){ return 'SHA256 • ' + [...crypto.getRandomValues(new Uint8Array(10))].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,22) + '…'; }
['#cfHash','#crashHash','#minesHash','#rouletteHash'].forEach(s=>{ const el=$(s); if(el) el.textContent = fakeHash(); });

function addLiveBet(user, game, bet, mult, isMine=false){
  const payout = Math.floor(bet * mult);
  const tr = document.createElement('tr');
  const [c1,c2] = pick(AVATAR_COLORS);
  tr.innerHTML = `<td><div class="player-cell"><span class="mini-avatar" style="background:linear-gradient(135deg,${c1},${c2})">${user[0].toUpperCase()}</span>${user}</div></td>
    <td>${game}</td><td>◆ ${fmt(bet)}</td><td>${mult.toFixed(2)}×</td>
    <td class="${mult>=1?'win-text':'lose-text'}">${mult>=1?'+◆ '+fmt(payout-bet):'-◆ '+fmt(bet)}</td>`;
  const body = $('#liveBetsBody'); body.prepend(tr);
  while(body.children.length > 9) body.lastChild.remove();
  if(isMine) return;
}
function myBet(game, bet, mult){ addLiveBet(username, game, bet, mult, true); wageredToday += bet; }

// ---------- Navigation ----------
function switchView(name){
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-'+name).classList.add('active');
  $$('[data-nav]').forEach(a=>a.classList.toggle('active', a.dataset.nav===name));
  $$('.side-link').forEach(a=>a.classList.toggle('active', a.dataset.nav===name));
  $('#sidebar').classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
  if(name==='crash') drawCrash(1, false);
}
document.addEventListener('click', e=>{
  const nav = e.target.closest('[data-nav]');
  if(nav){ e.preventDefault(); switchView(nav.dataset.nav); }
});
$('#hamburger').addEventListener('click', ()=> $('#sidebar').classList.toggle('open'));

// Bet helpers (½ / 2× / MAX)
$$('[data-bet]').forEach(btn=>btn.addEventListener('click', ()=>{
  const input = $('#'+btn.dataset.bet); let v = parseFloat(input.value)||0;
  if(btn.dataset.op==='half') v = Math.max(10, Math.floor(v/2));
  if(btn.dataset.op==='double') v = Math.floor(v*2);
  if(btn.dataset.op==='max') v = balance;
  input.value = v;
}));

// ---------- Bonus / Deposit / Modals ----------
function updateClaim(){
  const left = claimReadyAt - Date.now();
  const ready = left <= 0;
  [$('#claimBtn'), $('#claimBtnTop')].forEach(b=>{ if(b) b.disabled = !ready; });
  $('#claimTimer').textContent = ready ? 'Ready now!' : `Next bonus in ${Math.ceil(left/1000)}s (demo cooldown)`;
}
function claimBonus(){
  if (claimReadyAt > Date.now()){ toast('Bonus on cooldown — demo cooldown is only 60s ⏳'); return; }
  claimReadyAt = Date.now() + 60000; localStorage.setItem('donutbet_claim', String(claimReadyAt));
  addBalance(1000); toast('🎁 <b>+◆ 1,000</b> bonus claimed!', 'gold'); updateClaim();
}
$('#claimBtn').addEventListener('click', claimBonus);
$('#claimBtnTop').addEventListener('click', claimBonus);
setInterval(updateClaim, 1000); updateClaim();

let depositAmount = 10000;
function openModal(sel){ $(sel).classList.add('open'); }
function closeModals(){ $$('.modal-overlay').forEach(m=>m.classList.remove('open')); }
$$('[data-close]').forEach(b=>b.addEventListener('click', closeModals));
$$('.modal-overlay').forEach(m=>m.addEventListener('click', e=>{ if(e.target===m) closeModals(); }));
$('#openDeposit').addEventListener('click', ()=>openModal('#depositModal'));
$('#openDeposit2').addEventListener('click', ()=>openModal('#depositModal'));
$$('.pkg').forEach(p=>p.addEventListener('click', ()=>{
  $$('.pkg').forEach(x=>x.classList.remove('selected')); p.classList.add('selected');
  depositAmount = parseInt(p.dataset.amount,10); $('#depositAmountLabel').textContent = fmt(depositAmount);
}));
$('#confirmDeposit').addEventListener('click', ()=>{
  const name = $('#mcUsername').value.trim();
  if(name){ username = name; $('#usernameDisplay').textContent = username; $('.user-chip .avatar').textContent = username[0].toUpperCase(); save(); }
  addBalance(depositAmount); closeModals();
  toast(`💳 Deposited <b>◆ ${fmt(depositAmount)}</b> to <b>${username}</b> (demo)`, 'green');
});
function showInfo(title, html){ $('#infoTitle').textContent = title; $('#infoBody').innerHTML = html; openModal('#infoModal'); }
$('#openWithdraw').addEventListener('click', ()=> showInfo('🏦 Withdraw (Demo)', `This is a <b>fan-made demo</b>, so withdrawals are simulated.<br><br>In the real flow you'd enter your Minecraft username, choose an amount, and shards would be sent in-game within a few minutes.<br><br>Your demo balance: <b>◆ ${fmt(balance)}</b>`));
$('#openFairness').addEventListener('click', ()=> showInfo('🔒 Provably Fair', `Every round generates a random result with a visible hash before you play (see the hash badge on each game).<br><br>House edges: Coinflip 4% • Crash ~3% instant-crash • Mines 3% • Roulette standard wheel odds.<br><br><b>Demo only:</b> results use your browser's <span class="mono">crypto</span> random generator.`));
$('#resetBtn').addEventListener('click', ()=>{ setBalance(10000); claimReadyAt = 0; localStorage.setItem('donutbet_claim','0'); updateClaim(); toast('↺ Demo balance reset to <b>◆ 10,000</b>', 'gold'); });
$('#userChip').addEventListener('click', ()=>openModal('#depositModal'));

// ============ COINFLIP ============
let cfSide = 'donut', cfBusy = false;
function cfSetSide(side){
  cfSide = side;
  $('#pickDonut').classList.toggle('active', side==='donut');
  $('#pickChoco').classList.toggle('active', side==='choco');
  $('#cfYourSide').textContent = side==='donut' ? '🍩 Donut' : '🍫 Chocolate';
  $('#cfBotSide').textContent = side==='donut' ? '🍫 Chocolate' : '🍩 Donut';
}
$('#pickDonut').addEventListener('click', ()=>cfSetSide('donut'));
$('#pickChoco').addEventListener('click', ()=>cfSetSide('choco'));
$('#cfFlipBtn').addEventListener('click', ()=>{
  if(cfBusy) return;
  const bet = getBet('#cfBet'); if(bet===null) return;
  cfBusy = true; setBalance(balance - bet); $('#cfFlipBtn').disabled = true;
  $('#cfResult').textContent = 'Flipping…'; $('#cfSub').textContent = 'Good luck!';
  const win = Math.random() < 0.5;
  const resultSide = win ? cfSide : (cfSide==='donut' ? 'choco' : 'donut');
  const coin = $('#coin');
  coin.style.setProperty('--final-rot', resultSide==='donut' ? '1800deg' : '1980deg');
  coin.classList.remove('flipping'); void coin.offsetWidth; coin.classList.add('flipping');
  setTimeout(()=>{
    cfBusy = false; $('#cfFlipBtn').disabled = false;
    const pill = document.createElement('span');
    if(win){
      const payout = Math.floor(bet*1.92); addBalance(payout);
      $('#cfResult').innerHTML = `🎉 It's ${resultSide==='donut'?'🍩 Donut':'🍫 Chocolate'} — YOU WIN!`;
      $('#cfSub').innerHTML = `Payout <b class="gold-text">◆ ${fmt(payout)}</b> (1.92×)`;
      toast(`🪙 Coinflip win! <b>+◆ ${fmt(payout-bet)}</b> profit`, 'green');
      pill.className='hist-pill win'; pill.textContent = resultSide==='donut'?'🍩 WIN':'🍫 WIN'; myBet('Coinflip', bet, 1.92);
    } else {
      $('#cfResult').innerHTML = `💀 It's ${resultSide==='donut'?'🍩 Donut':'🍫 Chocolate'} — you lost`;
      $('#cfSub').textContent = 'DonutBot takes this one. Run it back?';
      pill.className='hist-pill lose'; pill.textContent = resultSide==='donut'?'🍩 LOSE':'🍫 LOSE'; myBet('Coinflip', bet, 0);
    }
    const h = $('#cfHistory'); h.prepend(pill); while(h.children.length>8) h.lastChild.remove();
    $('#cfHash').textContent = fakeHash();
  }, 2450);
});

// ============ CRASH ============
let crash = { running:false, bet:0, start:0, point:2, raf:null, cashed:false };
const crashHistSeed = [1.24, 4.82, 1.03, 12.4, 2.15, 1.67, 7.91, 1.00];
crashHistSeed.forEach(m=>addCrashPill(m));
function addCrashPill(m){
  const p=document.createElement('span'); p.className='hist-pill '+(m>=2?'win':m>=1.2?'gold':'lose'); p.textContent=m.toFixed(2)+'×';
  const h=$('#crashHistory'); h.prepend(p); while(h.children.length>10) h.lastChild.remove();
}
function crashPoint(){
  const r = Math.random();
  if(r < 0.03) return 1.00;
  return Math.min(50, Math.max(1.01, 0.97/(1-r)));
}
function drawCrash(mult, crashed){
  const c = $('#crashCanvas'), ctx = c.getContext('2d');
  const W=c.width, H=c.height; ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=60){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for(let y=0;y<H;y+=52){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  const t = Math.log(Math.max(mult,1));
  ctx.beginPath();
  for(let i=0;i<=60;i++){
    const p=i/60, x=40+p*(W-90), y=H-36-Math.pow(p,1.35)*t*(H-110);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.strokeStyle = crashed ? '#ef4444' : '#ff5c9e'; ctx.lineWidth=4; ctx.lineJoin='round';
  ctx.shadowColor = crashed ? '#ef4444' : '#ff5c9e'; ctx.shadowBlur=16; ctx.stroke(); ctx.shadowBlur=0;
  const ex=40+(W-90), ey=H-36-t*(H-110);
  ctx.font='34px serif'; ctx.fillText(crashed?'💥':'🍩', ex-14, Math.max(34,ey+8));
}
drawCrash(1,false);
function crashTick(){
  if(!crash.running) return;
  const elapsed = (Date.now()-crash.start)/1000;
  const mult = Math.exp(0.14*elapsed);
  const auto = parseFloat($('#crashAuto').value);
  $('#crashMult').textContent = mult.toFixed(2)+'×';
  $('#cashoutBtn').textContent = `CASH OUT ◆ ${fmt(crash.bet*mult)} (${mult.toFixed(2)}×)`;
  drawCrash(mult,false);
  if(!crash.cashed && auto>=1.1 && mult>=auto){ doCashout(mult); return; }
  if(mult >= crash.point){ endCrash(mult); return; }
  crash.raf = requestAnimationFrame(crashTick);
}
function endCrash(mult){
  crash.running=false; cancelAnimationFrame(crash.raf);
  $('#crashMult').textContent = crash.point.toFixed(2)+'×'; $('#crashMult').classList.add('crashed');
  $('#crashStatus').textContent = `💥 CRASHED at ${crash.point.toFixed(2)}×`;
  drawCrash(crash.point,true);
  $('#crashBtn').classList.remove('hidden'); $('#cashoutBtn').classList.add('hidden'); $('#crashBtn').disabled=false;
  addCrashPill(crash.point);
  if(!crash.cashed){ myBet('Crash', crash.bet, 0); toast(`💥 Crashed at <b>${crash.point.toFixed(2)}×</b> — lost ◆ ${fmt(crash.bet)}`, 'red'); }
  $('#crashHash').textContent = fakeHash();
}
function doCashout(atMult){
  if(!crash.running || crash.cashed) return;
  const elapsed=(Date.now()-crash.start)/1000;
  const mult = atMult || Math.exp(0.14*elapsed);
  crash.cashed = true; crash.running=false; cancelAnimationFrame(crash.raf);
  const payout = Math.floor(crash.bet*mult); addBalance(payout);
  $('#crashMult').classList.add('cashed'); $('#crashStatus').textContent = `✅ Cashed out at ${mult.toFixed(2)}×`;
  $('#crashBtn').classList.remove('hidden'); $('#cashoutBtn').classList.add('hidden'); $('#crashBtn').disabled=false;
  toast(`🚀 Cashed out at <b>${mult.toFixed(2)}×</b> — won <b>◆ ${fmt(payout)}</b>`, 'green');
  addCrashPill(crash.point); myBet('Crash', crash.bet, mult); drawCrash(mult,false);
}
$('#crashBtn').addEventListener('click', ()=>{
  if(crash.running) return;
  const bet=getBet('#crashBet'); if(bet===null) return;
  setBalance(balance-bet);
  crash={running:true, bet, start:Date.now(), point:crashPoint(), raf:null, cashed:false};
  $('#crashMult').classList.remove('crashed','cashed'); $('#crashStatus').textContent='Riding… don\'t get greedy 👀';
  $('#crashBtn').classList.add('hidden'); $('#crashBtn').disabled=true; $('#cashoutBtn').classList.remove('hidden');
  $('#crashRiders').innerHTML = BOTS.slice(0,4).map(b=>`<span class="rider">${b} riding <b>◆ ${fmt(rand(100,5000))}</b></span>`).join('');
  crashTick();
});
$('#cashoutBtn').addEventListener('click', ()=>doCashout());

// ============ MINES ============
let mines = { active:false, count:3, bet:0, bombs:new Set(), revealed:0 };
function comb(n,k){ if(k<0||k>n) return 0; let r=1; for(let i=0;i<k;i++) r=r*(n-i)/(i+1); return r; }
function minesMult(count, revealed){ return 0.97 * comb(25,revealed)/comb(25-count,revealed); }
function minesRender(disabled=true){
  const g=$('#minesGrid'); g.innerHTML='';
  for(let i=0;i<25;i++){
    const b=document.createElement('button'); b.className='mine-tile'; b.textContent='◆'; b.disabled=disabled;
    b.addEventListener('click', ()=>minesClick(i,b)); g.appendChild(b);
  }
}
minesRender();
$$('#mineOptions button').forEach(b=>b.addEventListener('click', ()=>{
  if(mines.active) return;
  $$('#mineOptions button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  mines.count=parseInt(b.dataset.mines,10); minesUpdateStats(0);
}));
function minesUpdateStats(revealed){
  $('#minesNext').textContent = minesMult(mines.count, revealed+1).toFixed(2)+'×';
  const cash = mines.active ? Math.floor(mines.bet*minesMult(mines.count, revealed)) : 0;
  $('#minesCashout').textContent='◆ '+fmt(cash); $('#minesCashBtn').textContent=`CASH OUT ◆ ${fmt(cash)}`;
}
minesUpdateStats(0);
$('#minesStartBtn').addEventListener('click', ()=>{
  if(mines.active) return;
  const bet=getBet('#minesBet'); if(bet===null) return;
  setBalance(balance-bet);
  mines.active=true; mines.bet=bet; mines.revealed=0;
  mines.bombs=new Set(); while(mines.bombs.size<mines.count) mines.bombs.add(Math.floor(Math.random()*25));
  minesRender(false); minesUpdateStats(0);
  $('#minesStartBtn').classList.add('hidden'); $('#minesCashBtn').classList.remove('hidden'); $('#minesCashBtn').disabled=true;
  $('#minesResult').textContent=`Game on! ${mines.count} TNT hidden — click a tile ⛏️`;
});
function minesClick(i, el){
  if(!mines.active || el.classList.contains('safe')) return;
  if(mines.bombs.has(i)){
    el.classList.add('bomb'); el.textContent='💣'; mines.active=false;
    $$('#minesGrid .mine-tile').forEach((t,idx)=>{ t.disabled=true; if(mines.bombs.has(idx)&&t!==el){t.textContent='💣'; t.classList.add('dim');} });
    $('#minesResult').innerHTML=`💥 BOOM! You hit TNT and lost <b>◆ ${fmt(mines.bet)}</b>`;
    $('#minesStartBtn').classList.remove('hidden'); $('#minesCashBtn').classList.add('hidden');
    myBet('Mines', mines.bet, 0); toast('💣 Mine hit! Better luck next dig.', 'red'); $('#minesHash').textContent=fakeHash(); return;
  }
  el.classList.add('safe'); el.textContent='🍩'; mines.revealed++;
  minesUpdateStats(mines.revealed); $('#minesCashBtn').disabled=false;
  $('#minesResult').innerHTML=`🍩 Safe! <b>${minesMult(mines.count,mines.revealed).toFixed(2)}×</b> — cash out or push your luck?`;
  if(mines.revealed === 25-mines.count){ minesCashout(); }
}
function minesCashout(){
  if(!mines.active || mines.revealed===0) return;
  const mult=minesMult(mines.count,mines.revealed), payout=Math.floor(mines.bet*mult);
  mines.active=false; addBalance(payout);
  $$('#minesGrid .mine-tile').forEach((t,idx)=>{ t.disabled=true; if(mines.bombs.has(idx)){t.textContent='💣'; t.classList.add('dim');} });
  $('#minesResult').innerHTML=`✅ Cashed out <b class="gold-text">◆ ${fmt(payout)}</b> at ${mult.toFixed(2)}×`;
  $('#minesStartBtn').classList.remove('hidden'); $('#minesCashBtn').classList.add('hidden');
  toast(`🍩 Mines cashout! <b>+◆ ${fmt(payout-mines.bet)}</b> profit`, 'green'); myBet('Mines', mines.bet, mult);
}
$('#minesCashBtn').addEventListener('click', minesCashout);

// ============ ROULETTE ============
// 0 = gold, 1-7 = pink, 8-14 = choco
function rColor(n){ return n===0?'gold':n<=7?'pink':'choco'; }
function rTile(n){ const d=document.createElement('div'); d.className='r-tile '+rColor(n); d.textContent = n===0?'⭐':n<=7?'🩷':'🍫'; d.title=n; return d; }
(function buildRoulette(){ const s=$('#rouletteStrip'); for(let r=0;r<4;r++) for(let n=0;n<15;n++) s.appendChild(rTile(n)); })();
let rouletteBusy=false;
$$('[data-roulette-bet]').forEach(b=>b.addEventListener('click', ()=>{ $(b.dataset.rouletteBet==='pink'?'#betPink':b.dataset.rouletteBet==='gold'?'#betGold':'#betChoco').focus(); toast(`Bet set on <b>${b.dataset.rouletteBet}</b> — hit SPIN when ready 🎡`); }));
$('#rouletteSpin').addEventListener('click', ()=>{
  if(rouletteBusy) return;
  const bets={ pink:Math.max(0,parseFloat($('#betPink').value)||0), gold:Math.max(0,parseFloat($('#betGold').value)||0), choco:Math.max(0,parseFloat($('#betChoco').value)||0) };
  const total=bets.pink+bets.gold+bets.choco;
  if(total<10){ toast('Place at least ◆ 10 total on Pink / Gold / Chocolate first', 'red'); return; }
  if(total>balance){ toast('Not enough shards for those bets', 'red'); return; }
  rouletteBusy=true; setBalance(balance-total); $('#rouletteSpin').disabled=true;
  $('#rouletteResult').textContent='Spinning… 🎡';
  const result=Math.floor(Math.random()*15), color=rColor(result);
  const strip=$('#rouletteStrip');
  const tileW=82, cycles=15*2;
  const idx=cycles+result;
  const centerOffset = strip.parentElement.clientWidth/2 - 37;
  const target = -(idx*tileW - centerOffset + rand(-18,18));
  strip.style.transition='none'; strip.style.transform='translateX(0)';
  void strip.offsetWidth;
  strip.style.transition='transform 5.2s cubic-bezier(.08,.75,.08,1)'; strip.style.transform=`translateX(${target}px)`;
  setTimeout(()=>{
    rouletteBusy=false; $('#rouletteSpin').disabled=false;
    const mult = color==='gold'?14:2, won = bets[color]>0, payout = won?Math.floor(bets[color]*mult):0;
    if(payout) addBalance(payout);
    $('#rouletteResult').innerHTML = `Landed on <b>${color==='gold'?'⭐ GOLD':color==='pink'?'🩷 PINK':'🍫 CHOCOLATE'} (${result})</b> — ${payout?`you won <b class="gold-text">◆ ${fmt(payout)}</b>!`:'no win this spin.'}`;
    const h=$('#rouletteHistory'); const p=document.createElement('span'); p.className='hist-pill '+(color==='gold'?'gold':won?'win':'lose'); p.textContent=(color==='gold'?'⭐ ':color==='pink'?'🩷 ':'🍫 ')+result; h.prepend(p); while(h.children.length>10) h.lastChild.remove();
    myBet('Roulette', total, total? payout/total:0);
    if(payout>total) toast(`🎡 Roulette win! <b>+◆ ${fmt(payout-total)}</b> profit`, 'green');
    $('#rouletteHash').textContent=fakeHash();
    setTimeout(()=>{ strip.style.transition='none'; strip.style.transform='translateX(0)'; }, 600);
  }, 5400);
});

// ============ JACKPOT ============
const POT_COLORS=['#ff5c9e','#fbbf24','#38bdf8','#22c55e','#c084fc','#fb923c','#f87171','#2dd4bf'];
let pot=[], potTimerSec=30, potSpinning=false, potInterval=null;
function potTotal(){ return pot.reduce((s,e)=>s+e.amount,0); }
function renderPot(){
  const total=potTotal();
  $('#potTotal').textContent='◆ '+fmt(total); $('#potCenter').textContent='◆ '+fmt(total);
  let acc=0; const segs=pot.map(e=>{ const a=total? (e.amount/total)*360:0; const s=`${e.color} ${acc}deg ${acc+a}deg`; acc+=a; return s; });
  $('#jackpotWheel').style.background = pot.length? `conic-gradient(${segs.join(',')})` : 'conic-gradient(#333 0 100%)';
  const mine=pot.filter(e=>e.user===username).reduce((s,e)=>s+e.amount,0);
  $('#potChance').textContent = total? (mine/total*100).toFixed(1)+'%' : '0%';
  $('#potEntries').innerHTML = pot.map(e=>`<span class="pot-entry"><span class="pot-dot" style="background:${e.color}"></span>${e.user} <b>◆ ${fmt(e.amount)}</b> <span class="muted">${total?(e.amount/total*100).toFixed(1):0}%</span></span>`).join('') || '<span class="muted">No entries yet — be the first!</span>';
}
function addPotEntry(user, amount){
  const existing=pot.find(e=>e.user===user);
  if(existing) existing.amount+=amount;
  else pot.push({user, amount, color:POT_COLORS[pot.length%POT_COLORS.length]});
  renderPot();
}
function seedPot(){ pot=[]; const n=4+Math.floor(Math.random()*3); for(let i=0;i<n;i++) addPotEntry(pick(BOTS), Math.floor(rand(200,15000))); renderPot(); }
function endJackpot(){
  if(pot.length<2 || potSpinning) { seedPot(); potTimerSec=30; return; }
  potSpinning=true;
  const total=potTotal(); let roll=rand(0,total), winner=pot[0], acc=0, winAngle=0;
  for(const e of pot){ if(roll < acc+e.amount){ winner=e; winAngle=acc+(e.amount/total)*180; break; } acc+=e.amount; }
  // angle of winner segment center from top (conic starts at top, clockwise)
  let a2=0, center=0; for(const e of pot){ const a=(e.amount/total)*360; if(e===winner) center=a2+a/2; a2+=a; }
  const wheel=$('#jackpotWheel'); const spins=360*6;
  wheel.style.transform=`rotate(${spins - center + 360}deg)`;
  $('#jackpotResult').textContent='Drawing winner… 🏆';
  setTimeout(()=>{
    const isMe = winner.user===username;
    $('#jackpotResult').innerHTML = isMe ? `👑 <b class="gold-text">YOU WON THE JACKPOT! ◆ ${fmt(total)}</b>` : `🏆 <b>${winner.user}</b> won <b class="gold-text">◆ ${fmt(total)}</b>`;
    if(isMe){ addBalance(total); toast(`👑 JACKPOT! You won <b>◆ ${fmt(total)}</b>`, 'gold'); }
    const myEntry=pot.filter(e=>e.user===username).reduce((s,e)=>s+e.amount,0);
    if(myEntry) myBet('Jackpot', myEntry, isMe? total/myEntry:0);
    setTimeout(()=>{ wheel.style.transition='none'; wheel.style.transform='rotate(0deg)'; void wheel.offsetWidth; wheel.style.transition='transform 7s cubic-bezier(.08,.75,.08,1)'; seedPot(); potSpinning=false; potTimerSec=30; }, 2500);
  }, 7200);
}
function potTick(){
  potTimerSec--; $('#potTimer').textContent = potTimerSec+'s';
  if(Math.random()<0.45 && !potSpinning) addPotEntry(pick(BOTS), Math.floor(rand(100,8000)));
  if(potTimerSec<=0) endJackpot();
}
$('#jackpotJoin').addEventListener('click', ()=>{
  if(potSpinning){ toast('Round is drawing — wait for the next one'); return; }
  const bet=getBet('#jackpotBet'); if(bet===null) return;
  setBalance(balance-bet); addPotEntry(username, bet);
  toast(`🏆 Joined the pot with <b>◆ ${fmt(bet)}</b> — good luck!`, 'gold');
  if(potTimerSec>12) potTimerSec=12; // joining speeds up the draw
});
seedPot(); potInterval=setInterval(potTick, 1000);

// ============ CASES ============
const ITEMS=[
  {icon:'🍞',name:'Bread Stack',value:40,rarity:'common'},{icon:'⛏️',name:'Iron Pickaxe',value:90,rarity:'common'},
  {icon:'🥔',name:'Baked Potato x64',value:120,rarity:'common'},{icon:'🪓',name:'Diamond Axe',value:320,rarity:'rare'},
  {icon:'💎',name:'Diamond Block x8',value:650,rarity:'rare'},{icon:'📖',name:'Mending Book',value:1100,rarity:'epic'},
  {icon:'🔱',name:'Trident',value:1800,rarity:'epic'},{icon:'🪽',name:'Elytra',value:4200,rarity:'legendary'},
  {icon:'⚔️',name:'Netherite Sword',value:6800,rarity:'legendary'},{icon:'⭐',name:'Nether Star',value:12000,rarity:'legendary'},
  {icon:'🥚',name:'Dragon Egg',value:45000,rarity:'mythic'},{icon:'🍩',name:'Golden Donut (God Roll)',value:100000,rarity:'mythic'},
];
const CASES=[
  {id:'starter',emoji:'📦',name:'Starter Crate',price:250,desc:'Bread, tools & your first diamonds. Low risk, chill vibes.',maxTier:3},
  {id:'donut',emoji:'🍩',name:'Donut Crate',price:1000,desc:'The fan favourite. Elytras, Mending & Netherite inside.',maxTier:9},
  {id:'god',emoji:'👑',name:'GOD Crate',price:5000,desc:'Dragon Eggs & the Golden Donut. Whales only. 🐋',maxTier:11},
];
function casePool(c){ return ITEMS.slice(0, c.maxTier+1); }
function rollCaseItem(c){
  const pool=casePool(c);
  // weight: cheap items common, top items rare
  const weights=pool.map((it,i)=>Math.pow(pool.length-i,2.2));
  let sum=weights.reduce((a,b)=>a+b,0), r=rand(0,sum);
  for(let i=0;i<pool.length;i++){ r-=weights[i]; if(r<=0) return pool[i]; }
  return pool[0];
}
$('#casesGrid').innerHTML = CASES.map((c,i)=>`
  <article class="case-card"><span class="case-emoji">${c.emoji}</span><h3>${c.name}</h3><p>${c.desc}</p>
  <div class="case-price">◆ ${fmt(c.price)}</div><button class="btn ${i===2?'btn-gold':'btn-pink'} btn-full" data-open-case="${c.id}">OPEN CASE</button></article>`).join('');
$('#dropsGrid').innerHTML = ITEMS.map(it=>`<div class="drop-item"><span class="item-icon">${it.icon}</span><div><b>${it.name}</b><span class="rarity ${it.rarity}">${it.rarity}</span><br><span>◆ ${fmt(it.value)}</span></div></div>`).join('');
let caseBusy=false;
document.addEventListener('click', e=>{
  const btn=e.target.closest('[data-open-case]'); if(!btn || caseBusy) return;
  const c=CASES.find(x=>x.id===btn.dataset.openCase); openCase(c);
});
function openCase(c){
  if(balance < c.price){ toast('Not enough shards for this case — claim your bonus!', 'red'); return; }
  caseBusy=true; setBalance(balance-c.price);
  $('#caseStage').classList.remove('hidden'); $('#caseWin').innerHTML='';
  $('#caseStageTitle').textContent=`Opening ${c.name}…`;
  $('#caseStage').scrollIntoView({behavior:'smooth', block:'center'});
  const winItem=rollCaseItem(c), pool=casePool(c);
  const strip=$('#caseStrip'); strip.innerHTML='';
  const tiles=[]; for(let i=0;i<42;i++){ const it=i===36?winItem:pick(pool); tiles.push(it); strip.appendChild(caseTile(it)); }
  const tileW=126, centerOffset=strip.parentElement.clientWidth/2-59;
  strip.style.transition='none'; strip.style.transform='translateX(0)'; void strip.offsetWidth;
  const target=-(36*tileW-centerOffset+rand(-30,30));
  strip.style.transition='transform 5s cubic-bezier(.08,.75,.08,1)'; strip.style.transform=`translateX(${target}px)`;
  setTimeout(()=>{
    caseBusy=false; addBalance(winItem.value);
    $('#caseStageTitle').textContent='You unboxed:';
    $('#caseWin').innerHTML=`${winItem.icon} <b>${winItem.name}</b> <span class="rarity ${winItem.rarity}">${winItem.rarity.toUpperCase()}</span><br>Sold for <b>◆ ${fmt(winItem.value)}</b> ${winItem.value>c.price?`(<span class="win-text">+◆ ${fmt(winItem.value-c.price)} profit</span>)`:`(<span class="lose-text">-◆ ${fmt(c.price-winItem.value)}</span>)`}`;
    toast(`${winItem.icon} Unboxed <b>${winItem.name}</b> — sold for <b>◆ ${fmt(winItem.value)}</b>`, winItem.value>=c.price?'gold':'');
    myBet('Cases', c.price, winItem.value/c.price);
  }, 5300);
}
function caseTile(it){ const d=document.createElement('div'); d.className='c-tile '+it.rarity; d.innerHTML=`<span class="item-icon">${it.icon}</span><b>${it.name}</b><span>◆ ${fmt(it.value)}</span>`; return d; }
$('#caseClose').addEventListener('click', ()=> $('#caseStage').classList.add('hidden'));

// ============ LOBBY: leaderboard, live feed, chat, tickers ============
const LEADERS=[['DonutKing_Xx',2410000],['GlazedGod',1875000],['ShardGrinder',1204000],['EnderQueen',986000],['ElytraElla',764000]];
$('#leaderboard').innerHTML = LEADERS.map((l,i)=>`<div class="lb-row"><span class="lb-rank">#${i+1}</span><span class="mini-avatar" style="background:linear-gradient(135deg,${AVATAR_COLORS[i][0]},${AVATAR_COLORS[i][1]})">${l[0][0]}</span><span class="grow"><b>${l[0]}</b><small>${pick(GAMES)} grinder</small></span><b class="gold-text">◆ ${fmt(l[1])}</b></div>`).join('');
$('#bigWinTicker').innerHTML = [['xX_DonutKing_Xx','◆ 250,000 on Crash @ 25.0×'],['GlazedGod','Dragon Egg from GOD Crate 🥚'],['EnderQueen','◆ 184,500 Jackpot'],['SprinkleSue','◆ 92,000 Coinflip streak'],['LootGoblin_','14× on Roulette Gold ⭐']].map(w=>`<span class="ticker-item">🏆 <b>${w[0]}</b> won ${w[1]}</span>`).join('');

for(let i=0;i<7;i++) addLiveBet(pick(BOTS), pick(GAMES), Math.floor(rand(50,20000)), Math.random()<0.48?0:rand(1.1,9));
setInterval(()=>{ if(Math.random()<0.75) addLiveBet(pick(BOTS), pick(GAMES), Math.floor(rand(50,25000)), Math.random()<0.48?0:rand(1.05,14)); }, 3800);

const CHAT_SEED=[
  ['GlazedGod','just hit 14x on crash LETS GOOO 🚀'],['ShardGrinder','mines is free money if you cash out early ngl'],
  ['EnderQueen','opened a god crate and got bread. pain.'],['NoScopeNate','donut side on coinflip is rigged (in my favour)'],
  ['SprinkleSue','anyone else grinding for elytra case?'],['DonutKing_Xx','jackpot in 10s, get in!!'],
  ['CreeperHunter','withdrew 50k shards to my alt, instant ⚡'],['MendingMike','crash cashed at 1.01x. i am a coward and proud'],
];
const CHAT_LINES=['LETS GO','donut to the moon 🍩','one more spin…','crash at 1.00 instantly, classic','mines 24 is just donating shards lol','GOLD on roulette trust me ⭐','gg!','i can quit anytime (i cannot)','faucet claimed, we ball','that jackpot pot is JUICY'];
function addChat(user, msg, mine=false){
  const [c1,c2]=pick(AVATAR_COLORS);
  const d=document.createElement('div'); d.className='chat-msg';
  d.innerHTML=`<span class="mini-avatar" style="background:linear-gradient(135deg,${c1},${c2})">${user[0].toUpperCase()}</span><div><b>${user}</b> <span class="lvl">LVL ${Math.floor(rand(3,40))}</span><p></p></div>`;
  d.querySelector('p').textContent=msg;
  const box=$('#chatMessages'); box.appendChild(d); while(box.children.length>40) box.firstChild.remove(); box.scrollTop=box.scrollHeight;
}
CHAT_SEED.forEach((c,i)=>setTimeout(()=>addChat(c[0],c[1]), i*350));
setInterval(()=>{ if(Math.random()<0.6) addChat(pick(BOTS), pick(CHAT_LINES)); }, 6500);
$('#chatForm').addEventListener('submit', e=>{
  e.preventDefault(); const v=$('#chatInput').value.trim(); if(!v) return;
  addChat(username, v, true); $('#chatInput').value='';
  if(Math.random()<0.5) setTimeout(()=>addChat(pick(BOTS), pick(['fr fr','W','🍩🍩🍩','gl!','real'])), 1200);
});

// Online counters + wagered ticker
setInterval(()=>{
  const n=2700+Math.floor(Math.sin(Date.now()/9000)*180+rand(-40,40));
  $('#onlineCount').textContent=fmt(n); const co=$('#chatOnline'); if(co) co.textContent=fmt(Math.floor(n*0.42));
}, 4000);
let wagered=48.2;
setInterval(()=>{ wagered+=rand(0.01,0.09); $('#statWagered').textContent='$'+wagered.toFixed(1)+'M'; }, 3000);

// Init
$('#usernameDisplay').textContent=username;
$('.user-chip .avatar').textContent=username[0].toUpperCase();
setBalance(balance, true);
setTimeout(()=>toast('🍩 Welcome to <b>DONUTBET</b>! You start with <b>◆ 10,000</b> demo shards. Claim a bonus anytime (left).', 'gold'), 600);
