
import * as Game from './logic.js';

let shoe = [], 
    history = [], 
    balance = 1000, 
    currentBets = {}, 
    gameState = 'initializing', 
    dealMode = 'manual', 
    autoInterval = 5, 
    selectedChip = 5, 
    timer = 5, 
    timerInt = null, 
    lastResult = null;

const el = {
    playerContainer: document.getElementById('player-hand-container'),
    bankerContainer: document.getElementById('banker-hand-container'),
    player: document.getElementById('player-cards'),
    banker: document.getElementById('banker-cards'),
    pScore: document.getElementById('player-score'),
    bScore: document.getElementById('banker-score'),
    autoStatus: document.getElementById('auto-status'),
    timer: document.getElementById('timer-display'),
    balance: document.getElementById('balance-display'),
    totalBet: document.getElementById('total-bet-display'),
    bettingAreas: document.getElementById('betting-areas'),
    chipSelection: document.getElementById('chip-selection'),
    dealBtn: document.getElementById('deal-btn'),
    dealContainer: document.getElementById('deal-button-container'),
    settingsPanel: document.getElementById('settings-panel'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsClose: document.getElementById('settings-close'),
    modeAuto: document.getElementById('mode-auto'),
    autoToggleKnob: document.getElementById('auto-toggle-knob'),
    intervalPanel: document.getElementById('interval-panel'),
    intervalBtns: document.getElementById('interval-btns'),
    initLabel: document.getElementById('initializing-label'),
    burnValue: document.getElementById('burn-value'),
    bigRoad: document.getElementById('big-road'),
    bigEye: document.getElementById('big-eye-boy'),
    smallRoad: document.getElementById('small-road'),
    cockroach: document.getElementById('cockroach-road'),
    statsCount: document.getElementById('shoe-count'),
    statsP: document.getElementById('stats-p'),
    statsB: document.getElementById('stats-b'),
    statsT: document.getElementById('stats-t')
};

function init() {
    setupBettingAreas();
    setupChips();
    attachEventListeners();
    startNewShoe();
}

function attachEventListeners() {
    el.settingsBtn.onclick = () => el.settingsPanel.classList.remove('hidden');
    el.settingsClose.onclick = () => el.settingsPanel.classList.add('hidden');
    el.modeAuto.onclick = () => setMode(dealMode === 'auto' ? 'manual' : 'auto');
    el.dealBtn.onclick = () => handleDeal();
    document.getElementById('reset-shoe-btn').onclick = () => { startNewShoe(); el.settingsPanel.classList.add('hidden'); };
    el.clearBtn = document.getElementById('clear-btn');
    el.clearBtn.onclick = clearBets;
    
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
    const isAuto = dealMode === 'auto';
    el.modeAuto.className = `w-14 h-8 rounded-full transition-colors relative ${isAuto ? 'bg-green-500' : 'bg-neutral-800'}`;
    el.autoToggleKnob.className = `absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isAuto ? 'left-7' : 'left-1'}`;
    el.intervalPanel.style.opacity = isAuto ? '1' : '0.4';
    el.intervalPanel.style.pointerEvents = isAuto ? 'auto' : 'none';
    el.autoStatus.classList.toggle('hidden', !isAuto || gameState !== 'betting');
}

function updateIntervalBtns() {
    Array.from(el.intervalBtns.children).forEach(btn => {
        const isActive = parseInt(btn.dataset.sec) === autoInterval;
        btn.className = `py-3 rounded-xl font-black transition-all border ${isActive ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-black/40 border-white/5 text-white'}`;
    });
}

function startNewShoe() {
    shoe = Game.createShoe(8); 
    history = []; 
    balance = 1000; 
    currentBets = {}; 
    lastResult = null;
    gameState = 'initializing';
    
    stopTimer();
    const burn = shoe[0].value || 10;
    el.initLabel.classList.remove('hidden'); 
    el.burnValue.textContent = burn;

    render();

    setTimeout(() => {
        shoe = shoe.slice(burn + 1);
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
            handleDeal(); 
        }
    }, 1000);
}
function stopTimer() { clearInterval(timerInt); }

function handleDeal() {
    if (gameState !== 'betting') return;
    gameState = 'dealing'; 
    stopTimer(); 
    render();
    const { result, usedCards } = Game.playHand(shoe);
    
    setTimeout(() => {
        lastResult = result; 
        history.push(result); 
        shoe = shoe.slice(usedCards);
        
        let payout = 0;
        for (let target in currentBets) {
            const amt = currentBets[target];
            if (target === Game.BetTarget.Player && result.winner === Game.Winner.Player) payout += amt * 2;
            else if (target === Game.BetTarget.Banker && result.winner === Game.Winner.Banker) payout += amt * 2;
            else if (result.winner === Game.Winner.Tie) payout += amt;
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
        }, 3000);
    }, 800);
}

function showWinSplash(amount) {
    const splash = document.createElement('div');
    splash.className = 'fixed inset-0 pointer-events-none z-[200] flex items-center justify-center overflow-hidden';
    splash.innerHTML = `
        <div class="animate-win-burst flex flex-col items-center">
            <div class="text-6xl md:text-8xl font-black uppercase tracking-tighter italic win-splash-text drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">Winner!</div>
            <div class="text-3xl md:text-5xl font-black text-white mt-2 drop-shadow-lg">+$${amount.toLocaleString()}</div>
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
        { id: Game.BetTarget.Player, label: '闲家', color: 'bg-[#1565c0]' },
        { id: Game.BetTarget.Banker, label: '庄家', color: 'bg-[#c62828]' }
    ];
    el.bettingAreas.innerHTML = areas.map(a => `
        <button id="area-${a.id}" class="relative flex-1 flex flex-col items-center justify-center p-2 md:p-4 rounded-xl border border-white/10 transition-all active:scale-95 shadow-lg ${a.color} text-white">
            <span class="text-lg md:text-2xl font-black uppercase tracking-tighter">${a.label}</span>
            <span class="text-[10px] font-bold opacity-60">1:1</span>
            <div class="chip hidden absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="bg-white text-black font-black text-[10px] w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 md:border-4 border-yellow-500 shadow-2xl scale-125 z-10"></div>
            </div>
        </button>`).join('');
    
    areas.forEach(a => {
        const btn = document.getElementById(`area-${a.id}`);
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
    [5, 10, 20, 50].forEach(val => {
        const btn = document.createElement('button');
        btn.textContent = val;
        btn.id = `chip-${val}`;
        btn.className = `w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center font-black text-[10px] md:text-sm transition-all shadow-md`;
        btn.onclick = () => { selectedChip = val; render(); };
        el.chipSelection.appendChild(btn);
    });
}

function render() {
    el.balance.textContent = `$${balance.toLocaleString()}`;
    const totalBet = Object.values(currentBets).reduce((a, b) => a + b, 0);
    el.totalBet.textContent = `$${totalBet.toLocaleString()}`;
    
    renderCards(el.player, lastResult?.playerCards);
    renderCards(el.banker, lastResult?.bankerCards);
    el.pScore.textContent = lastResult?.playerScore ?? '0';
    el.bScore.textContent = lastResult?.bankerScore ?? '0';
    
    el.dealContainer.classList.toggle('hidden', !(gameState === 'betting' && dealMode === 'manual'));
    
    if (gameState === 'result' && lastResult) {
        const isPWin = lastResult.winner === Game.Winner.Player || lastResult.winner === Game.Winner.Tie;
        const isBWin = lastResult.winner === Game.Winner.Banker || lastResult.winner === Game.Winner.Tie;
        
        el.playerContainer.classList.toggle('animate-winner-flash', isPWin);
        el.bankerContainer.classList.toggle('animate-winner-flash', isBWin);
    } else {
        el.playerContainer.classList.remove('animate-winner-flash');
        el.bankerContainer.classList.remove('animate-winner-flash');
    }
    
    [5, 10, 20, 50].forEach(v => {
        const chip = document.getElementById(`chip-${v}`);
        if (chip) {
            chip.className = `w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center font-black text-[10px] md:text-sm transition-all shadow-md ${selectedChip === v ? 'scale-110 border-yellow-400 bg-white text-black z-10' : 'border-white/10 bg-black/40 text-neutral-400 opacity-60'}`;
        }
    });
    
    [Game.BetTarget.Player, Game.BetTarget.Banker].forEach(target => {
        const chipContainer = document.querySelector(`#area-${target} .chip`);
        const chipText = chipContainer.querySelector('div');
        if (currentBets[target]) {
            chipText.textContent = `$${currentBets[target]}`;
            chipContainer.classList.remove('hidden');
        } else {
            chipContainer.classList.add('hidden');
        }
    });
    
    updateModeUI();
    updateIntervalBtns();
    renderRoadmaps();
}

function renderCards(container, cards) {
    if (!cards) {
        container.innerHTML = `
            <div class="flex gap-2">
                <div class="w-12 md:w-32 aspect-[2.5/3.5] bg-white/5 border border-white/10 rounded-lg shadow-inner"></div>
                <div class="w-12 md:w-32 aspect-[2.5/3.5] bg-white/5 border border-white/10 rounded-lg shadow-inner"></div>
            </div>
            <div class="w-12 md:w-32 aspect-[2.5/3.5] bg-transparent"></div>
        `;
        return;
    }

    const row1 = cards.slice(0, 2).map(c => `
        <div class="w-12 h-auto aspect-[2.5/3.5] md:w-32 bg-white rounded-lg shadow-2xl flex flex-col p-1.5 md:p-2 transition-all border border-neutral-300">
            <div class="text-sm md:text-3xl font-bold leading-none text-black/90">
                <span class="${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}">${c.rank}</span>
            </div>
            <div class="flex-grow flex items-center justify-center text-2xl md:text-7xl ${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}">${c.suit}</div>
            <div class="text-sm md:text-3xl font-bold leading-none self-end rotate-180 text-black/90">
                <span class="${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}">${c.rank}</span>
            </div>
        </div>
    `).join('');

    const row2 = cards[2] ? `
        <div class="w-12 h-auto aspect-[2.5/3.5] md:w-32 bg-white rounded-lg shadow-2xl flex flex-col p-1.5 md:p-2 transition-all border border-neutral-300">
            <div class="text-sm md:text-3xl font-bold leading-none text-black/90">
                <span class="${cards[2].suit==='♥'||cards[2].suit==='♦'?'text-red-600':'text-black'}">${cards[2].rank}</span>
            </div>
            <div class="flex-grow flex items-center justify-center text-2xl md:text-7xl ${cards[2].suit==='♥'||cards[2].suit==='♦'?'text-red-600':'text-black'}">${cards[2].suit}</div>
            <div class="text-sm md:text-3xl font-bold leading-none self-end rotate-180 text-black/90">
                <span class="${cards[2].suit==='♥'||cards[2].suit==='♦'?'text-red-600':'text-black'}">${cards[2].rank}</span>
            </div>
        </div>
    ` : `<div class="w-12 md:w-32 aspect-[2.5/3.5] bg-transparent"></div>`;

    container.innerHTML = `
        <div class="flex gap-2">${row1}</div>
        <div class="flex justify-center">${row2}</div>
    `;
}

function renderRoadmaps() {
    const { matrix: bigRoadMatrix, path } = Game.generateBigRoad(history);
    const bigEyeMatrix = Game.generateDerivedRoad(bigRoadMatrix, path, 1);
    const smallRoadMatrix = Game.generateDerivedRoad(bigRoadMatrix, path, 2);
    const cockroachMatrix = Game.generateDerivedRoad(bigRoadMatrix, path, 3);

    el.statsCount.textContent = `#${history.length}`;
    el.statsP.textContent = history.filter(h => h.winner === Game.Winner.Player).length;
    el.statsB.textContent = history.filter(h => h.winner === Game.Winner.Banker).length;
    el.statsT.textContent = history.filter(h => h.winner === Game.Winner.Tie).length;

    renderGrid(el.bigRoad, bigRoadMatrix, 100, "w-2.5 h-2.5 md:w-4 md:h-4", (cell) => cell && `
        <div class="w-[95%] h-[95%] rounded-full border-[1.2px] md:border-[1.8px] relative
          ${cell.winner === 'B' ? 'border-[#ff4d4d]' : cell.winner === 'P' ? 'border-[#4d94ff]' : 'border-[#4ade80]'}">
          ${cell.ties > 0 ? '<div class="absolute w-full h-[0.5px] bg-[#4ade80] rotate-45"></div>' : ''}
          ${cell.ties > 1 ? `<span class="absolute inset-0 flex items-center justify-center text-[5px] md:text-[7px] font-black text-green-300">${cell.ties}</span>` : ''}
        </div>
    `);

    renderGrid(el.bigEye, bigEyeMatrix, 200, "w-1.5 h-1.5 md:w-2 md:h-2", (color) => color && `
        <div class="w-[95%] h-[95%] rounded-full border-[0.8px] ${color === 'red' ? 'border-red-500' : 'border-blue-500'}"></div>
    `);

    renderGrid(el.smallRoad, smallRoadMatrix, 200, "w-1.5 h-1.5 md:w-2 md:h-2", (color) => color && `
        <div class="w-[95%] h-[95%] rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}"></div>
    `);

    renderGrid(el.cockroach, cockroachMatrix, 200, "w-1.5 h-1.5 md:w-2 md:h-2", (color) => color && `
        <div class="w-[1px] h-[90%] rotate-45 ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}"></div>
    `);
}

function renderGrid(container, matrix, cols, cellSize, renderer) {
    container.innerHTML = '';
    const totalCells = 6 * cols;
    for (let i = 0; i < totalCells; i++) {
        const r = i % 6, c = Math.floor(i / 6);
        const cell = document.createElement('div');
        cell.className = `${cellSize} flex items-center justify-center border-[0.1px] border-white/5 relative`;
        const content = renderer(matrix[r]?.[c]);
        if (content) cell.innerHTML = content;
        container.appendChild(cell);
    }
}

init();
