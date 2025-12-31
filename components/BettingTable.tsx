
import React from 'react';
import { BetTarget } from '../types';

interface BettingTableProps {
  onBet: (target: BetTarget, amount: number) => void;
  onClearBet: (target: BetTarget) => void;
  onClearAll: () => void;
  currentBets: Map<BetTarget, number>;
  balance: number;
  onDeal?: () => void;
  showDeal?: boolean;
}

const CHIP_VALUES = [100, 200, 500];

export const BettingTable: React.FC<BettingTableProps> = ({ onBet, onClearBet, onClearAll, currentBets, balance, onDeal, showDeal }) => {
  const [selectedChip, setSelectedChip] = React.useState(100);

  const handleContextMenu = (e: React.MouseEvent, target: BetTarget) => {
    e.preventDefault();
    onClearBet(target);
  };

  return (
    <div className="w-full flex flex-col gap-3 md:gap-6 p-2 md:p-4">
      {/* Betting Areas */}
      <div className="grid grid-cols-5 gap-2 h-24 md:h-40">
        <button 
          onClick={() => onBet(BetTarget.PlayerPair, selectedChip)}
          onContextMenu={(e) => handleContextMenu(e, BetTarget.PlayerPair)}
          className="bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/30 rounded-xl flex flex-col items-center justify-center transition-all group relative overflow-hidden h-full"
        >
          <span className="text-[8px] md:text-xs font-bold text-blue-300">P.PAIR</span>
          <span className="text-[10px] md:text-xl font-bold text-white leading-none">11:1</span>
          {currentBets.get(BetTarget.PlayerPair) && (
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] md:text-xs px-1 rounded-bl font-bold">
              ${currentBets.get(BetTarget.PlayerPair)}
            </div>
          )}
        </button>

        <button 
          onClick={() => onBet(BetTarget.Player, selectedChip)}
          onContextMenu={(e) => handleContextMenu(e, BetTarget.Player)}
          className="bg-blue-600/80 hover:bg-blue-500 border border-blue-400 rounded-xl flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 relative h-full"
        >
          <span className="text-[10px] md:text-sm font-black text-white uppercase leading-none">Player</span>
          <span className="text-[12px] md:text-3xl font-black text-white">1:1</span>
          {currentBets.get(BetTarget.Player) && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[8px] md:text-sm font-bold border-2 border-white shadow-md">
              ${currentBets.get(BetTarget.Player)}
            </div>
          )}
        </button>

        <button 
          onClick={() => onBet(BetTarget.Tie, selectedChip)}
          onContextMenu={(e) => handleContextMenu(e, BetTarget.Tie)}
          className="bg-green-700/80 hover:bg-green-600 border border-green-400 rounded-xl flex flex-col items-center justify-center transition-all relative h-full"
        >
          <span className="text-[10px] md:text-sm font-black text-white leading-none">TIE</span>
          <span className="text-[12px] md:text-3xl font-black text-white">8:1</span>
           {currentBets.get(BetTarget.Tie) && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[8px] md:text-sm font-bold border-2 border-white shadow-md">
              ${currentBets.get(BetTarget.Tie)}
            </div>
          )}
        </button>

        <button 
          onClick={() => onBet(BetTarget.Banker, selectedChip)}
          onContextMenu={(e) => handleContextMenu(e, BetTarget.Banker)}
          className="bg-red-600/80 hover:bg-red-500 border border-red-400 rounded-xl flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 relative h-full"
        >
          <span className="text-[10px] md:text-sm font-black text-white uppercase leading-none">Banker</span>
          <span className="text-[12px] md:text-3xl font-black text-white">0.95:1</span>
           {currentBets.get(BetTarget.Banker) && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[8px] md:text-sm font-bold border-2 border-white shadow-md">
              ${currentBets.get(BetTarget.Banker)}
            </div>
          )}
        </button>

        <button 
          onClick={() => onBet(BetTarget.BankerPair, selectedChip)}
          onContextMenu={(e) => handleContextMenu(e, BetTarget.BankerPair)}
          className="bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden h-full"
        >
          <span className="text-[8px] md:text-xs font-bold text-red-300">B.PAIR</span>
          <span className="text-[10px] md:text-xl font-bold text-white leading-none">11:1</span>
           {currentBets.get(BetTarget.BankerPair) && (
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] md:text-xs px-1 rounded-bl font-bold">
              ${currentBets.get(BetTarget.BankerPair)}
            </div>
          )}
        </button>
      </div>

      {/* Chip Selection & Balance */}
      <div className="flex items-center justify-between gap-4 bg-black/50 p-3 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onClearAll} className="px-3 py-2 rounded-lg bg-neutral-800 border border-white/10 text-neutral-400 text-[10px] font-black uppercase transition-all hover:bg-neutral-700">Recall</button>
          <div className="flex gap-2 md:gap-4">
            {CHIP_VALUES.map(val => (
              <button
                key={val}
                onClick={() => setSelectedChip(val)}
                className={`w-10 h-10 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center font-black text-xs md:text-lg transition-transform shadow-xl
                  ${selectedChip === val ? 'scale-110 border-yellow-400 ring-4 ring-yellow-400/20 z-10' : 'border-white/20'}
                  ${val === 100 ? 'bg-black text-white' : val === 200 ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}
              >
                {val}
              </button>
            ))}
          </div>
          {showDeal && onDeal && (
            <button 
              onClick={onDeal}
              className="ml-2 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 md:px-12 md:py-4 rounded-xl font-black text-xs md:text-xl uppercase shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all active:scale-95 border-b-2 md:border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1"
            >
              Deal
            </button>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Bankroll</span>
          <span className="text-xl md:text-4xl font-black text-yellow-400 leading-none">${balance.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
