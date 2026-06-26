// SVG piece paths for the Standard chess piece set
// Each piece is defined as SVG path data designed for a 45x45 viewBox

export interface PiecePathData {
  paths: Array<{
    d: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: string;
    strokeLinejoin?: string;
  }>;
}

type PieceKey = 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP' | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP';

const WHITE_FILL = '#fff';
const WHITE_STROKE = '#000';
const BLACK_FILL = '#333';
const BLACK_STROKE = '#000';

export const PIECE_PATHS: Record<PieceKey, PiecePathData> = {
  // White King
  wK: {
    paths: [
      { d: 'M 22.5,11.63 L 22.5,6', stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 20,8 L 25,8', stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 12.5,30 C 18,27 27,27 32.5,30', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 12.5,37 C 18,34 27,34 32.5,37', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
    ],
  },
  // White Queen
  wQ: {
    paths: [
      { d: 'M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 Z', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M 9,26 C 9,28 10.5,28.5 12.5,30 C 14.5,31.5 16.5,31 16.5,31 C 18.5,30 19.5,30 22.5,30 C 25.5,30 26.5,30 28.5,31 C 28.5,31 30.5,31.5 32.5,30 C 34.5,28.5 36,28 36,26', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 27,31 22.5,31 C 18,31 12.5,30 12.5,30 L 12.5,37', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 12.5,30 C 18,27 27,27 32.5,30', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 12.5,37 C 18,34 27,34 32.5,37', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 6.5,13.5 A 1.5,1.5 0 1 1 9.5,13.5 A 1.5,1.5 0 1 1 6.5,13.5', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 13.3,10.9 A 1.5,1.5 0 1 1 16.3,10.9 A 1.5,1.5 0 1 1 13.3,10.9', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 21,10 A 1.5,1.5 0 1 1 24,10 A 1.5,1.5 0 1 1 21,10', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 29.7,10.9 A 1.5,1.5 0 1 1 32.7,10.9 A 1.5,1.5 0 1 1 29.7,10.9', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 37.5,13.5 A 1.5,1.5 0 1 1 40.5,13.5 A 1.5,1.5 0 1 1 37.5,13.5', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1 },
    ],
  },
  // White Rook
  wR: {
    paths: [
      { d: 'M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 Z', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 Z', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 34,14 L 31,17 L 14,17 L 11,14', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 31,17 L 31,29.5 L 14,29.5 L 14,17', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 14,29.5 L 12,32 L 33,32 L 31,29.5', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 14,17 L 14,29.5', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 31,17 L 31,29.5', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 12,36 L 33,36', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1 },
    ],
  },
  // White Bishop
  wB: {
    paths: [
      { d: 'M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 Z', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 Z', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 25,8 A 2.5,2.5 0 1 1 20,8 A 2.5,2.5 0 1 1 25,8 Z', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 17.5,26 L 27.5,26', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 15,30 L 30,30', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 22.5,15.5 L 22.5,20.5', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 20,18 L 25,18', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1 },
    ],
  },
  // White Knight
  wN: {
    paths: [
      { d: 'M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M 9.5,25.5 A 0.5,0.5 0 1 1 8.5,25.5 A 0.5,0.5 0 1 1 9.5,25.5 Z', fill: BLACK_FILL },
      { d: 'M 15,15.5 A 0.5,1.5 0 1 1 14,15.5 A 0.5,1.5 0 1 1 15,15.5 Z', fill: BLACK_FILL },
    ],
  },
  // White Pawn
  wP: {
    paths: [
      { d: 'M 22.5,9 C 19.79,9 17.61,11.18 17.61,13.89 C 17.61,15.16 18.13,16.3 18.97,17.12 C 16.5,18.29 14.82,20.82 14.82,23.75 C 14.82,24.73 15.03,25.66 15.39,26.5 C 13.09,27.74 11.5,30.18 11.5,33 C 11.5,33 13,36 22.5,36 C 32,36 33.5,33 33.5,33 C 33.5,30.18 31.91,27.74 29.61,26.5 C 29.97,25.66 30.18,24.73 30.18,23.75 C 30.18,20.82 28.5,18.29 26.03,17.12 C 26.87,16.3 27.39,15.16 27.39,13.89 C 27.39,11.18 25.21,9 22.5,9 Z', fill: WHITE_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
    ],
  },

  // Black King
  bK: {
    paths: [
      { d: 'M 22.5,11.63 L 22.5,6', stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 20,8 L 25,8', stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 12.5,30 C 18,27 27,27 32.5,30', fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
      { d: 'M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5', fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
      { d: 'M 12.5,37 C 18,34 27,34 32.5,37', fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
    ],
  },
  // Black Queen
  bQ: {
    paths: [
      { d: 'M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 Z', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M 9,26 C 9,28 10.5,28.5 12.5,30 C 14.5,31.5 16.5,31 16.5,31 C 18.5,30 19.5,30 22.5,30 C 25.5,30 26.5,30 28.5,31 C 28.5,31 30.5,31.5 32.5,30 C 34.5,28.5 36,28 36,26', fill: 'none', stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 27,31 22.5,31 C 18,31 12.5,30 12.5,30 L 12.5,37', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 12.5,30 C 18,27 27,27 32.5,30', fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
      { d: 'M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5', fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
      { d: 'M 12.5,37 C 18,34 27,34 32.5,37', fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
      { d: 'M 6.5,13.5 A 1.5,1.5 0 1 1 9.5,13.5 A 1.5,1.5 0 1 1 6.5,13.5', fill: '#fff', stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 13.3,10.9 A 1.5,1.5 0 1 1 16.3,10.9 A 1.5,1.5 0 1 1 13.3,10.9', fill: '#fff', stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 21,10 A 1.5,1.5 0 1 1 24,10 A 1.5,1.5 0 1 1 21,10', fill: '#fff', stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 29.7,10.9 A 1.5,1.5 0 1 1 32.7,10.9 A 1.5,1.5 0 1 1 29.7,10.9', fill: '#fff', stroke: WHITE_STROKE, strokeWidth: 1 },
      { d: 'M 37.5,13.5 A 1.5,1.5 0 1 1 40.5,13.5 A 1.5,1.5 0 1 1 37.5,13.5', fill: '#fff', stroke: WHITE_STROKE, strokeWidth: 1 },
    ],
  },
  // Black Rook
  bR: {
    paths: [
      { d: 'M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 Z', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 Z', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 34,14 L 31,17 L 14,17 L 11,14', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 31,17 L 31,29.5 L 14,29.5 L 14,17', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 14,29.5 L 12,32 L 33,32 L 31,29.5', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 14,17 L 14,29.5', fill: 'none', stroke: '#fff', strokeWidth: 1 },
      { d: 'M 31,17 L 31,29.5', fill: 'none', stroke: '#fff', strokeWidth: 1 },
      { d: 'M 12,36 L 33,36', fill: 'none', stroke: '#fff', strokeWidth: 1 },
    ],
  },
  // Black Bishop
  bB: {
    paths: [
      { d: 'M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 Z', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 Z', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
      { d: 'M 25,8 A 2.5,2.5 0 1 1 20,8 A 2.5,2.5 0 1 1 25,8 Z', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5 },
      { d: 'M 17.5,26 L 27.5,26', fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
      { d: 'M 15,30 L 30,30', fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
      { d: 'M 22.5,15.5 L 22.5,20.5', fill: 'none', stroke: '#fff', strokeWidth: 1 },
      { d: 'M 20,18 L 25,18', fill: 'none', stroke: '#fff', strokeWidth: 1 },
    ],
  },
  // Black Knight
  bN: {
    paths: [
      { d: 'M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M 9.5,25.5 A 0.5,0.5 0 1 1 8.5,25.5 A 0.5,0.5 0 1 1 9.5,25.5 Z', fill: '#fff' },
      { d: 'M 15,15.5 A 0.5,1.5 0 1 1 14,15.5 A 0.5,1.5 0 1 1 15,15.5 Z', fill: '#fff' },
    ],
  },
  // Black Pawn
  bP: {
    paths: [
      { d: 'M 22.5,9 C 19.79,9 17.61,11.18 17.61,13.89 C 17.61,15.16 18.13,16.3 18.97,17.12 C 16.5,18.29 14.82,20.82 14.82,23.75 C 14.82,24.73 15.03,25.66 15.39,26.5 C 13.09,27.74 11.5,30.18 11.5,33 C 11.5,33 13,36 22.5,36 C 32,36 33.5,33 33.5,33 C 33.5,30.18 31.91,27.74 29.61,26.5 C 29.97,25.66 30.18,24.73 30.18,23.75 C 30.18,20.82 28.5,18.29 26.03,17.12 C 26.87,16.3 27.39,15.16 27.39,13.89 C 27.39,11.18 25.21,9 22.5,9 Z', fill: BLACK_FILL, stroke: WHITE_STROKE, strokeWidth: 1.5, strokeLinecap: 'round' },
    ],
  },
};

// Map FEN piece characters to piece keys
export function fenToPieceKey(fenChar: string): PieceKey | null {
  const map: Record<string, PieceKey> = {
    K: 'wK', Q: 'wQ', R: 'wR', B: 'wB', N: 'wN', P: 'wP',
    k: 'bK', q: 'bQ', r: 'bR', b: 'bB', n: 'bN', p: 'bP',
  };
  return map[fenChar] || null;
}
