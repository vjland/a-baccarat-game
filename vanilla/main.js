import * as Game from './logic.js';

let shoe = [], history = [], balance = 10000, currentBets = {}, gameState = 'betting', dealMode = 'manual', autoInterval = 10, selectedChip = 100, timer = 10, timerInt = null, lastResult = null;

const el = {
    player: document.getElementById('player-cards'), banker: document.getElementById('banker-cards'),
    pScore: document.getElementById('player-score'), bScore: document.getElementById('banker-score'),
    resLabel: document.getElementById('result-label'), manualLabel: document.getElementById('manual-label'),
    autoStatus: document.getElementById('auto-status'), timer: document.getElementById('timer-display'),
    balance: document.getElementById('balance-display'), shoeProg: document.getElementById('shoe-progress'),
    shoeCount: document.getElementById('shoe-count'), bettingAreas: document.getElementById('betting-areas'),
    chipSelection: document.getElementById('chip-selection'), dealBtn: document.getElementById('deal-btn'),
    dealContainer: document.getElementById('deal-button-container'), settingsPanel: document.getElementById('settings-panel'),
    settingsBtn: document.getElementById('settings-btn'), settingsClose: document.getElementById('settings-close'),
    modeAuto: document.getElementById('mode-auto'), modeManual: document.getElementById('mode-manual'),
    intervalPanel: document.getElementById('interval-panel'), intervalBtns: document.getElementById('interval-btns'),
    initLabel: document.getElementById('initializing-label'), burnValue: document.getElementById('burn-value')
};

function init() {
    setupUI();
    startNewShoe();
    el.settingsBtn.onclick = () => el.settingsPanel.classList.add('open');
    el.settingsClose.onclick = () => el.settingsPanel.classList.remove('open');
    el.modeAuto.onclick = () => setMode('auto');
    el.modeManual.onclick = () => setMode('manual');
    el.dealBtn.onclick = () => handleDeal(true);
    document.getElementById('new-shoe-btn').onclick = startNewShoe;
    document.getElementById('clear-btn').onclick = clearBets;
}

function setMode(mode) {
    dealMode = mode;
    el.modeAuto.className = mode === 'auto' ? "flex-1 py-1 rounded text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30" : "flex-1 py-1 rounded text-xs";
    el.modeManual.className = mode === 'manual' ? "flex-1 py-1 rounded text-xs bg-orange-600/20 text-orange-400 border border-orange-500/30" : "flex-1 py-1 rounded text-xs";
    el.intervalPanel.style.opacity = mode === 'auto' ? '1' : '0.4';
    el.intervalPanel.style.pointerEvents = mode === 'auto' ? 'auto' : 'none';
    if (mode === 'auto' && gameState === 'betting') startTimer(); else stopTimer();
    render();
}

function startNewShoe() {
    shoe = Game.createShoe(8); history = []; balance = 10000; currentBets = {}; lastResult = null;
    const burn = shoe[0].value || 10;
    el.initLabel.classList.remove('hidden'); el.burnValue.textContent = burn;
    setTimeout(() => {
        shoe = shoe.slice(burn + 1); gameState = 'betting';
        el.initLabel.classList.add('hidden'); if (dealMode === 'auto') startTimer();
        render();
    }, 1200);
}

function startTimer() {
    stopTimer(); timer = autoInterval; el.timer.textContent = timer;
    timerInt = setInterval(() => { timer--; el.timer.textContent = timer; if (timer <= 0) handleDeal(false); }, 1000);
}
function stopTimer() { clearInterval(timerInt); }

function handleDeal(instant) {
    if (gameState !== 'betting') return;
    gameState = 'dealing'; stopTimer(); render();
    const { result, usedCards } = Game.playHand(shoe);
    setTimeout(() => {
        lastResult = result; history.push(result); shoe = shoe.slice(usedCards);
        let payout = 0;
        for (let target in currentBets) {
            const amt = currentBets[target];
            if (target === Game.BetTarget.Player && result.winner === 'P') payout += amt * 2;
            else if (target === Game.BetTarget.Banker && result.winner === 'B') payout += amt * 1.95;
            else if (target === Game.BetTarget.Tie && result.winner === 'T') payout += amt * 9;
            else if (result.winner === 'T' && (target === 'Player' || target === 'Banker')) payout += amt;
            if (target === 'Player Pair' && result.isPairPlayer) payout += amt * 12;
            if (target === 'Banker Pair' && result.isPairBanker) payout += amt * 12;
        }
        balance += payout; gameState = 'result'; render();
        setTimeout(() => { currentBets = {}; gameState = 'betting'; if (dealMode === 'auto') startTimer(); render(); }, 2500);
    }, instant ? 100 : 800);
}

function clearBets() { if (gameState === 'betting') { for (let t in currentBets) balance += currentBets[t]; currentBets = {}; render(); } }

function setupUI() {
    const areas = [
        { id: 'Player Pair', l: 'P.PAIR', odds: '11:1', c: 'bg-blue-900/40 text-blue-300' },
        { id: 'Player', l: 'PLAYER', odds: '1:1', c: 'bg-blue-600/80 text-white font-black' },
        { id: 'Tie', l: 'TIE', odds: '8:1', c: 'bg-green-700/80 text-white font-black' },
        { id: 'Banker', l: 'BANKER', odds: '0.95:1', c: 'bg-red-600/80 text-white font-black' },
        { id: 'Banker Pair', l: 'B.PAIR', odds: '11:1', c: 'bg-red-900/40 text-red-300' }
    ];
    el.bettingAreas.innerHTML = areas.map(a => `<button id="area-${a.id.replace(' ','')}" class="${a.c} rounded-lg flex flex-col items-center justify-center relative h-full border border-white/5 transition-transform active:scale-95"><span class="text-[6px] md:text-xs">${a.l}</span><span class="text-[10px] md:text-2xl">${a.odds}</span><div class="chip hidden absolute -top-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-1 rounded-full text-[6px] md:text-[10px] font-bold border border-white shadow-sm"></div></button>`).join('');
    areas.forEach(a => document.getElementById(`area-${a.id.replace(' ','')}`).onclick = () => { if (gameState === 'betting' && balance >= selectedChip) { balance -= selectedChip; currentBets[a.id] = (currentBets[a.id] || 0) + selectedChip; render(); } });
    
    [100, 200, 500].forEach(v => {
        const b = document.createElement('button'); b.textContent = v;
        b.className = `w-7 h-7 md:w-12 md:h-12 rounded-full border-2 border-white/20 text-[8px] md:text-xs font-black transition-transform ${v===100?'bg-black':v===200?'bg-blue-600':'bg-purple-600'}`;
        b.onclick = () => { selectedChip = v; render(); };
        b.id = `chip-${v}`; el.chipSelection.appendChild(b);
    });
}

function render() {
    el.balance.textContent = `$${balance.toLocaleString()}`;
    el.shoeCount.textContent = `${416 - shoe.length}/416`;
    el.shoeProg.style.width = `${((416 - shoe.length) / 416) * 100}%`;
    
    renderCards(el.player, lastResult?.playerCards || []);
    renderCards(el.banker, lastResult?.bankerCards || []);
    el.pScore.textContent = lastResult?.playerScore || '0';
    el.bScore.textContent = lastResult?.bankerScore || '0';
    
    el.autoStatus.classList.toggle('hidden', !(gameState === 'betting' && dealMode === 'auto'));
    el.manualLabel.classList.toggle('hidden', !(gameState === 'betting' && dealMode === 'manual'));
    el.dealContainer.classList.toggle('hidden', !(gameState === 'betting' && dealMode === 'manual'));
    el.resLabel.classList.toggle('hidden', gameState !== 'result');
    
    if (gameState === 'result') {
        const w = lastResult.winner; el.resLabel.textContent = w === 'P' ? 'PLAYER' : w === 'B' ? 'BANKER' : 'TIE';
        el.resLabel.className = `text-center px-2 py-1 md:px-10 md:py-5 rounded-lg font-black text-[8px] md:text-3xl shadow-2xl ring-1 md:ring-2 ring-white/20 ${w==='P'?'bg-blue-600/90':w==='B'?'bg-red-600/90':'bg-green-600/90'}`;
        if (w==='P'||w==='T') el.player.classList.add('animate-winner-flash','ring-2','ring-blue-500/50'); else el.player.classList.remove('animate-winner-flash','ring-2','ring-blue-500/50');
        if (w==='B'||w==='T') el.banker.classList.add('animate-winner-flash','ring-2','ring-red-500/50'); else el.banker.classList.remove('animate-winner-flash','ring-2','ring-red-500/50');
    } else {
        el.player.className = el.player.className.replace(/animate-winner-flash|ring-2|ring-blue-500\/50/g, "");
        el.banker.className = el.banker.className.replace(/animate-winner-flash|ring-2|ring-red-500\/50/g, "");
    }
    
    [100,200,500].forEach(v => document.getElementById(`chip-${v}`).style.borderColor = selectedChip === v ? '#facc15' : 'rgba(255,255,255,0.2)');
    for (let t in Game.BetTarget) {
        const target = Game.BetTarget[t];
        const chip = document.querySelector(`#area-${target.replace(' ','')} .chip`);
        if (chip) { if (currentBets[target]) { chip.textContent = `$${currentBets[target]}`; chip.classList.remove('hidden'); } else chip.classList.add('hidden'); }
    }
    renderRoadmaps();
}

function renderCards(container, cards) {
    container.innerHTML = cards.length ? cards.map(c => `<div class="w-10 h-14 md:w-24 md:h-36 bg-white rounded shadow-lg flex flex-col p-1 transform"><div class="text-[8px] md:text-lg font-bold ${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}">${c.rank}</div><div class="flex-grow flex items-center justify-center text-lg md:text-4xl ${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}">${c.suit}</div></div>`).join('') : '<div class="w-10 h-14 md:w-24 md:h-36 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white/10 text-xl">?</div>';
}

function renderRoadmaps() {
    const { matrix, path } = Game.generateBigRoad(history);
    renderGrid('big-road', matrix, 60, (c) => c ? `<div class="w-[80%] h-[80%] rounded-full border ${c.winner==='B'?'border-red-500':c.winner==='P'?'border-blue-500':'border-green-500'} relative">${c.ties?`<div class="absolute w-full h-[1px] bg-green-500 rotate-45"></div>`:''}</div>` : '');
    renderGrid('bead-plate', history, 12, (res) => res ? `<div class="w-[85%] h-[85%] rounded-full ${res.winner==='B'?'bg-red-600':res.winner==='P'?'bg-blue-600':'bg-green-600'} text-[6px] md:text-[8px] text-white flex items-center justify-center">${res.winner}</div>` : '', true);
    renderDerived('big-eye-boy', matrix, path, 1, 'circle');
    renderDerived('small-road', matrix, path, 2, 'dot');
    renderDerived('cockroach-road', matrix, path, 3, 'line');
}

function renderGrid(id, data, cols, renderer, isFlat) {
    const g = document.getElementById(id); if (!g) return; g.innerHTML = '';
    for (let i=0; i < 6 * cols; i++) {
        const r = i % 6, c = Math.floor(i/6);
        const cell = document.createElement('div'); cell.className = "roadmap-cell border-[0.1px] border-white/5 h-full w-full";
        cell.innerHTML = isFlat ? renderer(data[i]) : renderer(data[r][c]); g.appendChild(cell);
    }
}

function renderDerived(id, big, path, off, type) {
    const m = Game.generateDerivedRoad(big, path, off);
    renderGrid(id, m, 60, (c) => c ? `<div class="${type==='circle'?'w-1.5 h-1.5 md:w-2 md:h-2 rounded-full border':type==='dot'?'w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-current':'w-[1px] h-[70%] rotate-45 bg-current'} ${c==='red'?'border-red-500 text-red-500':'border-blue-500 text-blue-500'}"></div>` : '');
}

init();