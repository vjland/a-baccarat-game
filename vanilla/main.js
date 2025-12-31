
import * as Game from './logic.js';

// --- State ---
let shoe = [];
let history = [];
let balance = 10000;
let currentBets = {};
let gameState = 'initializing';
let dealMode = 'manual';
let autoInterval = 10;
let selectedChip = 100;
let timer = 10;
let timerInterval = null;
let shoeStats = { total: 416, used: 0 };
let lastResult = null;

// --- DOM Elements ---
const elements = {
    balance: document.getElementById('balance-display'),
    shoeProgress: document.getElementById('shoe-progress'),
    shoeCount: document.getElementById('shoe-count'),
    playerCards: document.getElementById('player-cards'),
    bankerCards: document.getElementById('banker-cards'),
    playerScore: document.getElementById('player-score'),
    bankerScore: document.getElementById('banker-score'),
    initializingLabel: document.getElementById('initializing-label'),
    burnValue: document.getElementById('burn-value'),
    resultLabel: document.getElementById('result-label'),
    timerDisplay: document.getElementById('timer-display'),
    autoStatus: document.getElementById('auto-status'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    settingsClose: document.getElementById('settings-close'),
    modeAuto: document.getElementById('mode-auto'),
    modeManual: document.getElementById('mode-manual'),
    intervalContainer: document.getElementById('interval-container'),
    bettingAreas: document.getElementById('betting-areas'),
    chipSelection: document.getElementById('chip-selection'),
    dealBtn: document.getElementById('deal-btn'),
    dealBtnContainer: document.getElementById('deal-button-container'),
    newShoeBtn: document.getElementById('new-shoe-btn'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    modalContainer: document.getElementById('modal-container'),
    modalConfirm: document.getElementById('modal-confirm'),
    modalCancel: document.getElementById('modal-cancel'),
    modalMessage: document.getElementById('modal-message'),
    intervalSelector: document.getElementById('interval-selector'),
    // Roadmaps
    beadPlate: document.getElementById('bead-plate'),
    bigRoad: document.getElementById('big-road'),
    bigEyeBoy: document.getElementById('big-eye-boy'),
    smallRoad: document.getElementById('small-road'),
    cockroachRoad: document.getElementById('cockroach-road'),
};

const CHIP_VALUES = [100, 200, 500];

// --- Initialization ---
function init() {
    setupBettingAreas();
    setupChips();
    attachEventListeners();
    startNewShoe();
}

function attachEventListeners() {
    elements.settingsBtn.addEventListener('click', () => elements.settingsPanel.classList.add('open'));
    elements.settingsClose.addEventListener('click', () => elements.settingsPanel.classList.remove('open'));
    
    elements.modeAuto.addEventListener('click', () => setMode('auto'));
    elements.modeManual.addEventListener('click', () => setMode('manual'));

    elements.dealBtn.addEventListener('click', () => handleDeal(true));
    elements.newShoeBtn.addEventListener('click', () => {
        elements.modalMessage.textContent = "Restart training? Your bankroll will be reset to $10,000 and the shoe will be reshuffled.";
        elements.modalContainer.classList.remove('hidden');
    });
    elements.modalCancel.addEventListener('click', () => elements.modalContainer.classList.add('hidden'));
    elements.modalConfirm.addEventListener('click', () => {
        elements.modalContainer.classList.add('hidden');
        startNewShoe();
    });
    if (elements.clearAllBtn) elements.clearAllBtn.addEventListener('click', clearAllBets);
    
    if (elements.intervalSelector) {
        elements.intervalSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.interval-btn');
            if (btn) {
                autoInterval = parseInt(btn.dataset.interval);
                elements.intervalSelector.querySelectorAll('.interval-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (gameState === 'betting' && dealMode === 'auto') startTimer();
            }
        });
    }
}

function setMode(mode) {
    dealMode = mode;
    elements.modeAuto.className = `flex-1 py-2 rounded-md text-xs font-black uppercase transition-all ${mode === 'auto' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-neutral-500'}`;
    elements.modeManual.className = `flex-1 py-2 rounded-md text-xs font-black uppercase transition-all ${mode === 'manual' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-neutral-500'}`;
    
    if (mode === 'auto') {
        elements.intervalContainer.classList.remove('opacity-40', 'pointer-events-none');
        elements.autoStatus.classList.remove('hidden');
        if (gameState === 'betting') startTimer();
    } else {
        elements.intervalContainer.classList.add('opacity-40', 'pointer-events-none');
        elements.autoStatus.classList.add('hidden');
        stopTimer();
    }
    render();
}

function startNewShoe() {
    // Clear all history and logic
    history = [];
    lastResult = null;
    currentBets = {};
    balance = 10000;
    gameState = 'initializing';
    stopTimer();

    shoe = Game.createShoe(8);
    const burn = shoe[0].value === 0 ? 10 : shoe[0].value;
    
    elements.initializingLabel.classList.remove('hidden');
    elements.resultLabel.classList.add('hidden');
    elements.burnValue.textContent = burn;
    
    // Clear roadmap visuals immediately
    render();

    setTimeout(() => {
        shoe = shoe.slice(burn + 1);
        shoeStats.used = burn + 1;
        gameState = 'betting';
        elements.initializingLabel.classList.add('hidden');
        elements.resultLabel.classList.remove('hidden');
        if (dealMode === 'auto') startTimer();
        render();
    }, 1500);
}

function startTimer() {
    stopTimer();
    timer = autoInterval;
    elements.timerDisplay.textContent = timer;
    timerInterval = setInterval(() => {
        timer--;
        elements.timerDisplay.textContent = timer;
        if (timer <= 0) {
            stopTimer();
            handleDeal(false);
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function handleDeal(instant = false) {
    if (gameState !== 'betting') return;
    if (shoe.length < 15) {
        elements.modalMessage.textContent = "The shoe is empty. Reshuffle and start a new training session?";
        elements.modalContainer.classList.remove('hidden');
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
        for (const [target, amt] of Object.entries(currentBets)) {
            if (target === Game.BetTarget.Player && result.winner === Game.Winner.Player) payout += amt * 2;
            if (target === Game.BetTarget.Banker && result.winner === Game.Winner.Banker) payout += amt * 1.95;
            if (target === Game.BetTarget.Tie && result.winner === Game.Winner.Tie) payout += amt * 9;
            if (result.winner === Game.Winner.Tie && (target === Game.BetTarget.Player || target === Game.BetTarget.Banker)) payout += amt;
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
        }, dealMode === 'manual' ? 1000 : 4000);
    };
    if (instant) finalize(); else setTimeout(finalize, 1000);
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

function render() {
    if (elements.balance) elements.balance.textContent = `$${balance.toLocaleString()}`;
    if (elements.shoeCount) elements.shoeCount.textContent = `${shoeStats.used}/${shoeStats.total}`;
    if (elements.shoeProgress) elements.shoeProgress.style.width = `${(shoeStats.used / shoeStats.total) * 100}%`;
    renderCards(elements.playerCards, lastResult?.playerCards || []);
    renderCards(elements.bankerCards, lastResult?.bankerCards || []);
    elements.playerScore.textContent = lastResult?.playerScore ?? '0';
    elements.bankerScore.textContent = lastResult?.bankerScore ?? '0';

    // Flash winner hands
    elements.playerCards.className = elements.playerCards.className.replace(/animate-winner-flash|ring-4|ring-blue-500\/50|ring-green-500\/50/g, "").trim();
    elements.bankerCards.className = elements.bankerCards.className.replace(/animate-winner-flash|ring-4|ring-red-500\/50|ring-green-500\/50/g, "").trim();

    if (lastResult && gameState === 'result') {
        elements.resultLabel.textContent = lastResult.winner === Game.Winner.Tie ? 'TIE' : lastResult.winner === Game.Winner.Player ? 'PLAYER' : 'BANKER';
        let baseClasses = "text-center px-4 py-2 rounded-lg font-black text-xs md:text-lg transition-all shadow-xl ring-1 ring-white/10 ";
        if (lastResult.winner === Game.Winner.Player) {
          elements.resultLabel.className = baseClasses + "bg-blue-600/80 shadow-blue-600/20";
          elements.playerCards.className += " animate-winner-flash ring-4 ring-blue-500/50";
        }
        else if (lastResult.winner === Game.Winner.Banker) {
          elements.resultLabel.className = baseClasses + "bg-red-600/80 shadow-red-600/20";
          elements.bankerCards.className += " animate-winner-flash ring-4 ring-red-500/50";
        }
        else {
          elements.resultLabel.className = baseClasses + "bg-green-600/80 shadow-green-600/20";
          elements.playerCards.className += " animate-winner-flash ring-4 ring-green-500/50";
          elements.bankerCards.className += " animate-winner-flash ring-4 ring-green-500/50";
        }
    } else {
        elements.resultLabel.textContent = '...';
        elements.resultLabel.className = 'text-center px-4 py-2 rounded-lg font-black text-xs md:text-lg transition-all shadow-xl ring-1 ring-white/10 bg-white/5 text-white/20';
    }

    elements.dealBtnContainer.style.display = (dealMode === 'manual' && gameState === 'betting') ? 'block' : 'none';
    updateBettingAreas();
    updateChips();
    renderRoadmaps();
}

function renderCards(container, cards) {
    if (!container) return;
    container.innerHTML = '';
    if (cards.length === 0) {
        container.innerHTML = '<div class="w-12 h-16 md:w-16 md:h-24 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-white/20">?</div>';
        return;
    }
    cards.forEach(card => {
        const isRed = card.suit === Game.Suit.Hearts || card.suit === Game.Suit.Diamonds;
        const cardEl = document.createElement('div');
        cardEl.className = 'w-12 h-16 md:w-16 md:h-24 bg-white rounded-md shadow-xl flex flex-col p-1 transition-all transform hover:-translate-y-1';
        cardEl.innerHTML = `
            <div class="text-[10px] md:text-sm font-bold leading-none ${isRed ? 'text-red-600' : 'text-black'}">${card.rank}</div>
            <div class="flex-grow flex items-center justify-center text-lg md:text-2xl ${isRed ? 'text-red-600' : 'text-black'}">${card.suit}</div>
            <div class="text-[10px] md:text-sm font-bold leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-black'}">${card.rank}</div>
        `;
        container.appendChild(cardEl);
    });
}

function setupBettingAreas() {
    const areas = [
        { id: Game.BetTarget.PlayerPair, label: 'PLAYER PAIR', odds: '11:1', bgClass: 'bg-blue-900/40', textClass: 'text-blue-300', large: false },
        { id: Game.BetTarget.Player, label: 'PLAYER', odds: '1:1', bgClass: 'bg-blue-600/80', textClass: 'text-white', large: true },
        { id: Game.BetTarget.Tie, label: 'TIE', odds: '8:1', bgClass: 'bg-green-700/80', textClass: 'text-white', large: true },
        { id: Game.BetTarget.Banker, label: 'BANKER', odds: '0.95:1', bgClass: 'bg-red-600/80', textClass: 'text-white', large: true },
        { id: Game.BetTarget.BankerPair, label: 'BANKER PAIR', odds: '11:1', bgClass: 'bg-red-900/40', textClass: 'text-red-300', large: false },
    ];
    if (!elements.bettingAreas) return;
    elements.bettingAreas.innerHTML = '';
    areas.forEach(area => {
        const btn = document.createElement('button');
        btn.id = `bet-${area.id.replace(/\s+/g, '-')}`;
        btn.className = `relative rounded-lg border-2 border-white/10 flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg ${area.bgClass}`;
        btn.innerHTML = `<span class="${area.large ? 'text-sm font-black' : 'text-[10px] font-bold'} ${area.textClass} tracking-widest uppercase">${area.label}</span><span class="${area.large ? 'text-xl font-black' : 'text-sm font-bold'} text-white">${area.odds}</span><div id="chip-on-${area.id.replace(/\s+/g, '-')}" class="hidden absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-xs font-bold border-2 border-white shadow-md z-30">$0</div>`;
        btn.addEventListener('click', () => placeBet(area.id));
        btn.addEventListener('contextmenu', (e) => { e.preventDefault(); clearSpecificBet(area.id); });
        elements.bettingAreas.appendChild(btn);
    });
}

function placeBet(target) {
    if (gameState !== 'betting') return;
    if (balance < selectedChip) return;
    balance -= selectedChip;
    currentBets[target] = (currentBets[target] || 0) + selectedChip;
    render();
}

function clearSpecificBet(target) {
    if (gameState !== 'betting') return;
    const amount = currentBets[target] || 0;
    if (amount === 0) return;
    balance += amount;
    delete currentBets[target];
    render();
}

function clearAllBets() {
    if (gameState !== 'betting') return;
    let totalBet = 0;
    for (const amt of Object.values(currentBets)) totalBet += amt;
    if (totalBet === 0) return;
    balance += totalBet;
    currentBets = {};
    render();
}

function updateBettingAreas() {
    Object.values(Game.BetTarget).forEach(target => {
        const chipEl = document.getElementById(`chip-on-${target.replace(/\s+/g, '-')}`);
        if (chipEl) {
            if (currentBets[target]) { chipEl.textContent = `$${currentBets[target]}`; chipEl.classList.remove('hidden'); }
            else chipEl.classList.add('hidden');
        }
    });
}

function setupChips() {
    if (!elements.chipSelection) return;
    elements.chipSelection.innerHTML = '';
    CHIP_VALUES.forEach(val => {
        const chip = document.createElement('button');
        let colorClass = val === 100 ? 'bg-black text-white border-neutral-700' : val === 200 ? 'bg-blue-600 text-white border-blue-400' : 'bg-purple-600 text-white border-purple-400';
        chip.className = "w-10 h-10 md:w-14 md:h-14 rounded-full border-4 flex items-center justify-center font-black text-[10px] md:text-sm transition-all hover:scale-110 shadow-xl " + colorClass;
        chip.id = `chip-${val}`;
        chip.textContent = val;
        chip.addEventListener('click', () => { selectedChip = val; updateChips(); });
        elements.chipSelection.appendChild(chip);
    });
    updateChips();
}

function updateChips() {
    CHIP_VALUES.forEach(val => {
        const chip = document.getElementById(`chip-${val}`);
        if (chip) {
            if (selectedChip === val) { chip.classList.add('scale-110', 'ring-4', 'ring-yellow-400/40', 'z-10'); chip.style.borderColor = "#facc15"; }
            else { chip.classList.remove('scale-110', 'ring-4', 'ring-yellow-400/40', 'z-10'); chip.style.borderColor = val === 100 ? "#404040" : val === 200 ? "#60a5fa" : "#c084fc"; }
        }
    });
}

function renderRoadmaps() {
    const { matrix: bigMatrix, path } = Game.generateBigRoad(history);
    if (elements.beadPlate) renderGrid(elements.beadPlate, 15, 'w-5 h-5 md:w-6 md:h-6', (r, c) => {
        const res = history[c * 6 + r];
        if (!res) return '';
        const color = res.winner === Game.Winner.Banker ? 'bg-red-600' : res.winner === Game.Winner.Player ? 'bg-blue-600' : 'bg-green-600';
        return `<div class="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white shadow-sm ${color}">${res.winner === Game.Winner.Banker ? '庄' : res.winner === Game.Winner.Player ? '闲' : '和'}${res.isPairBanker ? '<div class="absolute top-0 right-0 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-red-400 border border-white"></div>' : ''}${res.isPairPlayer ? '<div class="absolute bottom-0 left-0 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-blue-400 border border-white"></div>' : ''}</div>`;
    });
    if (elements.bigRoad) renderGrid(elements.bigRoad, 100, 'w-4 h-4 md:w-5 md:h-5', (r, c) => {
        const cell = bigMatrix[r][c];
        if (!cell) return '';
        const border = cell.winner === Game.Winner.Banker ? 'border-red-500' : cell.winner === Game.Winner.Player ? 'border-blue-500' : 'border-green-500';
        return `<div class="w-3 h-3 md:w-4 md:h-4 rounded-full border-[1.5px] flex items-center justify-center relative ${border}">${cell.ties > 0 ? '<div class="absolute w-full h-[1.5px] bg-green-500 rotate-45 pointer-events-none opacity-80"></div>' : ''}${cell.ties > 1 ? `<span class="text-[7px] font-bold text-green-500 z-10 leading-none">${cell.ties}</span>` : ''}</div>`;
    });
    const bebMatrix = Game.generateDerivedRoad(bigMatrix, path, 1);
    renderDerivedGrid(elements.bigEyeBoy, bebMatrix, 60, 'beb');
    const smMatrix = Game.generateDerivedRoad(bigMatrix, path, 2);
    renderDerivedGrid(elements.smallRoad, smMatrix, 60, 'sm');
    const crMatrix = Game.generateDerivedRoad(bigMatrix, path, 3);
    renderDerivedGrid(elements.cockroachRoad, crMatrix, 60, 'cr');
}

function renderDerivedGrid(container, matrix, cols, type) {
    if (!container) return;
    renderGrid(container, cols, 'w-3 h-3 md:w-[14px] md:h-[14px]', (r, c) => {
        const color = matrix[r][c];
        if (!color) return '';
        if (type === 'beb') return `<div class="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border-[1.5px] ${color === 'red' ? 'border-red-500' : 'border-blue-500'}"></div>`;
        if (type === 'sm') return `<div class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}"></div>`;
        return `<div class="w-[1.5px] h-[70%] rotate-45 ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}"></div>`;
    });
}

function renderGrid(container, cols, cellSize, cellRenderer) {
    if (!container) return;
    container.innerHTML = '';
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < 6; r++) {
            const cell = document.createElement('div');
            cell.className = `${cellSize} roadmap-cell border-[0.5px] border-neutral-800/30`;
            cell.innerHTML = cellRenderer(r, c);
            container.appendChild(cell);
        }
    }
}

init();
