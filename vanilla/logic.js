// Baccarat Game Logic - Static Version
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const Suit = { Spades: '♠', Hearts: '♥', Diamonds: '♦', Clubs: '♣' };
export const Winner = { Player: 'P', Banker: 'B', Tie: 'T' };
export const BetTarget = { Player: 'Player', Banker: 'Banker', Tie: 'Tie', PlayerPair: 'Player Pair', BankerPair: 'Banker Pair' };

export const getCardValue = (rank) => {
  if (rank === 'A') return 1;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  return parseInt(rank);
};

export const createShoe = (decks = 8) => {
  const shoe = [];
  const suits = Object.values(Suit);
  for (let i = 0; i < decks; i++) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        shoe.push({ suit, rank, value: getCardValue(rank) });
      }
    }
  }
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
};

export const calculateScore = (cards) => cards.reduce((sum, card) => sum + card.value, 0) % 10;

export const playHand = (shoe) => {
  const playerCards = [shoe[0], shoe[2]];
  const bankerCards = [shoe[1], shoe[3]];
  let used = 4;
  let pScore = calculateScore(playerCards);
  let bScore = calculateScore(bankerCards);

  if (pScore < 8 && bScore < 8) {
    if (pScore <= 5) {
      const pThird = shoe[used++];
      playerCards.push(pThird);
      pScore = calculateScore(playerCards);
      const pv = pThird.value;
      if (bScore <= 2 || (bScore === 3 && pv !== 8) || (bScore === 4 && [2,3,4,5,6,7].includes(pv)) || (bScore === 5 && [4,5,6,7].includes(pv)) || (bScore === 6 && [6,7].includes(pv))) {
        bankerCards.push(shoe[used++]);
        bScore = calculateScore(bankerCards);
      }
    } else if (bScore <= 5) {
      bankerCards.push(shoe[used++]);
      bScore = calculateScore(bankerCards);
    }
  }
  const winner = pScore > bScore ? Winner.Player : bScore > pScore ? Winner.Banker : Winner.Tie;
  return { result: { winner, playerScore: pScore, bankerScore: bScore, playerCards, bankerCards, isPairPlayer: playerCards[0].rank === playerCards[1].rank, isPairBanker: bankerCards[0].rank === bankerCards[1].rank }, usedCards: used };
};

export const generateBigRoad = (history) => {
  const matrix = Array.from({ length: 6 }, () => Array(250).fill(null));
  const path = [];
  let col = 0, row = 0, streakStartCol = 0, logicalCol = -1, lastWinner = null, isFirst = true;

  history.forEach(res => {
    if (res.winner === Winner.Tie) {
      if (path.length > 0) {
        const last = path[path.length - 1];
        if (matrix[last.r][last.c]) matrix[last.r][last.c].ties = (matrix[last.r][last.c].ties || 0) + 1;
      } else {
        if (!matrix[0][0]) matrix[0][0] = { winner: Winner.Tie, ties: 1 };
        else matrix[0][0].ties++;
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
        while (col < 250 && matrix[0][col] !== null) col++;
        streakStartCol = col;
      }
      matrix[row][col] = { winner: res.winner, ties: 0 };
      path.push({ r: row, c: col, logicalCol, winner: res.winner });
      lastWinner = res.winner;
    }
  });
  return { matrix, path };
};

export const generateDerivedRoad = (bigMatrix, path, offset) => {
  const matrix = Array.from({ length: 6 }, () => Array(250).fill(null));
  const valid = path.filter(p => p.winner !== Winner.Tie);
  let dCol = 0, dRow = 0, dStreakStart = 0, lastColor = null;
  valid.forEach(cur => {
    if (cur.logicalCol < offset || (cur.logicalCol === offset && cur.r === 0)) return;
    let color = 'blue';
    if (cur.r > 0) {
      const cellLeft = bigMatrix[cur.r][cur.c - offset];
      const cellAboveLeft = bigMatrix[cur.r - 1][cur.c - offset];
      color = (cellLeft !== null) === (cellAboveLeft !== null) ? 'red' : 'blue';
    } else {
      const h1 = [0,1,2,3,4,5].reduce((a, r) => a + (bigMatrix[r][cur.c - 1] ? 1 : 0), 0);
      const h2 = [0,1,2,3,4,5].reduce((a, r) => a + (bigMatrix[r][cur.c - 1 - offset] ? 1 : 0), 0);
      color = h1 === h2 ? 'red' : 'blue';
    }
    if (lastColor === null) { matrix[0][0] = color; lastColor = color; }
    else if (color === lastColor) {
      if (dRow < 5 && matrix[dRow + 1][dCol] === null) dRow++; else dCol++;
      matrix[dRow][dCol] = color;
    } else {
      dRow = 0; dCol = dStreakStart + 1;
      while (dCol < 250 && matrix[0][dCol] !== null) dCol++;
      dStreakStart = dCol; matrix[0][dCol] = color; lastColor = color;
    }
  });
  return matrix;
};