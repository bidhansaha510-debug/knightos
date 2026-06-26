import { create } from 'zustand';
import type { GameState, GameMove } from '@knightos/shared';

interface GameStoreState {
  gameState: GameState | null;
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  premove: { from: string; to: string; promotion?: string } | null;
  isFlipped: boolean;
  moveHistory: GameMove[];

  setGameState: (state: GameState) => void;
  setSelectedSquare: (square: string | null) => void;
  setLegalMoves: (moves: string[]) => void;
  setLastMove: (move: { from: string; to: string } | null) => void;
  setPremove: (move: { from: string; to: string; promotion?: string } | null) => void;
  toggleFlipped: () => void;
  setFlipped: (flipped: boolean) => void;
  addMove: (move: GameMove) => void;
  updateClocks: (whiteClock: number, blackClock: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  gameState: null,
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  premove: null,
  isFlipped: false,
  moveHistory: [],

  setGameState: (gameState) =>
    set({ gameState, moveHistory: gameState.moves || [] }),
  setSelectedSquare: (selectedSquare) => set({ selectedSquare }),
  setLegalMoves: (legalMoves) => set({ legalMoves }),
  setLastMove: (lastMove) => set({ lastMove }),
  setPremove: (premove) => set({ premove }),
  toggleFlipped: () => set((s) => ({ isFlipped: !s.isFlipped })),
  setFlipped: (isFlipped) => set({ isFlipped }),
  addMove: (move) =>
    set((s) => ({ moveHistory: [...s.moveHistory, move] })),
  updateClocks: (whiteClock, blackClock) =>
    set((s) => ({
      gameState: s.gameState
        ? { ...s.gameState, whiteClock, blackClock }
        : null,
    })),
  reset: () =>
    set({
      gameState: null,
      selectedSquare: null,
      legalMoves: [],
      lastMove: null,
      premove: null,
      moveHistory: [],
    }),
}));
