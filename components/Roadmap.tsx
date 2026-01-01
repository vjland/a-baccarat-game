
import React from 'react';
import { RoundResult, Winner } from '../types';
import { generateBigRoad, generateDerivedRoad } from '../utils/baccaratLogic';

interface RoadmapProps {
  history: RoundResult[];
  shoeLength: number;
}

const RoadGrid: React.FC<{ 
  matrix: any[][], 
  cols: number, 
  cellSize: string, 
  bg?: string,
  renderCell: (cell: any, r: number, c: number) => React.ReactNode 
}> = ({ matrix, cols, cellSize, bg = "bg-white", renderCell }) => (
  <div className={`grid grid-rows-6 grid-flow-col ${bg} overflow-x-auto scrollbar-hide w-full content-start`}>
    {Array.from({ length: 6 * cols }).map((_, i) => {
      const r = i % 6, c = Math.floor(i / 6);
      return (
        <div key={i} className={`${cellSize} flex items-center justify-center border-[0.1px] border-white/5 relative`}>
          {renderCell(matrix[r]?.[c], r, c)}
        </div>
      );
    })}
  </div>
);

export const Roadmap: React.FC<RoadmapProps> = ({ history, shoeLength }) => {
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

  // 8 decks * 52 cards = 416
  const totalCards = 416;
  const usedCards = Math.max(0, totalCards - shoeLength);
  const shoeProgress = (usedCards / totalCards) * 100;

  return (
    <div className="flex flex-col w-full bg-[#050a0e] p-0 gap-0 h-full min-h-0 overflow-hidden">
      {/* Top Section: Statistics Bar - 100% Larger Fonts */}
      <div className="flex flex-col bg-black/80 border-b border-white/5">
        <div className="flex items-center gap-6 px-4 py-2 text-base font-black text-neutral-400 uppercase tracking-widest">
          <span className="text-yellow-400">#{stats.total} HANDS</span>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#1565c0]" /> {stats.p}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#c62828]" /> {stats.b}</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2e7d32]" /> {stats.t}</div>
          
          <div className="ml-auto flex items-center gap-3 text-sm text-neutral-500 lowercase font-bold">
            <span>{usedCards} / {shoeLength} cards</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/5">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000" 
            style={{ width: `${shoeProgress}%` }}
          />
        </div>
      </div>

      {/* Main Roadmap Area */}
      <div className="flex flex-col flex-grow min-h-0 overflow-y-auto scrollbar-hide bg-[#0d161d]">
        <div className="border-b border-white/5">
          <RoadGrid matrix={bigRoadMatrix} cols={100} cellSize="w-2.5 h-2.5 md:w-4 md:h-4" bg="bg-black/20" renderCell={(cell) => cell && (
            <div className={`w-[95%] h-[95%] rounded-full border-[1.2px] md:border-[1.8px] relative
              ${cell.winner === Winner.Banker ? 'border-[#ff4d4d]' : cell.winner === Winner.Player ? 'border-[#4d94ff]' : 'border-[#4ade80]'}`}>
              {cell.ties > 0 && <div className="absolute w-full h-[0.5px] bg-[#4ade80] rotate-45" />}
              {cell.ties > 1 && <span className="absolute inset-0 flex items-center justify-center text-[5px] md:text-[7px] font-black text-green-300">{cell.ties}</span>}
            </div>
          )} />
        </div>

        <div className="flex flex-col min-h-0">
          <div className="border-b border-white/5">
            <RoadGrid matrix={bigEyeMatrix} cols={200} cellSize="w-1.5 h-1.5 md:w-2 md:h-2" bg="bg-black/10" renderCell={(color) => color && (
              <div className={`w-[95%] h-[95%] rounded-full border-[0.8px] ${color === 'red' ? 'border-red-500' : 'border-blue-500'}`} />
            )} />
          </div>
          <div className="border-b border-white/5">
            <RoadGrid matrix={smallRoadMatrix} cols={200} cellSize="w-1.5 h-1.5 md:w-2 md:h-2" bg="bg-black/10" renderCell={(color) => color && (
              <div className={`w-[95%] h-[95%] rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
            )} />
          </div>
          <div>
             <RoadGrid matrix={cockroachMatrix} cols={200} cellSize="w-1.5 h-1.5 md:w-2 md:h-2" bg="bg-black/10" renderCell={(color) => color && (
                <div className={`w-[1px] h-[90%] rotate-45 ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
              )} />
          </div>
        </div>
      </div>
    </div>
  );
};
