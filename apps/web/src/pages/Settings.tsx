import ChessBoard from '../components/Board/ChessBoard';
import { useSettingsStore, BoardTheme, PieceSet } from '../stores/settingsStore';

const BOARD_THEMES: { key: BoardTheme; label: string; lightColor: string; darkColor: string }[] = [
  { key: 'classic', label: 'Classic Wood', lightColor: '#f0d9b5', darkColor: '#b58863' },
  { key: 'blue', label: 'Blue', lightColor: '#dee3e6', darkColor: '#8ca2ad' },
  { key: 'green', label: 'Green', lightColor: '#ffffdd', darkColor: '#86a666' },
  { key: 'purple', label: 'Purple Night', lightColor: '#9f90b0', darkColor: '#7d4a8d' },
  { key: 'pink', label: 'Pink', lightColor: '#f0d0e0', darkColor: '#c07090' },
];

const PIECE_SETS: { key: PieceSet; label: string }[] = [
  { key: 'standard', label: 'Standard' },
  { key: 'merida', label: 'Merida' },
  { key: 'alpha', label: 'Alpha' },
  { key: 'neo', label: 'Neo' },
];

export default function Settings() {
  const {
    boardTheme, setBoardTheme,
    pieceSet, setPieceSet,
    soundEnabled, setSoundEnabled,
    showCoordinates, setShowCoordinates,
    autoFlip, setAutoFlip,
  } = useSettingsStore();

  return (
    <div className="min-h-screen bg-base p-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold font-display text-text-primary">Settings</h1>

        {/* Board Theme */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Board Theme</h2>
          <div className="grid grid-cols-5 gap-3">
            {BOARD_THEMES.map((theme) => (
              <button
                key={theme.key}
                onClick={() => setBoardTheme(theme.key)}
                className={`
                  p-3 border transition-all
                  ${boardTheme === theme.key
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-border bg-surface hover:border-accent-blue/50'
                  }
                `}
              >
                <div className="flex mb-2">
                  <div className="w-6 h-6" style={{ backgroundColor: theme.lightColor }} />
                  <div className="w-6 h-6" style={{ backgroundColor: theme.darkColor }} />
                </div>
                <p className="text-text-primary text-xs font-semibold">{theme.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Piece Set */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Piece Set</h2>
          <div className="grid grid-cols-4 gap-3">
            {PIECE_SETS.map((set) => (
              <button
                key={set.key}
                onClick={() => setPieceSet(set.key)}
                className={`
                  p-3 border transition-all text-center
                  ${pieceSet === set.key
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-border bg-surface hover:border-accent-blue/50'
                  }
                `}
              >
                <span className="text-2xl">♞</span>
                <p className="text-text-primary text-xs font-semibold mt-1">{set.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Toggle Settings */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Preferences</h2>

          <label className="flex items-center justify-between bg-surface border border-border p-4 cursor-pointer hover:bg-elevated transition-colors">
            <div>
              <p className="text-text-primary text-sm font-semibold">Sound Effects</p>
              <p className="text-text-muted text-xs">Play sounds on moves, captures, and game events</p>
            </div>
            <div
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`
                w-10 h-5 relative transition-colors cursor-pointer
                ${soundEnabled ? 'bg-accent-blue' : 'bg-border'}
              `}
            >
              <div className={`
                absolute top-0.5 w-4 h-4 bg-white transition-transform
                ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}
              `} />
            </div>
          </label>

          <label className="flex items-center justify-between bg-surface border border-border p-4 cursor-pointer hover:bg-elevated transition-colors">
            <div>
              <p className="text-text-primary text-sm font-semibold">Board Coordinates</p>
              <p className="text-text-muted text-xs">Show a-h and 1-8 labels on the board</p>
            </div>
            <div
              onClick={() => setShowCoordinates(!showCoordinates)}
              className={`
                w-10 h-5 relative transition-colors cursor-pointer
                ${showCoordinates ? 'bg-accent-blue' : 'bg-border'}
              `}
            >
              <div className={`
                absolute top-0.5 w-4 h-4 bg-white transition-transform
                ${showCoordinates ? 'translate-x-5' : 'translate-x-0.5'}
              `} />
            </div>
          </label>

          <label className="flex items-center justify-between bg-surface border border-border p-4 cursor-pointer hover:bg-elevated transition-colors">
            <div>
              <p className="text-text-primary text-sm font-semibold">Auto-Flip Board</p>
              <p className="text-text-muted text-xs">Automatically orient the board to your color</p>
            </div>
            <div
              onClick={() => setAutoFlip(!autoFlip)}
              className={`
                w-10 h-5 relative transition-colors cursor-pointer
                ${autoFlip ? 'bg-accent-blue' : 'bg-border'}
              `}
            >
              <div className={`
                absolute top-0.5 w-4 h-4 bg-white transition-transform
                ${autoFlip ? 'translate-x-5' : 'translate-x-0.5'}
              `} />
            </div>
          </label>
        </section>

        {/* Preview */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Preview</h2>
          <div className="flex justify-center">
            <ChessBoard
              fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
              interactive={false}
              showCoordinates={showCoordinates}
              size={320}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
