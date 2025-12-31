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

export const playHand = (shoe: Card[]): { result: RoundResult, usedCards: number } => {
  const playerCards: Card[] = [shoe[0], shoe[2]];
  const bankerCards: Card[] = [shoe[1], shoe[3]];
  let used = 4;

  let pScore = calculateScore(playerCards);
  let bScore = calculateScore(bankerCards);

  // Baccarat rules for third card
  if (pScore < 8 && bScore < 8) {
    let pThird: Card | undefined;
    if (pScore <= 5) {
      pThird = shoe[used++];
      playerCards.push(pThird);
      pScore = calculateScore(playerCards);
    }

    const pv = pThird?.value;
    if (pv === undefined) {
      if (bScore <= 5) {
        bankerCards.push(shoe[used++]);
        bScore = calculateScore(bankerCards);
      }
    } else {
      // Banker third card rules based on player's third card
      if (
        bScore <= 2 ||
        (bScore === 3 && pv !== 8) ||
        (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(pv)) ||
        (bScore === 5 && [4, 5, 6, 7].includes(pv)) ||
        (bScore === 6 && [6, 7].includes(pv))
      ) {
        bankerCards.push(shoe[used++]);
        bScore = calculateScore(bankerCards);
      }
    }
  }

  let winner = Winner.Tie;
  if (pScore > bScore) winner = Winner.Player;
  else if (bScore > pScore) winner = Winner.Banker;

  return {
    result: { winner, playerScore: pScore, bankerScore: bScore, playerCards, bankerCards },
    usedCards: used
  };
};

// Road Logic
export interface BigRoadEntry { winner: Winner; ties: number; }
export interface PathEntry { r: number; c: number; logicalCol: number; winner: Winner; }

export const generateBigRoad = (history: RoundResult[]) => {
  const matrix: (BigRoadEntry | null)[][] = Array.from({ length: 6 }, () => Array(500).fill(null));
  const path: PathEntry[] = [];
  let col = 0, row = 0, streakStartCol = 0, logicalCol = -1, lastWinner: Winner | null = null, isFirst = true;

  history.forEach((res) => {
    if (res.winner === Winner.Tie) {
      if (path.length > 0) {
        const last = path[path.length - 1];
        if (matrix[last.r][last.c]) matrix[last.r][last.c]!.ties++;
      } else {
        if (!matrix[0][0]) matrix[0][0] = { winner: Winner.Tie, ties: 1 };
        else matrix[0][0]!.ties++;
      }
      return;
    }
    if (isFirst) {
      logicalCol = 0;
      matrix[0][0] = { winner: res.winner, ties: 0 };
      path.push({ r: 0, c: 0, logicalCol: 0, winner: res.winner });
      lastWinner = res.winner; isFirst = false;
    } else {
      if (res.winner === lastWinner) {
        if (row < 5 && matrix[row + 1][col] === null) row++; else col++;
      } else {
        logicalCol++; row = 0; col = streakStartCol + 1;
        while (col < matrix[0].length && matrix[0][col] !== null) col++;
        streakStartCol = col;
      }
      matrix[row][col] = { winner: res.winner, ties: 0 };
      path.push({ r: row, c: col, logicalCol, winner: res.winner });
      lastWinner = res.winner;
    }
  });
  return { matrix, path };
};

export const generateDerivedRoad = (bigRoadMatrix: (BigRoadEntry | null)[][], path: PathEntry[], offset: number) => {
  const derivedMatrix: (('red' | 'blue') | null)[][] = Array.from({ length: 6 }, () => Array(500).fill(null));
  const validPath = path.filter(p => p.winner !== Winner.Tie);
  let dCol = 0, dRow = 0, dStreakStartCol = 0, lastColor: 'red' | 'blue' | null = null;

  validPath.forEach((current) => {
    // Derived roads start after offset columns
    if (current.logicalCol < offset || (current.logicalCol === offset && current.r === 0)) return;

    let color: 'red' | 'blue' = 'blue';
    if (current.r > 0) {
      // Look at the column to the left (current.logicalCol - offset)
      const targetCol = current.c - offset;
      const cellLeft = targetCol >= 0 ? bigRoadMatrix[current.r][targetCol] : null;
      const cellAboveLeft = targetCol >= 0 ? bigRoadMatrix[current.r - 1][targetCol] : null;
      color = (cellLeft !== null) === (cellAboveLeft !== null) ? 'red' : 'blue';
    } else {
      // Comparing column lengths
      const h1 = [0,1,2,3,4,5].reduce((a, r) => a + (bigRoadMatrix[r][current.c - 1] ? 1 : 0), 0);
      const h2 = [0,1,2,3,4,5].reduce((a, r) => a + (bigRoadMatrix[r][current.c - 1 - offset] ? 1 : 0), 0);
      color = (h1 === h2) ? 'red' : 'blue';
    }

    if (lastColor === null) {
      derivedMatrix[0][0] = color;
      lastColor = color;
    } else if (color === lastColor) {
      if (dRow < 5 && derivedMatrix[dRow + 1][dCol] === null) dRow++; else dCol++;
      derivedMatrix[dRow][dCol] = color;
    } else {
      dRow = 0; dCol = dStreakStartCol + 1;
      while (dCol < derivedMatrix[0].length && derivedMatrix[0][dCol] !== null) dCol++;
      dStreakStartCol = dCol;
      derivedMatrix[0][dCol] = color;
      lastColor = color;
    }
  });
  return derivedMatrix;
};
