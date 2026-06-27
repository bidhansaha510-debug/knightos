import { useRef, useEffect } from 'react';
import type { GameMove } from '@knightos/shared';

interface MoveListProps {
  moves: GameMove[];
  currentMoveIndex?: number;
  onMoveClick?: (index: number) => void;
}

export default function MoveList({ moves, currentMoveIndex, onMoveClick }: MoveListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMoveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentMoveIndex, moves.length]);

  // Group moves into pairs
  const movePairs: Array<{ number: number; white: GameMove; black?: GameMove }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  const activeIdx = currentMoveIndex ?? moves.length - 1;

  return (
    <div
      ref={scrollRef}
      className="move-list-scrollbar"
      style={{
        overflowY: 'auto',
        flex: 1,
      }}
    >
      {movePairs.length === 0 && (
        <p style={{
          color: 'var(--c-text-3)',
          fontSize: 'var(--tx-sm)',
          padding: 'var(--sp-5) var(--sp-4)',
          textAlign: 'left',
        }}>
          No moves yet
        </p>
      )}
      {movePairs.map((pair) => {
        const whiteIdx = (pair.number - 1) * 2;
        const blackIdx = whiteIdx + 1;
        const isWhiteActive = activeIdx === whiteIdx;
        const isBlackActive = pair.black && activeIdx === blackIdx;

        return (
          <div
            key={pair.number}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 1fr',
              height: 32,
              alignItems: 'center',
              fontSize: 'var(--tx-sm)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {/* Move number */}
            <span style={{
              color: 'var(--c-text-3)',
              textAlign: 'right',
              paddingRight: 'var(--sp-2)',
              fontSize: 'var(--tx-xs)',
            }}>
              {pair.number}.
            </span>

            {/* White move */}
            <button
              ref={isWhiteActive ? activeMoveRef : null}
              onClick={() => onMoveClick?.(whiteIdx)}
              style={{
                background: isWhiteActive ? 'var(--c-elevated)' : 'transparent',
                border: 'none',
                borderLeft: isWhiteActive ? '2px solid var(--c-gold)' : '2px solid transparent',
                color: 'var(--c-text)',
                padding: '0 var(--sp-2)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                cursor: onMoveClick ? 'pointer' : 'default',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                transition: 'background-color var(--dur-fast) var(--ease-out)',
              }}
              onMouseEnter={(e) => {
                if (!isWhiteActive) e.currentTarget.style.background = 'var(--c-elevated)';
              }}
              onMouseLeave={(e) => {
                if (!isWhiteActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {pair.white.san}
            </button>

            {/* Black move */}
            {pair.black ? (
              <button
                ref={isBlackActive ? activeMoveRef : null}
                onClick={() => onMoveClick?.(blackIdx)}
                style={{
                  background: isBlackActive ? 'var(--c-elevated)' : 'transparent',
                  border: 'none',
                  borderLeft: isBlackActive ? '2px solid var(--c-gold)' : '2px solid transparent',
                  color: 'var(--c-text)',
                  padding: '0 var(--sp-2)',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: onMoveClick ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  transition: 'background-color var(--dur-fast) var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  if (!isBlackActive) e.currentTarget.style.background = 'var(--c-elevated)';
                }}
                onMouseLeave={(e) => {
                  if (!isBlackActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {pair.black.san}
              </button>
            ) : (
              <span />
            )}
          </div>
        );
      })}
    </div>
  );
}
