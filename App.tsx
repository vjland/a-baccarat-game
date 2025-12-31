
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, RoundResult, Winner, BetTarget, Suit } from './types';
import { createShoe, playHand } from './utils/baccaratLogic';
import { Roadmap } from './components/Roadmap';
import { BettingTable } from './components/BettingTable';

const INTERVALS = [1, 5, 10];

const WinSplash: React.FC<{ amount: number; onComplete: () => void }> = ({ amount, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
      <div className="animate-win-burst flex flex-col items-center">
        <div className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic win-splash-text drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]">
          Winner!
        </div>
        <div className="text-2xl md:text-5xl font-black text-white mt-1 drop-shadow-lg">
          +${amount.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

const CardUI: React.FC<{ card: Card; hidden?: boolean }> = ({ card, hidden }) => {
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  return (
    <div className={`w-14 h-20 md:w-28 md:h-40 bg-white rounded-lg shadow-lg flex flex-col p-1 md:p-2 transition-all transform ${hidden ? 'grayscale' : ''}`}>
      <div className={`text-[10px] md:text-xl font-bold leading-none ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.rank}
      </div>
      <div className={`flex-grow flex items-center justify-center text-xl md:text-5xl ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.suit}
      </div>
      <div className={`text-[10px] md:text-xl font-bold leading-none self-end rotate-180 ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.rank}
      </div>
    </div>
  );
};

const HandUI: React.FC<{ label: string; cards: Card[]; score: number | null; colorClass: string; isWinner: boolean; winColor: string }> = ({ label, cards, score, colorClass, isWinner, winColor }) => (
  <div className="flex flex-col items-center gap-1 flex-1 h-full justify-start">
    <h2 className={`${colorClass} font-black tracking-widest uppercase text-xs md:text-3xl`}>{label}</h2>
    <div className={`flex flex-wrap gap-1 p-2 md:p-6 bg-black/40 rounded-2xl border border-white/10 w-full justify-center transition-all min-h-[140px] md:min-h-[320px] items-center relative shadow-inner ${isWinner ? `animate-winner-flash ring-4 md:ring-8 ring-offset-2 md:ring-offset-4 ring-offset-black ${winColor}` : ''}`}>
      {cards.map((card, idx) => (
        <CardUI key={idx} card={card} />
      ))}
      {cards.length === 0 && <div className="w-14 h-20 md:w-28 md:h-40 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/20">?</div>}
    </div>
    <div className="mt-2 bg-black/80 px-4 py-1 md:px-8 md:py-2 rounded-full border border-white/20">
      <span className="text-xl md:text-5xl font-black text-white">{score !== null ? score : '0'}</span>
    </div>
  </div>
);

const ConfirmationModal: React.FC<{ isOpen: boolean; onConfirm: () => void; onCancel: () => void; message?: string }> = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-white/10 p-5 rounded-xl max-w-sm w-full shadow-2xl">
        <h2 className="text-lg font-black uppercase text-white mb-2">Shoe Update</h2>
        <p className="text-neutral-400 text-xs mb-5">{message || "Restart training?"}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded font-bold text-xs bg-white/5 text-neutral-300">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded font-bold text-xs bg-red-600 text-white">Restart</button>
        </div>
      </div>
    </div>
  );
};

const SettingsPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  dealMode: 'auto' | 'manual';
  onToggleMode: () => void;
  autoInterval: number;
  onIntervalChange: (sec: number) => void;
}> = ({ isOpen, onClose, dealMode, onToggleMode, autoInterval, onIntervalChange }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-end p-2 pointer-events-none">
      <div className="pointer-events-auto bg-neutral-900/95 border border-white/10 w-64 rounded-xl shadow-2xl p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase text-neutral-400">Settings</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><i className="fas fa-times"></i></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[8px] font-bold text-neutral-500 uppercase mb-1 block">Mode</label>
            <div className="flex bg-black/40 rounded p-0.5 border border-white/5">
              <button onClick={onToggleMode} className={`flex-1 py-1 rounded text-[10px] font-black uppercase ${dealMode === 'auto' ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-500'}`}>Auto</button>
              <button onClick={onToggleMode} className={`flex-1 py-1 rounded text-[10px] font-black uppercase ${dealMode === 'manual' ? 'bg-orange-600/20 text-orange-400' : 'text-neutral-500'}`}>Manual</button>
            </div>
          </div>
          <div className={dealMode === 'manual' ? 'opacity-40 pointer-events-none' : ''}>
            <label className="text-[8px] font-bold text-neutral-500 uppercase mb-1 block">Interval</label>
            <div className="grid grid-cols-3 gap-1">
              {INTERVALS.map(sec => (
                <button key={sec} onClick={() => onIntervalChange(sec)} className={`py-1 rounded text-[10px] font-black border ${autoInterval === sec ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-white/5 text-neutral-500 border-transparent'}`}>{sec}s</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [shoe, setShoe] = useState<Card[]>([]);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [balance, setBalance] = useState(10000);
  const [currentBets, setCurrentBets] = useState<Map<BetTarget, number>>(new Map<BetTarget, number>());
  const [gameState, setGameState] = useState<'betting' | 'dealing' | 'result' | 'initializing'>('initializing');
  const [timer, setTimer] = useState(10);
  const [autoInterval, setAutoInterval] = useState(10);
  const [burnCount, setBurnCount] = useState<number | null>(null);
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [shoeStats, setShoeStats] = useState({ totalCards: 416, used: 0 });
  const [isNewShoeModalOpen, setIsNewShoeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | undefined>();
  const [dealMode, setDealMode] = useState<'auto' | 'manual'>('manual');
  const [payoutWin, setPayoutWin] = useState<number | null>(null);

  const timerRef = useRef<any>(null);

  const startNewShoe = useCallback(() => {
    setHistory([]);
    setLastRoundResult(null);
    setCurrentBets(new Map<BetTarget, number>());
    setBalance(10000);
    setPayoutWin(null);
    setGameState('initializing');
    const newShoe = createShoe(8);
    const firstCard = newShoe[0];
    const burnValue = firstCard.value === 0 ? 10 : firstCard.value;
    setBurnCount(burnValue);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      setShoe(newShoe.slice(burnValue + 1));
      setShoeStats({ totalCards: 416, used: burnValue + 1 });
      setGameState('betting');
      setTimer(autoInterval);
    }, 1500);
  }, [autoInterval]);

  useEffect(() => { startNewShoe(); }, []);

  useEffect(() => {
    if (gameState === 'betting' && dealMode === 'auto' && timer > 0) {
      timerRef.current = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && gameState === 'betting' && dealMode === 'auto') {
      handleDeal(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, timer, dealMode]);

  const placeBet = (target: BetTarget, amount: number) => {
    if (gameState !== 'betting') return;
    if (balance < amount) return;
    setBalance((prev: number) => prev - amount);
    setCurrentBets((prev: Map<BetTarget, number>) => {
      const next = new Map(prev);
      const currentAmount = next.get(target) || 0;
      next.set(target, (currentAmount as number) + amount);
      return next;
    });
  };

  const clearSpecificBet = (target: BetTarget) => {
    if (gameState !== 'betting') return;
    const amount = currentBets.get(target) || 0;
    if (amount === 0) return;
    setBalance((prev: number) => prev + (amount as number));
    setCurrentBets((prev: Map<BetTarget, number>) => {
      const next = new Map(prev);
      next.delete(target);
      return next;
    });
  };

  const clearAllBets = () => {
    if (gameState !== 'betting') return;
    let total = 0;
    currentBets.forEach((amt) => {
      total += amt;
    });
    if (total === 0) return;
    setBalance((prev: number) => prev + total);
    setCurrentBets(new Map<BetTarget, number>());
  };

  const handleDeal = (instant: boolean = false) => {
    if (gameState !== 'betting') return;
    if (shoe.length < 15) {
      setModalMessage("Shoe empty. Reshuffle?");
      setIsNewShoeModalOpen(true);
      return;
    }
    setGameState('dealing');
    const { result, usedCards } = playHand(shoe);
    const finalizeDeal = () => {
      setLastRoundResult(result);
      setHistory(prev => [...prev, result]);
      setShoe(prev => prev.slice(usedCards));
      setShoeStats(prev => ({ ...prev, used: prev.used + usedCards }));
      let payout = 0;
      currentBets.forEach((amount, target) => {
        const amt = amount;
        if (target === BetTarget.Player && result.winner === Winner.Player) payout += amt * 2;
        if (target === BetTarget.Banker && result.winner === Winner.Banker) payout += amt * 1.95;
        if (target === BetTarget.Tie && result.winner === Winner.Tie) payout += amt * 9;
        if (result.winner === Winner.Tie && (target === BetTarget.Player || target === BetTarget.Banker)) payout += amt;
        if (target === BetTarget.PlayerPair && result.isPairPlayer) payout += amt * 12;
        if (target === BetTarget.BankerPair && result.isPairBanker) payout += amt * 12;
      });
      if (payout > 0) setPayoutWin(payout);
      setBalance((prev: number) => prev + payout);
      setGameState('result');
      setTimeout(() => {
        setCurrentBets(new Map<BetTarget, number>());
        setGameState('betting');
        if (dealMode === 'auto') setTimer(autoInterval);
      }, dealMode === 'manual' ? 2000 : 3500);
    };
    if (instant) finalizeDeal(); else setTimeout(finalizeDeal, 800);
  };

  return (
    <div className="min-h-screen casino-gradient flex flex-col p-1 md:p-4 overflow-hidden text-white">
      <ConfirmationModal isOpen={isNewShoeModalOpen} onConfirm={() => { setIsNewShoeModalOpen(false); startNewShoe(); }} onCancel={() => setIsNewShoeModalOpen(false)} message={modalMessage} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} dealMode={dealMode} onToggleMode={() => setDealMode(d => d === 'auto' ? 'manual' : 'auto')} autoInterval={autoInterval} onIntervalChange={setAutoInterval} />
      {payoutWin !== null && <WinSplash amount={payoutWin} onComplete={() => setPayoutWin(null)} />}

      <header className="flex-shrink-0 flex items-center justify-between px-2 py-1 mb-1 bg-black/30 rounded border border-white/5 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-sm md:text-2xl font-black italic tracking-tighter">BACCARAT<span className="text-yellow-400">PRO</span></h1>
          <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 rounded-full bg-white/5 border border-transparent hover:border-white/10"><i className="fas fa-cog text-neutral-400 text-[10px] md:text-base"></i></button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-12 md:w-24 h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div id="shoe-progress" className="h-full bg-emerald-500 transition-all" style={{ width: `${(shoeStats.used / shoeStats.totalCards) * 100}%` }} />
            </div>
            <span id="shoe-count" className="text-[8px] font-mono text-neutral-500">{shoeStats.used}/416</span>
          </div>
          <button onClick={() => setIsNewShoeModalOpen(true)} className="bg-red-600 px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold uppercase transition-transform active:scale-95">Reset</button>
        </div>
      </header>

      <main className="flex-grow flex flex-col gap-1.5 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* Hand Area */}
        <div className="flex-shrink-0 flex flex-row items-stretch justify-center gap-2 md:gap-12 px-2 py-4 bg-black/10 rounded-2xl border border-white/5 shadow-2xl">
          <HandUI label="Player" cards={lastRoundResult?.playerCards || []} score={lastRoundResult?.playerScore ?? null} colorClass="text-blue-400" isWinner={gameState === 'result' && (lastRoundResult?.winner === Winner.Player || lastRoundResult?.winner === Winner.Tie)} winColor={lastRoundResult?.winner === Winner.Tie ? 'ring-green-500/50' : 'ring-blue-500/50'} />
          
          <div className="flex flex-col items-center justify-center min-w-[100px] md:min-w-[300px] h-full gap-4">
            {gameState === 'initializing' && <p className="text-yellow-400 text-xs md:text-xl font-bold uppercase animate-pulse">Burning {burnCount}</p>}
            {gameState === 'dealing' && <div className="text-neutral-400 font-black italic animate-pulse text-xs md:text-xl uppercase">Dealing...</div>}
            {gameState === 'result' && (
              <div className={`text-center px-4 py-2 md:px-10 md:py-5 rounded-xl font-black text-sm md:text-3xl transition-all shadow-2xl ring-2 ring-white/20 ${lastRoundResult?.winner === Winner.Player ? 'bg-blue-600/90' : lastRoundResult?.winner === Winner.Banker ? 'bg-red-600/90' : 'bg-green-600/90'}`}>
                {lastRoundResult?.winner === Winner.Tie ? 'TIE' : lastRoundResult?.winner === Winner.Player ? 'PLAYER' : 'BANKER'}
              </div>
            )}
            
            {/* Countdown timer placed between hands in Betting mode */}
            {(gameState === 'betting' && dealMode === 'auto') && (
              <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                 <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center text-xl md:text-4xl font-black text-yellow-400 bg-black/60">
                   {timer}
                 </div>
                 <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-yellow-500/80">Auto Dealing</span>
              </div>
            )}
            
            {(gameState === 'betting' && dealMode === 'manual') && <span className="text-neutral-500 text-xs md:text-lg font-black uppercase tracking-widest bg-white/5 px-6 py-2 rounded-full border border-white/5">Place Bets</span>}
          </div>

          <HandUI label="Banker" cards={lastRoundResult?.bankerCards || []} score={lastRoundResult?.bankerScore ?? null} colorClass="text-red-400" isWinner={gameState === 'result' && (lastRoundResult?.winner === Winner.Banker || lastRoundResult?.winner === Winner.Tie)} winColor={lastRoundResult?.winner === Winner.Tie ? 'ring-green-500/50' : 'ring-red-500/50'} />
        </div>

        <div className="flex-shrink-0">
          <Roadmap history={history} />
        </div>
        
        <div className="mt-auto">
           <BettingTable 
             balance={balance} 
             currentBets={currentBets} 
             onBet={placeBet} 
             onClearBet={clearSpecificBet} 
             onClearAll={clearAllBets} 
             onDeal={() => handleDeal(true)}
             showDeal={gameState === 'betting' && dealMode === 'manual'}
           />
        </div>
      </main>
      <footer className="mt-0.5 text-center text-neutral-600 text-[7px] uppercase font-bold tracking-[0.1em]">
        Training Only • 8-Deck Shoe • Standard Rules
      </footer>
    </div>
  );
};

export default App;
