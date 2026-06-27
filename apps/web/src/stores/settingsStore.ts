import { create } from 'zustand';

export type BoardTheme = 'classic' | 'blue' | 'green' | 'purple' | 'pink';
export type PieceSet = 'standard' | 'merida' | 'alpha' | 'neo';

export const getSettingsKey = (userId?: string | null) => `knightos-settings-${userId || 'guest'}`;

export const loadSettings = (userId?: string | null) => {
  try {
    const raw = localStorage.getItem(getSettingsKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {
    boardTheme: 'green' as BoardTheme,
    pieceSet: 'standard' as PieceSet,
    soundEnabled: true,
    showCoordinates: true,
    autoFlip: true,
  };
};

export const saveSettings = (userId: string | null, settings: {
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  soundEnabled: boolean;
  showCoordinates: boolean;
  autoFlip: boolean;
}) => {
  try {
    localStorage.setItem(getSettingsKey(userId), JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

interface SettingsState {
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  soundEnabled: boolean;
  showCoordinates: boolean;
  autoFlip: boolean;

  setBoardTheme: (theme: BoardTheme, userId?: string | null) => void;
  setPieceSet: (set: PieceSet, userId?: string | null) => void;
  setSoundEnabled: (enabled: boolean, userId?: string | null) => void;
  setShowCoordinates: (show: boolean, userId?: string | null) => void;
  setAutoFlip: (auto: boolean, userId?: string | null) => void;
  initSettings: (userId?: string | null) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  boardTheme: 'green',
  pieceSet: 'standard',
  soundEnabled: true,
  showCoordinates: true,
  autoFlip: true,

  setBoardTheme: (boardTheme, userId) => {
    set({ boardTheme });
    const { pieceSet, soundEnabled, showCoordinates, autoFlip } = get();
    saveSettings(userId ?? null, { boardTheme, pieceSet, soundEnabled, showCoordinates, autoFlip });
  },
  setPieceSet: (pieceSet, userId) => {
    set({ pieceSet });
    const { boardTheme, soundEnabled, showCoordinates, autoFlip } = get();
    saveSettings(userId ?? null, { boardTheme, pieceSet, soundEnabled, showCoordinates, autoFlip });
  },
  setSoundEnabled: (soundEnabled, userId) => {
    set({ soundEnabled });
    const { boardTheme, pieceSet, showCoordinates, autoFlip } = get();
    saveSettings(userId ?? null, { boardTheme, pieceSet, soundEnabled, showCoordinates, autoFlip });
  },
  setShowCoordinates: (showCoordinates, userId) => {
    set({ showCoordinates });
    const { boardTheme, pieceSet, soundEnabled, autoFlip } = get();
    saveSettings(userId ?? null, { boardTheme, pieceSet, soundEnabled, showCoordinates, autoFlip });
  },
  setAutoFlip: (autoFlip, userId) => {
    set({ autoFlip });
    const { boardTheme, pieceSet, soundEnabled, showCoordinates } = get();
    saveSettings(userId ?? null, { boardTheme, pieceSet, soundEnabled, showCoordinates, autoFlip });
  },
  initSettings: (userId) => {
    const loaded = loadSettings(userId);
    set(loaded);
  },
}));
