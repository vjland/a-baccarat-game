import * as Game from './logic.js';

let shoe = [], 
    history = [], 
    balance = 10000, 
    currentBets = {}, 
    gameState = 'initializing', 
    dealMode = 'manual', 
    autoInterval = 10, 
    selectedChip = 100, 
    timer = 10, 
    timerInt = null, 
    lastResult = null,
    shoeStats = { total: 416, used: 0 };

const el = {
    player: document.getElementById('player-cards'),
    banker: document.getElementById('banker-cards'),
    pScore: document.getElementById('player-score'),
    bScore: document.getElementById('banker-score'),
    resLabel: document.getElementById('result-label'),
    manualLabel: document.getElementById('manual-label'),
    autoStatus: document.getElementById('auto-status'),
    timer: document.getElementById('timer-display'),
    balance: document.getElementById('balance-display'),
    shoeProg: document.getElementById('shoe-progress'),
    shoeCount: document.getElementById('shoe-count'),
    bettingAreas: document.getElementById('betting-areas'),
    chipSelection: document.getElementById('chip-selection'),
    dealBtn: document.getElementById('deal-btn'),
    dealContainer: document.getElementById('deal-button-container'),
    settingsPanel: document.getElementById('settings-panel'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsClose: document.getElementById('settings-close'),
    modeAuto: document.getElementById('mode-auto'),
    modeManual: document.getElementById('mode-manual'),
    intervalPanel: document.getElementById('interval-panel'),
    intervalBtns: document.getElementById('interval-btns'),
    initLabel: document.getElementById('initializing-label'),
    burnValue: document.getElementById('burn-value')
};

function init() {
    setupBettingAreas();
    setupChips();
    attachEventListeners();
    startNewShoe();
}

function attachEventListeners() {
    el.settingsBtn.onclick = () => el.settingsPanel.classList.add('open');
    el.settingsClose.onclick = () => el.settingsPanel.classList.remove('open');
    el.modeAuto.onclick = () => setMode('auto');
    el.modeManual.onclick = () => setMode('manual');
    el.dealBtn.onclick = () => handleDeal(true);
    document.getElementById('new-shoe-btn').onclick = startNewShoe;
    document.getElementById('clear-btn').onclick = clearBets;
    
    el.intervalBtns.onclick = (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        autoInterval = parseInt(btn.dataset.sec);
        updateIntervalBtns();
        if (gameState === 'betting' && dealMode === 'auto') startTimer();
    };
}

function setMode(mode) {
    dealMode = mode;
    updateModeUI();
    if (mode === 'auto' && gameState === 'betting') startTimer(); 
    else stopTimer();
    render();
}

function updateModeUI() {
    el.modeAuto.className = dealMode === 'auto' ? "flex-1 py-1 rounded text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30" : "flex-1 py-1 rounded text-xs";
    el.modeManual.className = dealMode === 'manual' ? "flex-1 py-1 rounded text-xs bg-orange-600/20 text-orange-400 border border-orange-500/30" : "flex-1 py-1 rounded text-xs";
    el.intervalPanel.style.opacity = dealMode === 'auto' ? '1' : '0.4';
    el.intervalPanel.style.pointerEvents = dealMode === 'auto' ? 'auto' : 'none';
}

function updateIntervalBtns() {
    Array.from(el.intervalBtns.children).forEach(btn => {
        const isActive = parseInt(btn.dataset.sec) === autoInterval;
        btn.className = isActive ? "py-1 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 text-[10px]" : "py-1 rounded bg-white/5 text-[10px]";
    });
}

function startNewShoe() {
    shoe = Game.createShoe(8); 
    history = []; 
    balance = 10000; 
    currentBets = {}; 
    lastResult = null;
    shoeStats = { total: 416, used: 0 };
    gameState = 'initializing';
    
    stopTimer();
    const burn = shoe[0].value || 10;
    el.initLabel.classList.remove('hidden'); 
    el.burnValue.textContent = burn;
    el.resLabel.classList.add('hidden');
    el.autoStatus.classList.add('hidden');
    el.manualLabel.classList.add('hidden');

    render();

    setTimeout(() => {
        shoe = shoe.slice(burn + 1);
        shoeStats.used = burn + 1;
        gameState = 'betting';
        el.initLabel.classList.add('hidden'); 
        if (dealMode === 'auto') startTimer();
        render();
    }, 1500);
}

function startTimer() {
    stopTimer(); 
    timer = autoInterval; 
    el.timer.textContent = timer;
    timerInt = setInterval(() => { 
        timer--; 
        el.timer.textContent = timer; 
        if (timer <= 0) {
            stopTimer();
            handleDeal(false); 
        }
    }, 1000);
}
function stopTimer() { clearInterval(timerInt); }

function handleDeal(instant) {
    if (gameState !== 'betting') return;
    if (shoe.length < 15) {
        alert("Shoe empty. Resetting shoe.");
        startNewShoe();
        return;
    }
    gameState = 'dealing'; 
    stopTimer(); 
    render();
    const { result, usedCards } = Game.playHand(shoe);
    
    const finalize = () => {
        lastResult = result; 
        history.push(result); 
        shoe = shoe.slice(usedCards);
        shoeStats.used += usedCards;
        
        let payout = 0;
        for (let target in currentBets) {
            const amt = currentBets[target];
            if (target === Game.BetTarget.Player && result.winner === Game.Winner.Player) payout += amt * 2;
            else if (target === Game.BetTarget.Banker && result.winner === Game.Winner.Banker) payout += amt * 1.95;
            else if (target === Game.BetTarget.Tie && result.winner === Game.Winner.Tie) payout += amt * 9;
            else if (result.winner === Game.Winner.Tie && (target === Game.BetTarget.Player || target === Game.BetTarget.Banker)) payout += amt;
            
            if (target === Game.BetTarget.PlayerPair && result.isPairPlayer) payout += amt * 12;
            if (target === Game.BetTarget.BankerPair && result.isPairBanker) payout += amt * 12;
        }
        
        if (payout > 0) showWinSplash(payout);
        balance += payout; 
        gameState = 'result'; 
        render();
        
        setTimeout(() => { 
            currentBets = {}; 
            gameState = 'betting'; 
            if (dealMode === 'auto') startTimer(); 
            render(); 
        }, dealMode === 'manual' ? 2000 : 3500);
    };

    if (instant) finalize(); 
    else setTimeout(finalize, 800);
}

function showWinSplash(amount) {
    const splash = document.createElement('div');
    splash.className = 'fixed inset-0 pointer-events-none z-[200] flex items-center justify-center overflow-hidden';
    splash.innerHTML = `
        <div class="animate-win-burst flex flex-col items-center">
            <div class="text-4xl md:text-8xl font-black uppercase tracking-tighter italic win-splash-text drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">Winner!</div>
            <div class="text-xl md:text-5xl font-black text-white mt-1 drop-shadow-lg">+$${amount.toLocaleString()}</div>
        </div>
    `;
    document.body.appendChild(splash);
    setTimeout(() => splash.remove(), 2500);
}

function clearBets() { 
    if (gameState === 'betting') { 
        for (let t in currentBets) balance += currentBets[t]; 
        currentBets = {}; 
        render(); 
    } 
}

function setupBettingAreas() {
    const areas = [
        { id: Game.BetTarget.PlayerPair, l: 'P.PAIR', odds: '11:1', c: 'bg-blue-900/40 text-blue-300' },
        { id: Game.BetTarget.Player, l: 'PLAYER', odds: '1:1', c: 'bg-blue-600/80 text-white font-black' },
        { id: Game.BetTarget.Tie, l: 'TIE', odds: '8:1', c: 'bg-green-700/80 text-white font-black' },
        { id: Game.BetTarget.Banker, l: 'BANKER', odds: '0.95:1', c: 'bg-red-600/80 text-white font-black' },
        { id: Game.BetTarget.BankerPair, l: 'B.PAIR', odds: '11:1', c: 'bg-red-900/40 text-red-300' }
    ];
    el.bettingAreas.innerHTML = areas.map(a => `
        <button id="area-${a.id.replace(/\s+/g,'')}" class="${a.c} rounded-lg flex flex-col items-center justify-center relative h-full border border-white/5 transition-transform active:scale-95">
            <span class="text-[6px] md:text-xs">${a.l}</span>
            <span class="text-[10px] md:text-xl">${a.odds}</span>
            <div class="chip hidden absolute -top-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-1 rounded-full text-[6px] md:text-[10px] font-bold border border-white shadow-sm"></div>
        </button>`).join('');
    
    areas.forEach(a => {
        const btn = document.getElementById(`area-${a.id.replace(/\s+/g,'')}`);
        btn.onclick = () => { 
            if (gameState === 'betting' && balance >= selectedChip) { 
                balance -= selectedChip; 
                currentBets[a.id] = (currentBets[a.id] || 0) + selectedChip; 
                render(); 
            } 
        };
        btn.oncontextmenu = (e) => {
            e.preventDefault();
            if (gameState === 'betting' && currentBets[a.id]) {
                balance += currentBets[a.id];
                delete currentBets[a.id];
                render();
            }
        };
    });
}

function setupChips() {
    el.chipSelection.innerHTML = '';
    [100, 200, 500].forEach(v => {
        const b = document.createElement('button'); 
        b.textContent = v;
        b.className = `w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-white/20 text-[7px] md:text-[10px] font-black transition-transform ${v===100?'bg-black':v===200?'bg-blue-600':'bg-purple-600'}`;
        b.onclick = () => { selectedChip = v; render(); };
        b.id = `chip-${v}`; 
        el.chipSelection.appendChild(b);
    });
}

function render() {
    el.balance.textContent = `$${balance.toLocaleString()}`;
    el.shoeCount.textContent = `${shoeStats.used}/416`;
    el.shoeProg.style.width = `${(shoeStats.used / 416) * 100}%`;
    
    renderCards(el.player, lastResult?.playerCards || []);
    renderCards(el.banker, lastResult?.bankerCards || []);
    el.pScore.textContent = lastResult?.playerScore ?? '0';
    el.bScore.textContent = lastResult?.bankerScore ?? '0';
    
    el.autoStatus.classList.toggle('hidden', !(gameState === 'betting' && dealMode === 'auto'));
    el.manualLabel.classList.toggle('hidden', !(gameState === 'betting' && dealMode === 'manual'));
    el.dealContainer.classList.toggle('hidden', !(gameState === 'betting' && dealMode === 'manual'));
    el.resLabel.classList.toggle('hidden', gameState !== 'result');
    
    if (gameState === 'result' && lastResult) {
        const w = lastResult.winner; 
        el.resLabel.textContent = w === Game.Winner.Player ? 'PLAYER' : w === Game.Winner.Banker ? 'BANKER' : 'TIE';
        el.resLabel.className = `text-center px-2 py-1 md:px-10 md:py-5 rounded-lg font-black text-[8px] md:text-3xl shadow-2xl ring-1 md:ring-2 ring-white/20 ${w===Game.Winner.Player?'bg-blue-600/90':w===Game.Winner.Banker?'bg-red-600/90':'bg-green-600/90'}`;
        
        if (w===Game.Winner.Player||w===Game.Winner.Tie) el.player.classList.add('animate-winner-flash','ring-2','ring-blue-500/50'); 
        else el.player.classList.remove('animate-winner-flash','ring-2','ring-blue-500/50');
        
        if (w===Game.Winner.Banker||w===Game.Winner.Tie) el.banker.classList.add('animate-winner-flash','ring-2','ring-red-500/50'); 
        else el.banker.classList.remove('animate-winner-flash','ring-2','ring-red-500/50');
    } else {
        el.player.className = el.player.className.replace(/animate-winner-flash|ring-2|ring-blue-500\/50/g, "");
        el.banker.className = el.banker.className.replace(/animate-winner-flash|ring-2|ring-red-500\/50/g, "");
    }
    
    [100,200,500].forEach(v => {
        const chip = document.getElementById(`chip-${v}`);
        if (chip) chip.style.borderColor = selectedChip === v ? '#facc15' : 'rgba(255,255,255,0.2)';
    });
    
    Object.values(Game.BetTarget).forEach(target => {
        const id = `area-${target.replace(/\s+/g,'')}`;
        const chipEl = document.querySelector(`#${id} .chip`);
        if (chipEl) { 
            if (currentBets[target]) { 
                chipEl.textContent = `$${currentBets[target]}`; 
                chipEl.classList.remove('hidden'); 
            } else {
                chipEl.classList.add('hidden'); 
            }
        }
    });
    
    updateModeUI();
    updateIntervalBtns();
    renderRoadmaps();
}

function renderCards(container, cards) {
    if (cards.length === 0) {
        container.innerHTML = '<div class="w-10 h-14 md:w-24 md:h-36 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white/10 text-xl">?</div>';
        return;
    }
    container.innerHTML = cards.map(c => `
        <div class="w-10 h-14 md:w-24 md:h-36 bg-white rounded shadow-lg flex flex-col p-1 transform">
            <div class="text-[8px] md:text-lg font-bold ${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}">${c.rank}</div>
            <div class="flex-grow flex items-center justify-center text-lg md:text-4xl ${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}">${c.suit}</div>
            <div class="text-[8px] md:text-lg font-bold self-end rotate-180 ${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}">${c.rank}</div>
        </div>`).join('');
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
    const g = document.getElementById(id); 
    if (!g) return; 
    g.innerHTML = '';
    for (let i=0; i < 6 * cols; i++) {
        const r = i % 6, c = Math.floor(i/6);
        const cell = document.createElement('div'); 
        cell.className = "roadmap-cell border-[0.1px] border-white/5 h-full w-full";
        cell.innerHTML = isFlat ? (data[i] ? renderer(data[i]) : '') : (data[r] && data[r][c] ? renderer(data[r][c]) : ''); 
        g.appendChild(cell);
    }
}

function renderDerived(id, big, path, off, type) {
    const m = Game.generateDerivedRoad(big, path, off);
    renderGrid(id, m, 60, (c) => c ? `<div class="${type==='circle'?'w-1.5 h-1.5 md:w-2 md:h-2 rounded-full border':type==='dot'?'w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-current':'w-[1px] h-[70%] rotate-45 bg-current'} ${c==='red'?'border-red-500 text-red-500':'border-blue-500 text-blue-500'}"></div>` : '');
}

init();