
import React, { useState, useEffect, useCallback } from 'react';
import { Card, RoundResult, Winner, BetTarget, Suit } from './types';
import { createShoe, playHand } from './utils/baccaratLogic';
import { Roadmap } from './components/Roadmap';
import { BettingTable } from './components/BettingTable';

const WinSplash: React.FC<{ amount: number; onComplete: () => void }> = ({ amount, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
      <div className="animate-win-burst flex flex-col items-center">
        <div className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic win-splash-text drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">Winner!</div>
        <div className="text-3xl md:text-5xl font-black text-white mt-2 drop-shadow-lg">+${amount.toLocaleString()}</div>
      </div>
    </div>
  );
};

const CardUI: React.FC<{ card: Card }> = ({ card }) => {
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  return (
    <div className="w-12 h-auto aspect-[2.5/3.5] md:w-32 bg-white rounded-lg shadow-2xl flex flex-col p-1.5 md:p-2 transition-all border border-neutral-300">
      <div className="text-sm md:text-3xl font-bold leading-none text-black/90">
        <span className={isRed ? 'text-red-600' : 'text-black'}>{card.rank}</span>
      </div>
      <div className={`flex-grow flex items-center justify-center text-2xl md:text-7xl ${isRed ? 'text-red-600' : 'text-black'}`}>{card.suit}</div>
      <div className="text-sm md:text-3xl font-bold leading-none self-end rotate-180 text-black/90">
        <span className={isRed ? 'text-red-600' : 'text-black'}>{card.rank}</span>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isAutoDeal: boolean;
  onToggleAuto: (val: boolean) => void;
  interval: number;
  onIntervalChange: (val: number) => void;
  onNewShoe: () => void;
}> = ({ isOpen, onClose, isAutoDeal, onToggleAuto, interval, onIntervalChange, onNewShoe }) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#1a2b33] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black uppercase tracking-widest text-white">Settings</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><i className="fas fa-times text-xl"></i></button>
        </div>
        
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <span className="text-sm font-bold text-neutral-400 uppercase">Auto Deal</span>
             <button 
               onClick={() => onToggleAuto(!isAutoDeal)}
               className={`w-14 h-8 rounded-full transition-colors relative ${isAutoDeal ? 'bg-green-500' : 'bg-neutral-800'}`}
             >
               <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isAutoDeal ? 'left-7' : 'left-1'}`} />
             </button>
          </div>

          <div className={isAutoDeal ? '' : 'opacity-40 pointer-events-none'}>
            <span className="text-sm font-bold text-neutral-400 uppercase mb-3 block">Interval (seconds)</span>
            <div className="grid grid-cols-3 gap-2">
              {[2, 5, 10].map(s => (
                <button 
                  key={s} 
                  onClick={() => onIntervalChange(s)}
                  className={`py-3 rounded-xl font-black transition-all border ${interval === s ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-black/40 border-white/5 text-white'}`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            {!confirmReset ? (
              <button 
                onClick={() => setConfirmReset(true)}
                className="w-full py-3 bg-red-600/10 border border-red-500/30 rounded-xl text-red-500 font-black uppercase tracking-widest hover:bg-red-600/20 transition-all"
              >
                New Shoe & Reset Bankroll
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => { onNewShoe(); setConfirmReset(false); onClose(); }}
                  className="flex-1 py-3 bg-red-600 rounded-xl text-white font-black uppercase tracking-widest"
                >
                  Confirm?
                </button>
                <button 
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-3 bg-neutral-700 rounded-xl text-white font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [shoe, setShoe] = useState<Card[]>([]);
  const [history, setHistory] = useState<RoundResult[]>([]);
  // Added explicit type to balance and currentBets to avoid 'unknown' operator issues
  const [balance, setBalance] = useState<number>(1000);
  const [currentBets, setCurrentBets] = useState<Map<BetTarget, number>>(new Map());
  const [gameState, setGameState] = useState<'betting' | 'dealing' | 'result' | 'initializing' | 'shoeEnd'>('initializing');
  const [lastRound, setLastRound] = useState<RoundResult | null>(null);
  const [payoutWin, setPayoutWin] = useState<number | null>(null);
  const [initMessage, setInitMessage] = useState<string>('Initializing Shoe...');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutoDeal, setIsAutoDeal] = useState(false);
  const [dealInterval, setDealInterval] = useState(5);
  const [countdown, setCountdown] = useState(0);

  const startNewShoe = useCallback((resetBalance = true) => {
    setHistory([]);
    setLastRound(null);
    setCurrentBets(new Map());
    setGameState('initializing');
    if (resetBalance) setBalance(1000);
    
    const newShoe = createShoe(8);
    const firstCard = newShoe[0];
    // Burn card rule: First card determines number of cards to burn. 
    // Face cards (10, J, Q, K) = 10. Ace = 1.
    const burnCount = firstCard.value === 0 ? 10 : firstCard.value;
    
    setInitMessage(`Burn Card: ${firstCard.rank}${firstCard.suit} - Discarding ${burnCount} cards`);

    setTimeout(() => {
      // Discard burn card (1) + burnCount cards
      setShoe(newShoe.slice(burnCount + 1));
      setGameState('betting');
      if (isAutoDeal) setCountdown(dealInterval);
    }, 2500);
  }, [isAutoDeal, dealInterval]);

  useEffect(() => { startNewShoe(); }, []);

  useEffect(() => {
    if (gameState === 'betting' && isAutoDeal && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    } else if (gameState === 'betting' && isAutoDeal && countdown === 0) {
      handleDeal();
    }
  }, [gameState, isAutoDeal, countdown]);

  const placeBet = (target: BetTarget, amount: number) => {
    if (gameState !== 'betting') return;
    if (balance < amount) return;
    setBalance(prev => prev - amount);
    setCurrentBets(prev => {
      const next = new Map(prev);
      next.set(target, (next.get(target) || 0) + amount);
      return next;
    });
  };

  const clearSpecificBet = (target: BetTarget) => {
    if (gameState !== 'betting') return;
    const amount = currentBets.get(target) || 0;
    // Added explicit type to avoid unknown + number error on line 172
    setBalance((prev: number) => prev + amount);
    setCurrentBets(prev => {
      const next = new Map(prev);
      next.delete(target);
      return next;
    });
  };

  const clearAllBets = () => {
    if (gameState !== 'betting') return;
    let total = 0;
    // Added explicit type to forEach callback
    currentBets.forEach((amt: number) => total += amt);
    setBalance((prev: number) => prev + total);
    setCurrentBets(new Map());
  };

  const handleDeal = () => {
    if (gameState !== 'betting') return;
    setGameState('dealing');
    const { result, usedCards } = playHand(shoe);
    
    setTimeout(() => {
      setLastRound(result);
      setHistory(prev => [...prev, result]);
      const nextShoe = shoe.slice(usedCards);
      setShoe(nextShoe);
      
      let payout = 0;
      // Added explicit types to avoid unknown operator issues
      currentBets.forEach((amt: number, target: BetTarget) => {
        if (target === BetTarget.Player && result.winner === Winner.Player) payout += amt * 2;
        if (target === BetTarget.Banker && result.winner === Winner.Banker) payout += amt * 2;
        if (result.winner === Winner.Tie) payout += amt;
      });

      if (payout > 0) setPayoutWin(payout);
      setBalance(prev => prev + payout);
      setGameState('result');

      setTimeout(() => {
        setCurrentBets(new Map());
        
        if (nextShoe.length < 15) {
          setGameState('shoeEnd');
        } else {
          setGameState('betting');
          if (isAutoDeal) setCountdown(dealInterval);
        }
      }, 3000);
    }, 800);
  };

  const isPlayerWinner = gameState === 'result' && (lastRound?.winner === Winner.Player || lastRound?.winner === Winner.Tie);
  const isBankerWinner = gameState === 'result' && (lastRound?.winner === Winner.Banker || lastRound?.winner === Winner.Tie);

  const renderHand = (title: string, cards: Card[] | undefined, score: number | undefined, colorClass: string, isWinner: boolean) => (
    <div className={`flex flex-col items-center gap-2 md:gap-4 transition-all ${isWinner ? 'animate-winner-flash' : ''}`}>
      <div className="flex flex-col items-center gap-1.5 md:gap-3">
        <div className="flex gap-2">
          {cards ? (
            cards.slice(0, 2).map((c, i) => <CardUI key={i} card={c} />)
          ) : (
            <>
              <div className="w-12 md:w-32 aspect-[2.5/3.5] bg-white/5 border border-white/10 rounded-lg shadow-inner" />
              <div className="w-12 md:w-32 aspect-[2.5/3.5] bg-white/5 border border-white/10 rounded-lg shadow-inner" />
            </>
          )}
        </div>
        <div className="flex items-center justify-center h-20 md:h-46">
          {cards && cards[2] ? (
            <CardUI card={cards[2]} />
          ) : (
            <div className="w-12 md:w-32 aspect-[2.5/3.5] bg-transparent" />
          )}
        </div>
      </div>
      <div className="relative group">
        <span className={`text-xl md:text-2xl font-black ${colorClass} px-8 md:px-10 py-2 rounded-full shadow-2xl border border-white/30 block transform group-hover:scale-110 transition-transform`}>
          {title} {score ?? 0}
        </span>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#05080a] flex flex-col overflow-hidden text-white safe-area-inset">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        isAutoDeal={isAutoDeal}
        onToggleAuto={(v) => { setIsAutoDeal(v); if (v && gameState === 'betting') setCountdown(dealInterval); }}
        interval={dealInterval}
        onIntervalChange={setDealInterval}
        onNewShoe={() => startNewShoe(true)}
      />
      
      {payoutWin !== null && <WinSplash amount={payoutWin} onComplete={() => setPayoutWin(null)} />}

      <div className="relative h-[55vh] md:h-[50vh] bg-gradient-to-b from-[#1a2b33] to-[#0a1217] flex flex-col items-center justify-center p-3 border-b border-white/10 shadow-2xl z-10">
        <div className="absolute top-4 left-6 flex items-center gap-4">
          <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-400/20 hover:bg-blue-500/30 transition-all">
            <i className="fas fa-cog text-blue-400 text-lg"></i>
          </button>
          <div className="text-sm font-black tracking-[0.2em] text-neutral-500 uppercase">STAKE EXTREME</div>
        </div>

        {gameState === 'betting' && isAutoDeal && (
          <div className="absolute top-4 right-6 flex items-center gap-3">
            <div className="text-xs font-black text-green-500 uppercase tracking-widest animate-pulse">Auto Dealing</div>
            <div className="w-10 h-10 rounded-full border-2 border-green-500 flex items-center justify-center bg-black/60 shadow-lg shadow-green-500/20">
              <span className="text-sm font-black text-green-500">{countdown}</span>
            </div>
          </div>
        )}

        {gameState === 'initializing' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center animate-pulse">
              <p className="text-yellow-400 text-2xl font-black uppercase tracking-widest">{initMessage}</p>
            </div>
          </div>
        )}

        {gameState === 'shoeEnd' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
            <div className="bg-[#1a2b33] border border-white/10 p-8 rounded-3xl shadow-2xl text-center max-w-sm">
              <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <i className="fas fa-redo text-yellow-500 text-3xl"></i>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-2">End of Shoe</h2>
              <p className="text-neutral-400 text-sm mb-8 leading-relaxed">The current shoe has finished. Start a fresh 8-deck shoe to continue training.</p>
              <button 
                onClick={() => startNewShoe(true)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-yellow-500/20"
              >
                New Shoe
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-6 md:gap-36 w-full max-w-6xl items-center justify-center mt-4">
          {renderHand('闲', lastRound?.playerCards, lastRound?.playerScore, 'bg-[#1565c0]', isPlayerWinner)}
          {renderHand('庄', lastRound?.bankerCards, lastRound?.bankerScore, 'bg-[#c62828]', isBankerWinner)}
        </div>

        <div className="absolute bottom-4 md:bottom-8 w-full flex flex-col items-center justify-center">
          {gameState === 'betting' && !isAutoDeal && (
             <button 
               onClick={handleDeal}
               className="bg-yellow-500 hover:bg-yellow-400 text-black px-16 py-4 rounded-2xl font-black text-2xl uppercase tracking-[0.1em] transition-all active:scale-95 shadow-2xl shadow-yellow-500/20"
             >
               Deal
             </button>
          )}
        </div>
      </div>

      <div className="flex-grow min-h-0 relative">
        <Roadmap history={history} />
      </div>

      <div className="flex-shrink-0 z-20">
        <BettingTable 
          balance={balance} 
          currentBets={currentBets} 
          onBet={placeBet} 
          onClearBet={clearSpecificBet} 
          onClearAll={clearAllBets} 
        />
      </div>
    </div>
  );
};

export default App;
