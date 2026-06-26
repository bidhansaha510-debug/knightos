// Seed script: load sample puzzles for development
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_PUZZLES = [
  { id: "sample-001", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", moves: "h5f7", rating: 600, themes: ["mateInOne", "sacrifice"], popularity: 100 },
  { id: "sample-002", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", moves: "f3g5 d8g5", rating: 800, themes: ["fork", "tactical"], popularity: 90 },
  { id: "sample-003", fen: "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", moves: "d2d4 d7d5 e4d5 e6d5", rating: 700, themes: ["opening"], popularity: 85 },
  { id: "sample-004", fen: "r2qk2r/ppp2ppp/2n1bn2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6", moves: "c3d5 f6d5 e4d5 c6d4", rating: 1000, themes: ["fork", "tactic"], popularity: 80 },
  { id: "sample-005", fen: "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2", moves: "d2d4 d7d5 e4d5 d8d5", rating: 650, themes: ["opening"], popularity: 75 },
  { id: "sample-006", fen: "r1b1k2r/ppppqppp/2n2n2/2b5/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 5 5", moves: "f6g4 d1g4 d7d5", rating: 1100, themes: ["discoveredAttack", "tactic"], popularity: 70 },
  { id: "sample-007", fen: "r3kb1r/pp1q1ppp/2n1pn2/2pp4/3P1B2/2PBPN2/PP3PPP/R2QK2R w KQkq - 0 8", moves: "f3e5 c6e5 d4e5 f6d7", rating: 1200, themes: ["pin", "tactic"], popularity: 65 },
  { id: "sample-008", fen: "2kr3r/ppp2ppp/2n1bn2/2b5/4P3/2N2N2/PPP2PPP/R1B1KB1R w KQ - 0 8", moves: "e4e5 f6d5 c3d5 e6d5", rating: 1300, themes: ["fork", "endgame"], popularity: 60 },
  { id: "sample-009", fen: "r1b1r1k1/pp3ppp/2n2n2/2bpN3/8/2N1B3/PPP2PPP/R2QKB1R w KQ - 0 9", moves: "e5c6 b7c6 e3c5", rating: 1400, themes: ["pin", "exchange"], popularity: 55 },
  { id: "sample-010", fen: "r1bq1rk1/pppn1ppp/4pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 7", moves: "c4d5 e6d5 d3h7 g8h7", rating: 1500, themes: ["sacrifice", "attack"], popularity: 50 },
  { id: "sample-011", fen: "r2qr1k1/ppp2ppp/2nb1n2/3p4/3P1B2/2PB1N2/PP3PPP/R2Q1RK1 w - - 0 11", moves: "d3h7 g8h7 f3g5 h7g8", rating: 1600, themes: ["sacrifice", "mateInTwo", "attack"], popularity: 95 },
  { id: "sample-012", fen: "r2q1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/2KR1B1R b - - 0 10", moves: "d6d5 e4d5 f6d5 c3d5", rating: 1700, themes: ["opening", "fork"], popularity: 88 },
  { id: "sample-013", fen: "r4rk1/pp2qppp/2n1pn2/3p4/1b1P4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 9", moves: "a2a3 b4c3 b2c3 d5c4", rating: 1800, themes: ["pin", "xRayAttack"], popularity: 82 },
  { id: "sample-014", fen: "r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P1B2/2PBPN2/PP1N1PPP/R2QK2R w KQ - 0 7", moves: "e3e4 d5e4 d3e4 c5d4", rating: 1900, themes: ["sacrifice", "opening"], popularity: 77 },
  { id: "sample-015", fen: "2rq1rk1/pp1bppbp/2np1np1/8/3NP3/1BN1BP2/PPPQ2PP/2KR3R b - - 0 11", moves: "d6d5 e4d5 f6d5 c3d5 e7d5", rating: 2000, themes: ["sacrifice", "endgame", "tactic"], popularity: 72 },
  { id: "sample-016", fen: "r2qk2r/pp2bppp/2n1pn2/3p4/3P1B2/2PBPN2/PP3PPP/R2QK2R w KQkq - 0 8", moves: "f3e5 c6e5 d4e5 f6d7 e5e6", rating: 1450, themes: ["pawnBreak", "attack"], popularity: 68 },
  { id: "sample-017", fen: "rnbqkb1r/pp3ppp/4pn2/2pp4/3P4/2N2N2/PPP1PPPP/R1BQKB1R w KQkq - 0 4", moves: "c1g5 d5c4 e2e4", rating: 1350, themes: ["opening", "gambit"], popularity: 63 },
  { id: "sample-018", fen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", moves: "d2d3 d7d6 c1g5 h7h6", rating: 1100, themes: ["pin", "development"], popularity: 58 },
  { id: "sample-019", fen: "r3k2r/pp1n1ppp/2p1p3/q2pPb2/1b1P4/2NB1N2/PPP2PPP/R1BQK2R w KQkq - 0 9", moves: "a2a3 b4c3 b2c3 a5a3", rating: 1650, themes: ["deflection", "tactic"], popularity: 53 },
  { id: "sample-020", fen: "r1bq1rk1/pp1n1ppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 8", moves: "c4d5 e6d5 f3e5 c6c5", rating: 1550, themes: ["endgame", "exchange"], popularity: 48 },
];

async function seed() {
  console.log('Seeding sample puzzles...');

  await prisma.puzzle.deleteMany();

  await prisma.puzzle.createMany({
    data: SAMPLE_PUZZLES.map((p) => ({
      id: p.id,
      fen: p.fen,
      moves: p.moves,
      rating: p.rating,
      rd: 75,
      themes: p.themes,
      popularity: p.popularity,
    })),
  });

  console.log(`Seeded ${SAMPLE_PUZZLES.length} sample puzzles.`);
}

seed()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
