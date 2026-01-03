import { createShoe, playHand, Winner, BetTarget, generateBigRoad, generateDerivedRoad, Suit } from './logic.js';

// State
let shoe = [];
let history = [];
let balance = 10000;
let currentBets = new Map();
let gameState = 'initializing';
let lastRound = null;
let isAutoDeal = false;
let dealInterval = 5;
let countdown = 0;
let selectedChip = 100;

// Elements
const el = {
  playerHand: document.getElementById('player-hand'),
  bankerHand: document.getElementById('banker-hand'),
  playerCardsGrid: document.getElementById('player-cards-grid'),
  bankerCardsGrid: document.getElementById('banker-cards-grid'),
  playerLabel: document.getElementById('player-label'),
  bankerLabel: document.getElementById('banker-label'),
  dealButton: document.getElementById('deal-button'),
  openSettings: document.getElementById('open-settings'),
  closeSettings: document.getElementById('close-settings'),
  settingsModal: document.getElementById('settings-modal'),
  toggleAuto: document.getElementById('toggle-auto'),
  autoKnob: document.getElementById('auto-knob'),
  intervalConfig: document.getElementById('interval-config'),
  intervalBtns: document.querySelectorAll('.interval-btn'),
  autoIndicator: document.getElementById('auto-indicator'),
  countdownText: document.getElementById('countdown-text'),
  winSplashLayer: document.getElementById('win-splash-layer'),
  roadmapContainer: document.getElementById('roadmap-container'),
  bettingTableContainer: document.getElementById('betting-table-container'),
  initLabel: document.getElementById('initializing-label'),
  initMessage: document.getElementById('init-message'),
  resetContainer: document.getElementById('reset-container'),
  shoeEndOverlay: document.getElementById('shoe-end-overlay'),
  newShoeConfirmBtn: document.getElementById('new-shoe-confirm-btn')
};

// Initialization
function init() {
  startNewShoe(true);
  setupEventListeners();
  el.newShoeConfirmBtn.onclick = () => startNewShoe(true);
}

function startNewShoe(resetBalance = false) {
  history = [];
  lastRound = null;
  currentBets.clear();
  gameState = 'initializing';
  if (resetBalance) balance = 10000;
  
  el.shoeEndOverlay.classList.add('hidden');
  
  shoe = createShoe(8);
  const firstCard = shoe[0];
  const burnCount = firstCard.value === 0 ? 10 : firstCard.value;
  
  el.initMessage.textContent = `Burn Card: ${firstCard.rank}${firstCard.suit} - Discarding ${burnCount} cards`;
  el.initLabel.classList.remove('hidden');
  
  setTimeout(() => {
    shoe = shoe.slice(burnCount + 1);
    gameState = 'betting';
    el.initLabel.classList.add('hidden');
    if (isAutoDeal) {
      countdown = dealInterval;
      startAutoCountdown();
    }
    updateUI();
  }, 2500);
}

// Event Listeners
function setupEventListeners() {
  el.dealButton.onclick = handleDeal;
  el.openSettings.onclick = () => el.settingsModal.classList.remove('hidden');
  el.closeSettings.onclick = () => {
    el.settingsModal.classList.add('hidden');
    renderResetButton(); // Reset confirmation state
  };
  
  el.toggleAuto.onclick = () => {
    isAutoDeal = !isAutoDeal;
    el.toggleAuto.classList.toggle('bg-green-500', isAutoDeal);
    el.toggleAuto.classList.toggle('bg-neutral-800', !isAutoDeal);
    el.autoKnob.classList.toggle('left-7', isAutoDeal);
    el.autoKnob.classList.toggle('left-1', !isAutoDeal);
    el.intervalConfig.classList.toggle('opacity-40', !isAutoDeal);
    el.intervalConfig.classList.toggle('pointer-events-none', !isAutoDeal);
    
    if (isAutoDeal && gameState === 'betting') {
      countdown = dealInterval;
      startAutoCountdown();
    } else {
      el.autoIndicator.classList.add('hidden');
    }
    updateUI();
  };

  el.intervalBtns.forEach(btn => {
    btn.onclick = () => {
      const val = parseInt(btn.dataset.val);
      dealInterval = val;
      el.intervalBtns.forEach(b => {
        const isActive = parseInt(b.dataset.val) === val;
        b.classList.toggle('bg-yellow-500', isActive);
        b.classList.toggle('border-yellow-400', isActive);
        b.classList.toggle('text-black', isActive);
        b.classList.toggle('bg-black/40', !isActive);
        b.classList.toggle('border-white/5', !isActive);
        b.classList.toggle('text-white', !isActive);
      });
      if (isAutoDeal && gameState === 'betting') {
        countdown = dealInterval;
      }
    };
  });

  renderResetButton();
}

function renderResetButton() {
  el.resetContainer.innerHTML = `
    <button id="new-shoe-btn" class="w-full py-3 bg-red-600/10 border border-red-500/30 rounded-xl text-red-500 font-black uppercase tracking-widest hover:bg-red-600/20 transition-all">
        New Shoe & Reset Bankroll
    </button>
  `;
  document.getElementById('new-shoe-btn').onclick = () => {
    el.resetContainer.innerHTML = `
      <div class="flex gap-2">
          <button id="confirm-reset-btn" class="flex-1 py-3 bg-red-600 rounded-xl text-white font-black uppercase tracking-widest">
              Confirm?
          </button>
          <button id="cancel-reset-btn" class="flex-1 py-3 bg-neutral-700 rounded-xl text-white font-black uppercase tracking-widest">
              Cancel
          </button>
      </div>
    `;
    document.getElementById('confirm-reset-btn').onclick = () => {
      startNewShoe(true);
      el.settingsModal.classList.add('hidden');
      renderResetButton();
    };
    document.getElementById('cancel-reset-btn').onclick = renderResetButton;
  };
}

let countdownInterval = null;
function startAutoCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (!isAutoDeal || gameState !== 'betting') {
      clearInterval(countdownInterval);
      return;
    }
    countdown--;
    el.countdownText.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      handleDeal();
    }
  }, 1000);
}

function handleDeal() {
  if (gameState !== 'betting') return;
  gameState = 'dealing';
  updateUI();
  
  const { result, usedCards } = playHand(shoe);
  
  setTimeout(() => {
    lastRound = result;
    history.push(result);
    shoe = shoe.slice(usedCards);
    
    let payout = 0;
    currentBets.forEach((amt, target) => {
      if (target === BetTarget.Player && result.winner === Winner.Player) payout += amt * 2;
      if (target === BetTarget.Banker && result.winner === Winner.Banker) payout += amt * 2;
      if (result.winner === Winner.Tie) payout += amt;
    });

    if (payout > 0) showWinSplash(payout);
    balance += payout;
    gameState = 'result';
    updateUI();

    setTimeout(() => {
      currentBets.clear();
      if (shoe.length < 15) {
        gameState = 'shoeEnd';
        el.shoeEndOverlay.classList.remove('hidden');
      } else {
        gameState = 'betting';
        if (isAutoDeal) {
          countdown = dealInterval;
          startAutoCountdown();
        }
        updateUI();
      }
    }, 3000);
  }, 800);
}

function showWinSplash(amount) {
  const splash = document.createElement('div');
  splash.className = "fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden";
  splash.innerHTML = `
    <div class="animate-win-burst flex flex-col items-center">
      <div class="text-4xl md:text-8xl font-black uppercase tracking-tighter italic win-splash-text drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">Winner!</div>
      <div class="text-2xl md:text-5xl font-black text-white mt-1 md:mt-2 drop-shadow-lg">+$${amount.toLocaleString()}</div>
    </div>
  `;
  el.winSplashLayer.appendChild(splash);
  setTimeout(() => splash.remove(), 2500);
}

function createCardHTML(card) {
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  return `
    <div class="w-10 h-14 md:w-32 md:h-44 bg-white rounded-md md:rounded-lg shadow-xl flex flex-col p-1 md:p-2 transition-all border border-neutral-300">
      <div class="text-[10px] md:text-3xl font-bold leading-none text-black/90">
        <span class="${isRed ? 'text-red-600' : 'text-black'}">${card.rank}</span>
      </div>
      <div class="flex-grow flex items-center justify-center text-lg md:text-7xl ${isRed ? 'text-red-600' : 'text-black'}">${card.suit}</div>
      <div class="text-[10px] md:text-3xl font-bold leading-none self-end rotate-180 text-black/90">
        <span class="${isRed ? 'text-red-600' : 'text-black'}">${card.rank}</span>
      </div>
    </div>
  `;
}

function renderHand(container, cards) {
  if (!cards) {
    container.innerHTML = `
      <div class="flex gap-1 md:gap-2">
        <div class="w-10 h-14 md:w-32 md:h-44 bg-white/5 border border-white/10 rounded-md md:rounded-lg shadow-inner"></div>
        <div class="w-10 h-14 md:w-32 md:h-44 bg-white/5 border border-white/10 rounded-md md:rounded-lg shadow-inner"></div>
      </div>
      <div class="flex items-center justify-center h-14 md:h-46">
        <div class="w-10 h-14 md:w-32 md:h-44 bg-transparent"></div>
      </div>
    `;
    return;
  }
  
  const row1 = `<div class="flex gap-1 md:gap-2">${cards.slice(0, 2).map(createCardHTML).join('')}</div>`;
  const row2 = cards[2] 
    ? `<div class="w-10 h-14 md:w-32 md:h-44 flex items-center justify-center">${createCardHTML(cards[2])}</div>`
    : `<div class="w-10 h-14 md:w-32 md:h-44 bg-transparent"></div>`;
    
  container.innerHTML = `
    ${row1}
    <div class="flex items-center justify-center h-14 md:h-46">
      ${row2}
    </div>
  `;
}

function updateUI() {
  const isPWin = gameState === 'result' && (lastRound?.winner === Winner.Player || lastRound?.winner === Winner.Tie);
  const isBWin = gameState === 'result' && (lastRound?.winner === Winner.Banker || lastRound?.winner === Winner.Tie);

  renderHand(el.playerCardsGrid, lastRound?.playerCards);
  renderHand(el.bankerCardsGrid, lastRound?.bankerCards);
  
  el.playerLabel.textContent = `闲 ${lastRound?.playerScore ?? 0}`;
  el.bankerLabel.textContent = `庄 ${lastRound?.bankerScore ?? 0}`;
  
  el.playerHand.classList.toggle('animate-winner-flash', isPWin);
  el.bankerHand.classList.toggle('animate-winner-flash', isBWin);
  
  el.dealButton.classList.toggle('hidden', gameState !== 'betting' || isAutoDeal);
  el.autoIndicator.classList.toggle('hidden', !isAutoDeal || gameState !== 'betting');
  el.countdownText.textContent = countdown;
  
  renderRoadmap();
  renderBettingTable();
}

function renderRoadmap() {
  const { matrix: bigRoadMatrix, path } = generateBigRoad(history);
  const bigEyeMatrix = generateDerivedRoad(bigRoadMatrix, path, 1);
  const smallRoadMatrix = generateDerivedRoad(bigRoadMatrix, path, 2);
  const cockroachMatrix = generateDerivedRoad(bigRoadMatrix, path, 3);

  const stats = {
    total: history.length,
    p: history.filter(h => h.winner === Winner.Player).length,
    b: history.filter(h => h.winner === Winner.Banker).length,
    t: history.filter(h => h.winner === Winner.Tie).length,
  };

  const totalCards = 416; // 8 decks
  const shoeCount = shoe.length;
  const usedCount = totalCards - shoeCount;
  const progress = (usedCount / totalCards) * 100;

  let roadmapHTML = `
    <div class="flex flex-col w-full bg-[#050a0e] p-0 gap-0 h-full min-h-0 overflow-hidden">
      <div class="flex flex-col bg-black/80 border-b border-white/5 flex-shrink-0">
        <div class="flex items-center gap-3 px-2 py-1 text-[10px] md:text-xs font-black text-neutral-400 uppercase tracking-widest">
          <span class="text-yellow-400">#${stats.total} HANDS</span>
          <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#1565c0]"></span> ${stats.p}</div>
          <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#c62828]"></span> ${stats.b}</div>
          <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#2e7d32]"></span> ${stats.t}</div>
          <div class="ml-auto text-[9px] md:text-[10px] text-neutral-500 lowercase font-bold">
            ${usedCount} / ${shoeCount} cards
          </div>
        </div>
        <div class="w-full h-1 bg-white/5">
          <div class="h-full bg-blue-500 transition-all duration-700" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="flex flex-col flex-grow min-h-0 overflow-y-auto scrollbar-hide bg-[#0d161d]">
        <div class="border-b border-white/5">
          ${renderGrid(bigRoadMatrix, 100, 'w-2 h-2 md:w-4 md:h-4', 'bg-black/20', (cell) => cell && `
            <div class="w-[95%] h-[95%] rounded-full border-[1px] md:border-[1.8px] relative
              ${cell.winner === Winner.Banker ? 'border-[#ff4d4d]' : cell.winner === Winner.Player ? 'border-[#4d94ff]' : 'border-[#4ade80]'}">
              ${cell.ties > 0 ? '<div class="absolute w-full h-[0.5px] bg-[#4ade80] rotate-45"></div>' : ''}
              ${cell.ties > 1 ? `<span class="absolute inset-0 flex items-center justify-center text-[5px] md:text-[7px] font-black text-green-300">${cell.ties}</span>` : ''}
            </div>
          `)}
        </div>
        <div class="flex flex-col min-h-0">
          <div class="border-b border-white/5">
            ${renderGrid(bigEyeMatrix, 200, 'w-1.5 h-1.5 md:w-2 md:h-2', 'bg-black/10', (color) => color && `
              <div class="w-[95%] h-[95%] rounded-full border-[0.6px] md:border-[0.8px] ${color === 'red' ? 'border-red-500' : 'border-blue-500'}"></div>
            `)}
          </div>
          <div class="border-b border-white/5">
            ${renderGrid(smallRoadMatrix, 200, 'w-1.5 h-1.5 md:w-2 md:h-2', 'bg-black/10', (color) => color && `
              <div class="w-[95%] h-[95%] rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}"></div>
            `)}
          </div>
          <div>
            ${renderGrid(cockroachMatrix, 200, 'w-1.5 h-1.5 md:w-2 md:h-2', 'bg-black/10', (color) => color && `
              <div class="w-[1px] h-[90%] rotate-45 ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}"></div>
            `)}
          </div>
        </div>
      </div>
    </div>
  `;
  el.roadmapContainer.innerHTML = roadmapHTML;
}

function renderGrid(matrix, cols, cellSize, bg, renderCell) {
  let gridItems = '';
  for (let i = 0; i < 6 * cols; i++) {
    const r = i % 6, c = Math.floor(i / 6);
    const content = renderCell(matrix[r]?.[c], r, c) || '';
    gridItems += `<div class="${cellSize} flex items-center justify-center relative">${content}</div>`;
  }
  return `<div class="grid grid-rows-6 grid-flow-col ${bg} overflow-x-auto scrollbar-hide w-full content-start">${gridItems}</div>`;
}

function renderBettingTable() {
  const totalBet = Array.from(currentBets.values()).reduce((a, b) => a + b, 0);
  
  let html = `
    <div class="w-full bg-[#0f212e] p-2 md:p-3 flex flex-col gap-1 md:gap-4 rounded-t-2xl md:rounded-t-3xl shadow-inner border-t border-white/5">
      <div class="flex gap-2 h-16 md:h-32">
        ${renderBetArea(BetTarget.Player, '闲家', 'bg-[#1565c0] text-white')}
        ${renderBetArea(BetTarget.Banker, '庄家', 'bg-[#c62828] text-white')}
      </div>

      <div class="flex items-center justify-between px-1 md:px-2 pb-1 md:pb-4">
        <div class="flex flex-col items-start min-w-[50px]">
          <span class="text-[7px] md:text-[8px] text-neutral-500 uppercase font-bold tracking-widest">余额</span>
          <span class="text-xs md:text-lg font-black text-white">$${balance.toLocaleString()}</span>
        </div>

        <div class="flex gap-2 items-center">
           <button id="clear-all-bets" class="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-neutral-400 hover:text-white transition-colors">
              <i class="fas fa-undo text-[10px] md:text-xs"></i>
           </button>
          <div class="flex gap-1 md:gap-2 bg-black/20 p-1 rounded-full border border-white/5">
            ${[100, 200, 500, 1000].map(val => `
              <button
                data-chip="${val}"
                class="chip-btn w-7 h-7 md:w-12 md:h-12 rounded-full border flex items-center justify-center font-black text-[9px] md:text-sm transition-all shadow-md
                  ${selectedChip === val ? 'scale-110 border-yellow-400 bg-white text-black z-10' : 'border-white/10 bg-black/40 text-neutral-400 opacity-60'}
                "
              >
                ${val}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="flex flex-col items-end min-w-[50px]">
          <span class="text-[7px] md:text-[8px] text-neutral-500 uppercase font-bold tracking-widest">总下注</span>
          <span class="text-xs md:text-lg font-black text-yellow-500">$${totalBet.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;
  el.bettingTableContainer.innerHTML = html;

  // Re-attach internal listeners
  document.getElementById('clear-all-bets').onclick = () => {
    if (gameState !== 'betting') return;
    let total = 0;
    currentBets.forEach(amt => total += amt);
    balance += total;
    currentBets.clear();
    updateUI();
  };

  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.onclick = () => {
      selectedChip = parseInt(btn.dataset.chip);
      renderBettingTable();
    };
  });

  document.querySelectorAll('.bet-area-btn').forEach(btn => {
    const target = btn.dataset.target;
    btn.onclick = () => {
      if (gameState !== 'betting') return;
      if (balance < selectedChip) return;
      balance -= selectedChip;
      currentBets.set(target, (currentBets.get(target) || 0) + selectedChip);
      updateUI();
    };
    btn.oncontextmenu = (e) => {
      e.preventDefault();
      if (gameState !== 'betting') return;
      const amount = currentBets.get(target) || 0;
      balance += amount;
      currentBets.delete(target);
      updateUI();
    };
  });
}

function renderBetArea(target, label, colorClass) {
  const amount = currentBets.get(target) || 0;
  return `
    <button
      data-target="${target}"
      class="bet-area-btn relative flex-1 flex flex-col items-center justify-center p-1 md:p-4 rounded-xl border border-white/10 transition-all active:scale-95 shadow-lg ${colorClass}"
    >
      <span class="text-xs md:text-2xl font-black uppercase tracking-tighter">${label}</span>
      <span class="text-[8px] md:text-[10px] font-bold opacity-60">1:1</span>
      
      ${amount > 0 ? `
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="bg-white text-black font-black text-[9px] md:text-[10px] w-6 h-6 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 md:border-4 border-yellow-500 shadow-2xl scale-125 z-10">
            $${amount}
          </div>
        </div>
      ` : ''}
    </button>
  `;
}

// Start the app
init();