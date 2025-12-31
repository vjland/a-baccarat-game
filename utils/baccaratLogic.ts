
import { Card, Suit, Winner, RoundResult } from '../types';

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const getCardValue = (rank: string): number => {
  if (rank === 'A') return 1;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  return parseInt(rank);
};

export const createShoe = (decks: number = 8): Card[] => {
  const shoe: Card[] = [];
  const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
  for (let i = 0; i < decks; i++) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        shoe.push({ suit, rank, value: getCardValue(rank) });
      }
    }
  }
  return shuffle(shoe);
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const calculateScore = (cards: Card[]): number => {
  const total = cards.reduce((sum, card) => sum + card.value, 0);
  return total % 10;
};

export const shouldPlayerDraw = (playerScore: number): boolean => {
  return playerScore <= 5;
};

export const shouldBankerDraw = (bankerScore: number, playerThirdCardValue?: number): boolean => {
  if (playerThirdCardValue === undefined) {
    return bankerScore <= 5;
  }
  if (bankerScore <= 2) return true;
  if (bankerScore === 3) return playerThirdCardValue !== 8;
  if (bankerScore === 4) return [2, 3, 4, 5, 6, 7].includes(playerThirdCardValue);
  if (bankerScore === 5) return [4, 5, 6, 7].includes(playerThirdCardValue);
  if (bankerScore === 6) return [6, 7].includes(playerThirdCardValue);
  return false;
};

export const playHand = (shoe: Card[]): { result: RoundResult, usedCards: number } => {
  const playerCards: Card[] = [shoe[0], shoe[2]];
  const bankerCards: Card[] = [shoe[1], shoe[3]];
  let used = 4;

  let pScore = calculateScore(playerCards);
  let bScore = calculateScore(bankerCards);

  if (pScore < 8 && bScore < 8) {
    let pThird: Card | undefined;
    if (shouldPlayerDraw(pScore)) {
      pThird = shoe[used++];
      playerCards.push(pThird);
      pScore = calculateScore(playerCards);
    }
    if (shouldBankerDraw(bScore, pThird?.value)) {
      bankerCards.push(shoe[used++]);
      bScore = calculateScore(bankerCards);
    }
  }

  let winner = Winner.Tie;
  if (pScore > bScore) winner = Winner.Player;
  else if (bScore > pScore) winner = Winner.Banker;

  return {
    result: {
      winner,
      playerScore: pScore,
      bankerScore: bScore,
      playerCards: [...playerCards],
      bankerCards: [...bankerCards],
      isPairPlayer: playerCards[0].rank === playerCards[1].rank,
      isPairBanker: bankerCards[0].rank === bankerCards[1].rank,
    },
    usedCards: used
  };
};

export interface BigRoadEntry {
  winner: Winner;
  ties: number;
}

export interface PathEntry {
  r: number;
  c: number;
  logicalCol: number;
  winner: Winner;
}

export const generateBigRoad = (history: RoundResult[]) => {
  const matrix: (BigRoadEntry | null)[][] = Array.from({ length: 6 }, () => Array(250).fill(null));
  const path: PathEntry[] = [];
  
  let col = 0;
  let row = 0;
  let streakStartCol = 0;
  let logicalCol = -1;
  let lastWinner: Winner | null = null;
  let isFirstHand = true;

  history.forEach((res) => {
    if (res.winner === Winner.Tie) {
      if (path.length > 0) {
        const last = path[path.length - 1];
        const entry = matrix[last.r][last.c];
        if (entry) entry.ties++;
      } else {
        // Tie at start of shoe
        if (!matrix[0][0]) {
          matrix[0][0] = { winner: Winner.Tie, ties: 1 };
          path.push({ r: 0, c: 0, logicalCol: 0, winner: Winner.Tie });
        } else {
          matrix[0][0]!.ties++;
        }
      }
      return;
    }

    if (isFirstHand) {
      logicalCol = 0;
      if (matrix[0][0] && matrix[0][0].winner === Winner.Tie) {
        // Replace Tie with first Player/Banker
        matrix[0][0].winner = res.winner;
      } else {
        matrix[0][0] = { winner: res.winner, ties: 0 };
      }
      path.push({ r: 0, c: 0, logicalCol: 0, winner: res.winner });
      lastWinner = res.winner;
      isFirstHand = false;
      row = 0;
      col = 0;
      streakStartCol = 0;
    } else {
      if (res.winner === lastWinner) {
        // Streak continues
        if (row < 5 && matrix[row + 1][col] === null) {
          row++;
        } else {
          col++;
        }
      } else {
        // Winner change
        logicalCol++;
        row = 0;
        col = streakStartCol + 1;
        while (col < matrix[0].length && matrix[0][col] !== null) col++;
        streakStartCol = col;
      }
      if (col < matrix[0].length) {
        matrix[row][col] = { winner: res.winner, ties: 0 };
        path.push({ r: row, c: col, logicalCol, winner: res.winner });
      }
      lastWinner = res.winner;
    }
  });

  return { matrix, path };
};

const getColumnHeight = (matrix: (BigRoadEntry | null)[][], col: number): number => {
  if (col < 0 || col >= matrix[0].length) return 0;
  let height = 0;
  for (let r = 0; r < 6; r++) {
    if (matrix[r][col] !== null) height++;
  }
  return height;
};

export const generateDerivedRoad = (bigRoadMatrix: (BigRoadEntry | null)[][], path: PathEntry[], offset: number) => {
  const derivedMatrix: (('red' | 'blue') | null)[][] = Array.from({ length: 6 }, () => Array(250).fill(null));
  
  // Filter out ties for derived road calculations
  const validPath = path.filter(p => p.winner !== Winner.Tie);
  if (validPath.length === 0) return derivedMatrix;

  let dCol = 0;
  let dRow = 0;
  let dStreakStartCol = 0;
  let lastColor: 'red' | 'blue' | null = null;

  validPath.forEach((current) => {
    // Derived roads start after a specific number of hands in the Big Road
    if (current.logicalCol < offset || (current.logicalCol === offset && current.r === 0)) {
      return;
    }

    let color: 'red' | 'blue' = 'blue';

    if (current.r > 0) {
      const idx = current.c - offset;
      const cellLeft = idx >= 0 ? bigRoadMatrix[current.r][idx] : null;
      const cellAboveLeft = idx >= 0 ? bigRoadMatrix[current.r - 1][idx] : null;
      // Rule: Red if symmetry exists, Blue otherwise
      if ((cellLeft !== null) === (cellAboveLeft !== null)) {
        color = 'red';
      } else {
        color = 'blue';
      }
    } else {
      const h1 = getColumnHeight(bigRoadMatrix, current.c - 1);
      const h2 = getColumnHeight(bigRoadMatrix, current.c - 1 - offset);
      color = (h1 === h2) ? 'red' : 'blue';
    }

    if (lastColor === null) {
      dRow = 0;
      dCol = 0;
      dStreakStartCol = 0;
      derivedMatrix[dRow][dCol] = color;
      lastColor = color;
    } else if (color === lastColor) {
      if (dRow < 5 && derivedMatrix[dRow + 1][dCol] === null) {
        dRow++;
      } else {
        dCol++;
      }
      if (dCol < derivedMatrix[0].length) {
        derivedMatrix[dRow][dCol] = color;
      }
    } else {
      dRow = 0;
      dCol = dStreakStartCol + 1;
      while (dCol < derivedMatrix[0].length && derivedMatrix[0][dCol] !== null) dCol++;
      dStreakStartCol = dCol;
      if (dCol < derivedMatrix[0].length) {
        derivedMatrix[dRow][dCol] = color;
      }
      lastColor = color;
    }
  });

  return derivedMatrix;
};
