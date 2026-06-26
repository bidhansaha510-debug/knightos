import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BoardTheme = 'classic' | 'blue' | 'green' | 'purple' | 'pink';
export type PieceSet = 'standard' | 'merida' | 'alpha' | 'neo';

interface SettingsState {
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  soundEnabled: boolean;
  showCoordinates: boolean;
  autoFlip: boolean;

  setBoardTheme: (theme: BoardTheme) => void;
  setPieceSet: (set: PieceSet) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setShowCoordinates: (show: boolean) => void;
  setAutoFlip: (auto: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      boardTheme: 'classic',
      pieceSet: 'standard',
      soundEnabled: true,
      showCoordinates: true,
      autoFlip: true,

      setBoardTheme: (boardTheme) => set({ boardTheme }),
      setPieceSet: (pieceSet) => set({ pieceSet }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setShowCoordinates: (showCoordinates) => set({ showCoordinates }),
      setAutoFlip: (autoFlip) => set({ autoFlip }),
    }),
    { name: 'knightos-settings' }
  )
);
