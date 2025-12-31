
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

export interface Hand {
  cards: Card[];
  score: number;
}

export interface RoundResult {
  winner: Winner;
  playerScore: number;
  bankerScore: number;
  playerCards: Card[];
  bankerCards: Card[];
  isPairPlayer: boolean;
  isPairBanker: boolean;
}

export interface RoadCell {
  winner: Winner;
  isPairPlayer?: boolean;
  isPairBanker?: boolean;
}

export enum BetTarget {
  Player = 'Player',
  Banker = 'Banker',
  Tie = 'Tie',
  PlayerPair = 'Player Pair',
  BankerPair = 'Banker Pair'
}

export interface Bet {
  target: BetTarget;
  amount: number;
}
