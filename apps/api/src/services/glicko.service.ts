import { prisma } from '../lib/prisma.js';
import { getTimeControlCategory, parseTimeControl } from '@knightos/shared';

// Glicko-2 constants
const TAU = 0.5; // System constant (controls volatility change rate)
const CONVERGENCE_TOLERANCE = 0.000001;

interface GlickoPlayer {
  rating: number;
  rd: number;
  volatility: number;
}

interface GlickoResult {
  opponent: GlickoPlayer;
  score: number; // 1 = win, 0 = loss, 0.5 = draw
}

// Step 1: Convert to Glicko-2 scale
function toGlicko2(rating: number, rd: number): { mu: number; phi: number } {
  return {
    mu: (rating - 1500) / 173.7178,
    phi: rd / 173.7178,
  };
}

// Step 1 reverse: Convert from Glicko-2 scale
function fromGlicko2(mu: number, phi: number): { rating: number; rd: number } {
  return {
    rating: mu * 173.7178 + 1500,
    rd: phi * 173.7178,
  };
}

// Step 2: g(phi) function
function g(phi: number): number {
  return 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI));
}

// Step 2: E(mu, muj, phij) function
function E(mu: number, muj: number, phij: number): number {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
}

// Calculate new rating, RD, and volatility
function calculateNewRating(
  player: GlickoPlayer,
  results: GlickoResult[]
): GlickoPlayer {
  const { mu, phi } = toGlicko2(player.rating, player.rd);
  const sigma = player.volatility;

  if (results.length === 0) {
    // No games: only RD increases
    const newPhi = Math.sqrt(phi * phi + sigma * sigma);
    const result = fromGlicko2(mu, newPhi);
    return { rating: result.rating, rd: result.rd, volatility: sigma };
  }

  // Step 3: Compute variance v
  let vInv = 0;
  for (const result of results) {
    const { mu: muj, phi: phij } = toGlicko2(result.opponent.rating, result.opponent.rd);
    const gPhij = g(phij);
    const e = E(mu, muj, phij);
    vInv += gPhij * gPhij * e * (1 - e);
  }
  const v = 1 / vInv;

  // Step 4: Compute delta
  let deltaSum = 0;
  for (const result of results) {
    const { mu: muj, phi: phij } = toGlicko2(result.opponent.rating, result.opponent.rd);
    const gPhij = g(phij);
    const e = E(mu, muj, phij);
    deltaSum += gPhij * (result.score - e);
  }
  const delta = v * deltaSum;

  // Step 5: Determine new volatility (iterative algorithm)
  const a = Math.log(sigma * sigma);
  const phiSq = phi * phi;
  const deltaSq = delta * delta;

  function f(x: number): number {
    const ex = Math.exp(x);
    const d = phiSq + v + ex;
    return (ex * (deltaSq - phiSq - v - ex)) / (2 * d * d) - (x - a) / (TAU * TAU);
  }

  // Find bounds for Illinois algorithm
  let A = a;
  let B: number;
  if (deltaSq > phiSq + v) {
    B = Math.log(deltaSq - phiSq - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) {
      k++;
    }
    B = a - k * TAU;
  }

  // Illinois algorithm
  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > CONVERGENCE_TOLERANCE) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
  }

  const newSigma = Math.exp(A / 2);

  // Step 6: Update RD
  const phiStar = Math.sqrt(phiSq + newSigma * newSigma);

  // Step 7: New rating and RD
  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = mu + newPhi * newPhi * deltaSum;

  const result = fromGlicko2(newMu, newPhi);

  return {
    rating: result.rating,
    rd: Math.max(result.rd, 30), // Minimum RD floor
    volatility: newSigma,
  };
}

// Public API: Update ratings after a game
export async function updateGameRatings(
  whiteId: string,
  blackId: string,
  result: string, // "1-0" | "0-1" | "1/2-1/2"
  timeControl: string
): Promise<void> {
  const { baseTime, increment } = parseTimeControl(timeControl);
  const category = getTimeControlCategory(baseTime, increment);

  // Load current ratings
  const [whiteRating, blackRating] = await Promise.all([
    prisma.rating.findUnique({
      where: { userId_timeControl: { userId: whiteId, timeControl: category } },
    }),
    prisma.rating.findUnique({
      where: { userId_timeControl: { userId: blackId, timeControl: category } },
    }),
  ]);

  const whitePlayer: GlickoPlayer = {
    rating: whiteRating?.rating ?? 1500,
    rd: whiteRating?.rd ?? 350,
    volatility: whiteRating?.volatility ?? 0.06,
  };

  const blackPlayer: GlickoPlayer = {
    rating: blackRating?.rating ?? 1500,
    rd: blackRating?.rd ?? 350,
    volatility: blackRating?.volatility ?? 0.06,
  };

  // Determine scores
  let whiteScore: number, blackScore: number;
  if (result === '1-0') {
    whiteScore = 1;
    blackScore = 0;
  } else if (result === '0-1') {
    whiteScore = 0;
    blackScore = 1;
  } else {
    whiteScore = 0.5;
    blackScore = 0.5;
  }

  // Calculate new ratings
  const newWhite = calculateNewRating(whitePlayer, [
    { opponent: blackPlayer, score: whiteScore },
  ]);

  const newBlack = calculateNewRating(blackPlayer, [
    { opponent: whitePlayer, score: blackScore },
  ]);

  // Persist
  await Promise.all([
    prisma.rating.upsert({
      where: { userId_timeControl: { userId: whiteId, timeControl: category } },
      update: {
        rating: newWhite.rating,
        rd: newWhite.rd,
        volatility: newWhite.volatility,
      },
      create: {
        userId: whiteId,
        timeControl: category,
        rating: newWhite.rating,
        rd: newWhite.rd,
        volatility: newWhite.volatility,
      },
    }),
    prisma.rating.upsert({
      where: { userId_timeControl: { userId: blackId, timeControl: category } },
      update: {
        rating: newBlack.rating,
        rd: newBlack.rd,
        volatility: newBlack.volatility,
      },
      create: {
        userId: blackId,
        timeControl: category,
        rating: newBlack.rating,
        rd: newBlack.rd,
        volatility: newBlack.volatility,
      },
    }),
  ]);
}

// Public API: Update ratings after a puzzle attempt
export async function updatePuzzleRatings(
  userId: string,
  puzzleId: string,
  solved: boolean
): Promise<void> {
  const [userRating, puzzle] = await Promise.all([
    prisma.rating.findUnique({
      where: { userId_timeControl: { userId, timeControl: 'puzzle' } },
    }),
    prisma.puzzle.findUnique({ where: { id: puzzleId } }),
  ]);

  if (!puzzle) return;

  const player: GlickoPlayer = {
    rating: userRating?.rating ?? 1500,
    rd: userRating?.rd ?? 350,
    volatility: userRating?.volatility ?? 0.06,
  };

  const puzzlePlayer: GlickoPlayer = {
    rating: puzzle.rating,
    rd: puzzle.rd,
    volatility: 0.06,
  };

  const newPlayer = calculateNewRating(player, [
    { opponent: puzzlePlayer, score: solved ? 1 : 0 },
  ]);

  const newPuzzle = calculateNewRating(puzzlePlayer, [
    { opponent: player, score: solved ? 0 : 1 },
  ]);

  await Promise.all([
    prisma.rating.upsert({
      where: { userId_timeControl: { userId, timeControl: 'puzzle' } },
      update: {
        rating: newPlayer.rating,
        rd: newPlayer.rd,
        volatility: newPlayer.volatility,
      },
      create: {
        userId,
        timeControl: 'puzzle',
        rating: newPlayer.rating,
        rd: newPlayer.rd,
        volatility: newPlayer.volatility,
      },
    }),
    prisma.puzzle.update({
      where: { id: puzzleId },
      data: {
        rating: newPuzzle.rating,
        rd: newPuzzle.rd,
      },
    }),
  ]);
}
