
import React from 'react';
import { BetTarget } from '../types';

interface BettingTableProps {
  onBet: (target: BetTarget, amount: number) => void;
  onClearBet: (target: BetTarget) => void;
  onClearAll: () => void;
  currentBets: Map<BetTarget, number>;
  balance: number;
}

const CHIP_VALUES = [5, 10, 20, 50];

export const BettingTable: React.FC<BettingTableProps> = ({ onBet, onClearBet, onClearAll, currentBets, balance }) => {
  const [selectedChip, setSelectedChip] = React.useState(5);

  const renderBetArea = (target: BetTarget, label: string, colorClass: string) => {
    const amount = currentBets.get(target) || 0;
    return (
      <button
        onClick={() => onBet(target, selectedChip)}
        onContextMenu={(e) => { e.preventDefault(); onClearBet(target); }}
        className={`relative flex-1 flex flex-col items-center justify-center p-2 md:p-4 rounded-xl border border-white/10 transition-all active:scale-95 shadow-lg ${colorClass}`}
      >
        <span className="text-lg md:text-2xl font-black uppercase tracking-tighter">{label}</span>
        <span className="text-[10px] font-bold opacity-60">1:1</span>
        
        {amount > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white text-black font-black text-[10px] w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 md:border-4 border-yellow-500 shadow-2xl scale-125 z-10">
              ${amount}
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="w-full bg-[#0f212e] p-2 md:p-3 flex flex-col gap-2 md:gap-4 rounded-t-3xl shadow-inner border-t border-white/5">
      {/* Main Bets Row */}
      <div className="flex gap-2 h-24 md:h-32">
        {renderBetArea(BetTarget.Player, '闲家', 'bg-[#1565c0] text-white')}
        {renderBetArea(BetTarget.Banker, '庄家', 'bg-[#c62828] text-white')}
      </div>

      {/* Chip Selection & Bottom Bar */}
      <div className="flex items-center justify-between px-1 md:px-2 pb-2 md:pb-4">
        <div className="flex flex-col items-start min-w-[50px]">
          <span className="text-[8px] text-neutral-500 uppercase font-bold tracking-widest">余额</span>
          <span className="text-sm md:text-lg font-black text-white">${balance.toLocaleString()}</span>
        </div>

        <div className="flex gap-2 items-center">
           <button onClick={onClearAll} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-neutral-400 hover:text-white transition-colors">
              <i className="fas fa-undo text-xs"></i>
           </button>
          <div className="flex gap-1.5 md:gap-2 bg-black/20 p-1 rounded-full border border-white/5">
            {CHIP_VALUES.map(val => (
              <button
                key={val}
                onClick={() => setSelectedChip(val)}
                className={`w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center font-black text-[10px] md:text-sm transition-all shadow-md
                  ${selectedChip === val ? 'scale-110 border-yellow-400 bg-white text-black z-10' : 'border-white/10 bg-black/40 text-neutral-400 opacity-60'}
                `}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end min-w-[50px]">
          <span className="text-[8px] text-neutral-500 uppercase font-bold tracking-widest">总下注</span>
          <span className="text-sm md:text-lg font-black text-yellow-500">
            {/* Added explicit types to reduce callback to fix 'unknown' operator error */}
            ${Array.from(currentBets.values()).reduce((a: number, b: number) => a + b, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
