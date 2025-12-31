export enum Suit {
  Spades = '♠',
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
}

export enum Winner {
  Player = 'P',
  Banker = 'B',
  Tie = 'T'
}

export interface Card {
  suit: Suit;
  rank: string;
  value: number;
}

export interface RoundResult {
  winner: Winner;
  playerScore: number;
  bankerScore: number;
  playerCards: Card[];
  bankerCards: Card[];
}

export enum BetTarget {
  Player = 'Player',
  Banker = 'Banker'
}
