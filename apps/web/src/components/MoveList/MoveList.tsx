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

  // Group moves into pairs (1. e4 e5, 2. Nf3 Nc6, ...)
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
    <div className="bg-surface flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary font-display">Moves</h3>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 notation"
        style={{ maxHeight: '400px' }}
      >
        {movePairs.length === 0 && (
          <p className="text-text-muted text-xs text-center py-4">No moves yet</p>
        )}
        {movePairs.map((pair) => (
          <div key={pair.number} className="flex items-center text-sm mb-0.5">
            <span className="text-text-muted w-8 text-right mr-2 text-xs flex-shrink-0">
              {pair.number}.
            </span>
            <button
              ref={activeIdx === (pair.number - 1) * 2 ? activeMoveRef : null}
              onClick={() => onMoveClick?.((pair.number - 1) * 2)}
              className={`
                px-2 py-0.5 mr-1 flex-1 text-left hover:bg-elevated transition-colors
                ${activeIdx === (pair.number - 1) * 2
                  ? 'bg-accent-blue/20 text-accent-blue'
                  : 'text-text-primary'
                }
              `}
            >
              {pair.white.san}
            </button>
            {pair.black && (
              <button
                ref={activeIdx === (pair.number - 1) * 2 + 1 ? activeMoveRef : null}
                onClick={() => onMoveClick?.((pair.number - 1) * 2 + 1)}
                className={`
                  px-2 py-0.5 flex-1 text-left hover:bg-elevated transition-colors
                  ${activeIdx === (pair.number - 1) * 2 + 1
                    ? 'bg-accent-blue/20 text-accent-blue'
                    : 'text-text-primary'
                  }
                `}
              >
                {pair.black.san}
              </button>
            )}
            {!pair.black && <span className="flex-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
