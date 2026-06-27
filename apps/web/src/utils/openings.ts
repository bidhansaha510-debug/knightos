export function getOpeningName(moves: { san: string; uci: string }[]): string {
  if (!moves || moves.length === 0) return 'Starting Position';

  // Construct a path of UCI moves
  const uciPath = moves.map(m => m.uci).slice(0, 8).join(' '); // first 4 moves (8 ply)

  if (uciPath.startsWith('e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6')) return 'Sicilian Defense: Najdorf Variation';
  if (uciPath.startsWith('e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 g7g6')) return 'Sicilian Defense: Dragon Variation';
  if (uciPath.startsWith('e2e4 c7c5 g1f3 e7e6 d2d4 c5d4 f3d4 b1c6')) return 'Sicilian Defense: Kan Variation';
  if (uciPath.startsWith('e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6')) return 'Sicilian Defense: Open Sicilian';
  if (uciPath.startsWith('e2e4 c7c5 g1f3 b8c6')) return 'Sicilian Defense: Old Sicilian';
  if (uciPath.startsWith('e2e4 c7c5 g1f3 d7d6')) return 'Sicilian Defense: Classical';
  if (uciPath.startsWith('e2e4 c7c5 b1c3')) return 'Sicilian Defense: Closed Sicilian';
  if (uciPath.startsWith('e2e4 c7c5')) return 'Sicilian Defense';
  
  if (uciPath.startsWith('e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 f1a4 g8f6')) return 'Ruy Lopez: Closed Defense';
  if (uciPath.startsWith('e2e4 e7e5 g1f3 b8c6 f1b5 a7a6')) return 'Ruy Lopez: Exchange Variation';
  if (uciPath.startsWith('e2e4 e7e5 g1f3 b8c6 f1b5 g8f6')) return 'Ruy Lopez: Berlin Defense';
  if (uciPath.startsWith('e2e4 e7e5 g1f3 b8c6 f1b5')) return 'Ruy Lopez';
  if (uciPath.startsWith('e2e4 e7e5 g1f3 b8c6 f1c4 g8f6')) return 'Italian Game: Two Knights Defense';
  if (uciPath.startsWith('e2e4 e7e5 g1f3 b8c6 f1c4 f8c5')) return 'Italian Game: Giuoco Piano';
  if (uciPath.startsWith('e2e4 e7e5 g1f3 b8c6 d2d4 e5d4')) return 'Scotch Game';
  if (uciPath.startsWith('e2e4 e7e5 f2f4')) return 'King\'s Gambit';
  if (uciPath.startsWith('e2e4 e7e5 g1f3 g8f6')) return 'Petrov\'s Defense';
  if (uciPath.startsWith('e2e4 e7e5')) return 'King\'s Pawn Game';

  if (uciPath.startsWith('e2e4 e7e6 d2d4 d7d5')) return 'French Defense';
  if (uciPath.startsWith('e2e4 c7c6 d2d4 d7d5')) return 'Caro-Kann Defense';
  if (uciPath.startsWith('e2e4 d7d5 e4d5 d8d5')) return 'Scandinavian Defense';
  if (uciPath.startsWith('e2e4 g7g6 d2d4 f8g7')) return 'Modern Defense';
  if (uciPath.startsWith('e2e4 d7d6 d2d4 g8f6 b1c3 g7g6')) return 'Pirc Defense';
  if (uciPath.startsWith('e2e4')) return 'King\'s Pawn Opening';

  if (uciPath.startsWith('d2d4 g8f6 c2c4 e7e6 g1f3 d7d5 b1c3')) return 'Queen\'s Gambit Declined: Harrwitz Attack';
  if (uciPath.startsWith('d2d4 d7d5 c2c4 e7e6 g1f3 g8f6 b1c3')) return 'Queen\'s Gambit Declined: Semi-Slav';
  if (uciPath.startsWith('d2d4 d7d5 c2c4 e7e6')) return 'Queen\'s Gambit Declined';
  if (uciPath.startsWith('d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 e7e6')) return 'Semi-Slav Defense';
  if (uciPath.startsWith('d2d4 d7d5 c2c4 c7c6')) return 'Slav Defense';
  if (uciPath.startsWith('d2d4 d7d5 c2c4 e7e5')) return 'Albin Countergambit';
  if (uciPath.startsWith('d2d4 d7d5 c2c4')) return 'Queen\'s Gambit';
  if (uciPath.startsWith('d2d4 d7d5')) return 'Queen\'s Pawn Game';

  if (uciPath.startsWith('d2d4 g8f6 c2c4 g7g6 b1c3 d7d5')) return 'Grünfeld Defense';
  if (uciPath.startsWith('d2d4 g8f6 c2c4 g7g6 b1c3 f8g7')) return 'King\'s Indian Defense';
  if (uciPath.startsWith('d2d4 g8f6 c2c4 e7e6 g1f3 b7b6')) return 'Queen\'s Indian Defense';
  if (uciPath.startsWith('d2d4 g8f6 c2c4 e7e6 b1c3 f1b4')) return 'Nimzo-Indian Defense';
  if (uciPath.startsWith('d2d4 g8f6 c2c4 c7c5 d4d5 b7b5')) return 'Benko Gambit';
  if (uciPath.startsWith('d2d4 g8f6 c2c4 c7c5 d4d5 e7e6')) return 'Modern Benoni';
  if (uciPath.startsWith('d2d4 g8f6')) return 'Indian Game';

  if (uciPath.startsWith('c2c4 e7e5') || uciPath.startsWith('c2c4 c7c5') || uciPath.startsWith('c2c4 e7e6') || uciPath.startsWith('c2c4 g8f6')) return 'English Opening';
  if (uciPath.startsWith('g1f3')) return 'Réti Opening';
  if (uciPath.startsWith('f2f4')) return 'Bird\'s Opening';
  if (uciPath.startsWith('g2g3')) return 'Benko\'s Opening';
  if (uciPath.startsWith('b1c3')) return 'Dunst Opening';
  if (uciPath.startsWith('b2b3')) return 'Nimzowitsch-Larsen Attack';

  return 'Unknown Opening';
}
