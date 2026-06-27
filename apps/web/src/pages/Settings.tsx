import ChessBoard from '../components/Board/ChessBoard';
import { useSettingsStore, BoardTheme, PieceSet } from '../stores/settingsStore';

const BOARD_THEMES: { key: BoardTheme; label: string; lightColor: string; darkColor: string }[] = [
  { key: 'classic', label: 'Classic', lightColor: '#f0d9b5', darkColor: '#b58863' },
  { key: 'blue', label: 'Blue', lightColor: '#dee3e6', darkColor: '#8ca2ad' },
  { key: 'green', label: 'Green', lightColor: '#ffffdd', darkColor: '#86a666' },
  { key: 'purple', label: 'Purple', lightColor: '#9f90b0', darkColor: '#7d4a8d' },
  { key: 'pink', label: 'Pink', lightColor: '#f0d0e0', darkColor: '#c07090' },
];

const PIECE_SETS: { key: PieceSet; label: string }[] = [
  { key: 'standard', label: 'Standard' },
  { key: 'merida', label: 'Merida' },
  { key: 'alpha', label: 'Alpha' },
  { key: 'neo', label: 'Neo' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40,
        height: 20,
        borderRadius: 'var(--radius-full)',
        background: checked ? 'var(--c-gold)' : 'var(--c-border)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background var(--dur-fast) var(--ease-out)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: checked ? 22 : 2,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left var(--dur-fast) var(--ease-out)',
      }} />
    </div>
  );
}

export default function Settings() {
  const {
    boardTheme, setBoardTheme,
    pieceSet, setPieceSet,
    soundEnabled, setSoundEnabled,
    showCoordinates, setShowCoordinates,
    autoFlip, setAutoFlip,
  } = useSettingsStore();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--sp-5) var(--sp-4)' }}>
      <h1 style={{ fontSize: 'var(--tx-lg)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)', marginBottom: 'var(--sp-6)' }}>
        Settings
      </h1>

      {/* Board Theme */}
      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 style={{
          fontSize: 'var(--tx-xs)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text-2)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--sp-3)',
        }}>
          Board Theme
        </h2>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          {BOARD_THEMES.map((theme) => (
            <button
              key={theme.key}
              onClick={() => setBoardTheme(theme.key)}
              style={{
                padding: 'var(--sp-3)',
                border: `1px solid ${boardTheme === theme.key ? 'var(--c-gold)' : 'var(--c-border)'}`,
                borderRadius: 'var(--radius-md)',
                background: boardTheme === theme.key ? 'var(--c-elevated)' : 'var(--c-surface)',
                cursor: 'pointer',
                transition: 'border-color var(--dur-fast) var(--ease-out)',
              }}
            >
              <div style={{ display: 'flex', marginBottom: 'var(--sp-2)' }}>
                <div style={{ width: 24, height: 24, background: theme.lightColor }} />
                <div style={{ width: 24, height: 24, background: theme.darkColor }} />
              </div>
              <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text)', fontWeight: 'var(--wt-medium)' }}>
                {theme.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Piece Set */}
      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 style={{
          fontSize: 'var(--tx-xs)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text-2)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--sp-3)',
        }}>
          Piece Set
        </h2>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          {PIECE_SETS.map((set) => (
            <button
              key={set.key}
              onClick={() => setPieceSet(set.key)}
              style={{
                padding: 'var(--sp-3)',
                border: `1px solid ${pieceSet === set.key ? 'var(--c-gold)' : 'var(--c-border)'}`,
                borderRadius: 'var(--radius-md)',
                background: pieceSet === set.key ? 'var(--c-elevated)' : 'var(--c-surface)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'border-color var(--dur-fast) var(--ease-out)',
              }}
            >
              <span style={{ fontSize: 'var(--tx-xl)' }}>♞</span>
              <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text)', fontWeight: 'var(--wt-medium)', marginTop: 'var(--sp-1)' }}>
                {set.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Toggle Settings */}
      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 style={{
          fontSize: 'var(--tx-xs)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text-2)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--sp-3)',
        }}>
          Preferences
        </h2>

        {[
          { label: 'Sound Effects', desc: 'Play sounds on moves and game events', checked: soundEnabled, onChange: () => setSoundEnabled(!soundEnabled) },
          { label: 'Board Coordinates', desc: 'Show a-h and 1-8 labels', checked: showCoordinates, onChange: () => setShowCoordinates(!showCoordinates) },
          { label: 'Auto-Flip Board', desc: 'Orient the board to your color', checked: autoFlip, onChange: () => setAutoFlip(!autoFlip) },
        ].map((pref) => (
          <div
            key={pref.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--sp-2)',
              cursor: 'pointer',
            }}
            onClick={pref.onChange}
          >
            <div>
              <p style={{ fontSize: 'var(--tx-sm)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text)' }}>{pref.label}</p>
              <p style={{ fontSize: 'var(--tx-xs)', color: 'var(--c-text-2)' }}>{pref.desc}</p>
            </div>
            <Toggle checked={pref.checked} onChange={pref.onChange} />
          </div>
        ))}
      </section>

      {/* Preview */}
      <section>
        <h2 style={{
          fontSize: 'var(--tx-xs)', fontWeight: 'var(--wt-medium)', color: 'var(--c-text-2)',
          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--sp-3)',
        }}>
          Preview
        </h2>
        <div style={{ maxWidth: 320 }}>
          <ChessBoard
            fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
            interactive={false}
            showCoordinates={showCoordinates}
            size={320}
          />
        </div>
      </section>
    </div>
  );
}
