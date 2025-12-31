
import React from 'react';
import { RoundResult, Winner } from '../types';
import { generateBigRoad, generateDerivedRoad } from '../utils/baccaratLogic';

interface RoadmapProps {
  history: RoundResult[];
}

const RoadGrid: React.FC<{ 
  matrix: any[][], 
  cols: number, 
  cellSize: string, 
  renderCell: (cell: any, r: number, c: number) => React.ReactNode 
}> = ({ matrix, cols, cellSize, renderCell }) => (
  <div className={`grid grid-rows-6 grid-flow-col bg-neutral-900 rounded overflow-x-auto scrollbar-hide h-full w-full border border-neutral-800`}>
    {Array.from({ length: 6 * cols }).map((_, i) => {
      const r = i % 6;
      const c = Math.floor(i / 6);
      return (
        <div key={i} className={`${cellSize} flex items-center justify-center relative leading-none p-0 m-0`}>
          {renderCell(matrix[r]?.[c], r, c)}
        </div>
      );
    })}
  </div>
);

const BigRoad: React.FC<{ history: RoundResult[] }> = ({ history }) => {
  const { matrix } = generateBigRoad(history);
  return (
    <RoadGrid 
      matrix={matrix} 
      cols={100} 
      cellSize="w-3 h-3 md:w-6 md:h-6" 
      renderCell={(cell) => cell && (
        <div className={`w-[90%] h-[90%] rounded-full border-[1px] md:border-[1.5px] flex items-center justify-center relative
          ${cell.winner === Winner.Banker ? 'border-red-500' : cell.winner === Winner.Player ? 'border-blue-500' : 'border-green-500'}`}>
          {cell.ties > 0 && (
            <div className="absolute w-full h-[1px] bg-green-500 rotate-45 opacity-80" />
          )}
          {cell.ties > 1 && (
            <span className="text-[5px] md:text-[8px] font-bold text-green-500 z-10 leading-none">{cell.ties}</span>
          )}
        </div>
      )}
    />
  );
};

const BeadPlate: React.FC<{ history: RoundResult[] }> = ({ history }) => {
  const matrix = Array.from({ length: 6 }, () => Array(40).fill(null));
  history.forEach((res, i) => {
    const r = i % 6;
    const c = Math.floor(i / 6);
    if (c < 40) matrix[r][c] = res;
  });

  return (
    <RoadGrid 
      matrix={matrix} 
      cols={15} 
      cellSize="w-3 h-3 md:w-6 md:h-6" 
      renderCell={(res) => res && (
        <div className={`w-[90%] h-[90%] rounded-full flex items-center justify-center text-[6px] md:text-[10px] font-bold text-white shadow-sm relative
          ${res.winner === Winner.Banker ? 'bg-red-600' : res.winner === Winner.Player ? 'bg-blue-600' : 'bg-green-600'}`}>
          {res.winner === Winner.Banker ? '庄' : res.winner === Winner.Player ? '闲' : '和'}
        </div>
      )}
    />
  );
};

const BigEyeBoy: React.FC<{ history: RoundResult[] }> = ({ history }) => {
  const { matrix: bigMatrix, path } = generateBigRoad(history);
  const matrix = generateDerivedRoad(bigMatrix, path, 1);
  return (
    <RoadGrid 
      matrix={matrix} 
      cols={100} 
      cellSize="w-2 h-2 md:w-4 md:h-4" 
      renderCell={(color) => color && (
        <div className={`w-[80%] h-[80%] rounded-full border-[0.5px] md:border-[1px] ${color === 'red' ? 'border-red-500' : 'border-blue-500'}`} />
      )}
    />
  );
};

const SmallRoad: React.FC<{ history: RoundResult[] }> = ({ history }) => {
  const { matrix: bigMatrix, path } = generateBigRoad(history);
  const matrix = generateDerivedRoad(bigMatrix, path, 2);
  return (
    <RoadGrid 
      matrix={matrix} 
      cols={100} 
      cellSize="w-2 h-2 md:w-4 md:h-4" 
      renderCell={(color) => color && (
        <div className={`w-[80%] h-[80%] rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
      )}
    />
  );
};

const CockroachRoad: React.FC<{ history: RoundResult[] }> = ({ history }) => {
  const { matrix: bigMatrix, path } = generateBigRoad(history);
  const matrix = generateDerivedRoad(bigMatrix, path, 3);
  return (
    <RoadGrid 
      matrix={matrix} 
      cols={100} 
      cellSize="w-2 h-2 md:w-4 md:h-4" 
      renderCell={(color) => color && (
        <div className={`w-[1.5px] h-[80%] rotate-45 ${color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
      )}
    />
  );
};

export const Roadmap: React.FC<RoadmapProps> = ({ history }) => {
  return (
    <div className="flex flex-col gap-1 w-full bg-black/60 p-1.5 rounded-lg border border-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Top Row: Big Road and Bead Plate */}
      <div className="flex gap-1 h-20 md:h-40">
        <div className="flex flex-col flex-grow min-w-0">
          <h3 className="text-[7px] md:text-[10px] font-bold text-neutral-500 mb-0.5 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-yellow-500/50" /> Big Road
          </h3>
          <div className="flex-grow min-h-0">
            <BigRoad history={history} />
          </div>
        </div>
        <div className="hidden sm:flex flex-col w-24 md:w-56">
          <h3 className="text-[7px] md:text-[10px] font-bold text-neutral-500 mb-0.5 uppercase tracking-widest flex items-center gap-1">
             <span className="w-1 h-1 rounded-full bg-yellow-500/50" /> Bead Plate
          </h3>
          <div className="flex-grow">
            <BeadPlate history={history} />
          </div>
        </div>
      </div>
      
      {/* Derived Roads Stacked */}
      <div className="flex flex-col gap-1">
         <div className="w-full">
            <h3 className="text-[6px] md:text-[9px] font-bold text-neutral-500 mb-0.5 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 rounded-full border-[0.5px] border-red-500/50" /> Big Eye Boy
            </h3>
            <div className="h-12 md:h-24"><BigEyeBoy history={history} /></div>
         </div>
         <div className="w-full">
            <h3 className="text-[6px] md:text-[9px] font-bold text-neutral-500 mb-0.5 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500/50" /> Small Road
            </h3>
            <div className="h-12 md:h-24"><SmallRoad history={history} /></div>
         </div>
         <div className="w-full">
            <h3 className="text-[6px] md:text-[9px] font-bold text-neutral-500 mb-0.5 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-[1px] bg-red-500/50 rotate-45" /> Cockroach Road
            </h3>
            <div className="h-12 md:h-24"><CockroachRoad history={history} /></div>
         </div>
      </div>
    </div>
  );
};
