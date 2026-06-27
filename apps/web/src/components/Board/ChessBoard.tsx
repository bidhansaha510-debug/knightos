import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Chess, Square as ChessSquare } from 'chess.js';
import { PIECE_PATHS, fenToPieceKey } from './pieces';
import { useSettingsStore } from '../../stores/settingsStore';

interface ChessBoardProps {
  fen?: string;
  flipped?: boolean;
  interactive?: boolean;
  onMove?: (from: string, to: string, promotion?: string) => boolean | void;
  selectedSquare?: string | null;
  legalMoves?: string[];
  lastMove?: { from: string; to: string } | null;
  showCoordinates?: boolean;
  highlightSquares?: Map<string, string>; // square -> color
  arrows?: Array<{ from: string; to: string; color?: string }>;
  checkSquare?: string | null;
  size?: number;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function squareToCoords(square: string, flipped: boolean): { col: number; row: number } {
  const file = square.charCodeAt(0) - 97; // a=0, h=7
  const rank = 8 - parseInt(square[1]);    // 8=0, 1=7
  if (flipped) {
    return { col: 7 - file, row: 7 - rank };
  }
  return { col: file, row: rank };
}

function coordsToSquare(col: number, row: number, flipped: boolean): string {
  if (flipped) {
    col = 7 - col;
    row = 7 - row;
  }
  return FILES[col] + RANKS[row];
}

// Parse FEN to get piece positions
function parseFen(fen: string): Map<string, string> {
  const pieces = new Map<string, string>();
  const position = fen.split(' ')[0];
  const rows = position.split('/');

  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const char of rows[rank]) {
      if (char >= '1' && char <= '8') {
        file += parseInt(char);
      } else {
        const square = FILES[file] + RANKS[rank];
        pieces.set(square, char);
        file++;
      }
    }
  }
  return pieces;
}

export default function ChessBoard({
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  flipped = false,
  interactive = true,
  onMove,
  selectedSquare: externalSelectedSquare,
  legalMoves: externalLegalMoves,
  lastMove,
  showCoordinates: showCoordsProp,
  highlightSquares,
  arrows = [],
  checkSquare,
  size,
}: ChessBoardProps) {
  const boardRef = useRef<SVGSVGElement>(null);
  const [internalSelectedSquare, setInternalSelectedSquare] = useState<string | null>(null);
  const [internalLegalMoves, setInternalLegalMoves] = useState<string[]>([]);
  const [dragging, setDragging] = useState<{
    piece: string;
    from: string;
    x: number;
    y: number;
  } | null>(null);
  const pointerHandledRef = useRef(false);
  const [showPromotion, setShowPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const settingsCoords = useSettingsStore((s) => s.showCoordinates);
  const boardTheme = useSettingsStore((s) => s.boardTheme);
  const pieceSet = useSettingsStore((s) => s.pieceSet);
  const showCoordinates = showCoordsProp ?? settingsCoords;

  const selectedSquare = externalSelectedSquare !== undefined ? externalSelectedSquare : internalSelectedSquare;
  const legalMoves = externalLegalMoves !== undefined ? externalLegalMoves : internalLegalMoves;

  const pieces = useMemo(() => parseFen(fen), [fen]);
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  // Board dimensions
  const boardSize = size || 560;
  const squareSize = boardSize / 8;
  const coordSize = 0;
  const totalSize = boardSize;

  const getSquareColor = useCallback(
    (col: number, row: number): string => {
      return (col + row) % 2 === 0 ? 'var(--c-sq-light)' : 'var(--c-sq-dark)';
    },
    []
  );

  const handleSquareClick = useCallback(
    (square: string) => {
      if (!interactive) return;

      // If pointer interaction (drag/click on piece) already handled this, skip
      if (pointerHandledRef.current) {
        pointerHandledRef.current = false;
        return;
      }

      if (selectedSquare === square) {
        // Deselect
        setInternalSelectedSquare(null);
        setInternalLegalMoves([]);
        return;
      }

      if (selectedSquare && legalMoves.includes(square)) {
        // Check if promotion
        const piece = pieces.get(selectedSquare);
        const isPromotion =
          piece &&
          (piece === 'P' || piece === 'p') &&
          (square[1] === '8' || square[1] === '1');

        if (isPromotion) {
          setShowPromotion({ from: selectedSquare, to: square });
          return;
        }

        // Make move
        const result = onMove?.(selectedSquare, square);
        setInternalSelectedSquare(null);
        setInternalLegalMoves([]);
        return;
      }

      // Select new piece
      const piece = pieces.get(square);
      if (piece) {
        const isWhitePiece = piece === piece.toUpperCase();
        const isWhiteTurn = chess.turn() === 'w';
        if ((isWhitePiece && isWhiteTurn) || (!isWhitePiece && !isWhiteTurn)) {
          setInternalSelectedSquare(square);
          const moves = chess.moves({ square: square as ChessSquare, verbose: true });
          setInternalLegalMoves(moves.map((m) => m.to));
        }
      } else {
        // Clicked empty square with no selection or not a legal move — deselect
        setInternalSelectedSquare(null);
        setInternalLegalMoves([]);
      }
    },
    [interactive, selectedSquare, legalMoves, pieces, chess, onMove]
  );

  const handlePromotion = useCallback(
    (promotionPiece: string) => {
      if (!showPromotion) return;
      onMove?.(showPromotion.from, showPromotion.to, promotionPiece);
      setShowPromotion(null);
      setInternalSelectedSquare(null);
      setInternalLegalMoves([]);
    },
    [showPromotion, onMove]
  );

  // Drag and drop handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, square: string) => {
      if (!interactive) return;
      const piece = pieces.get(square);
      if (!piece) return;

      const isWhitePiece = piece === piece.toUpperCase();
      const isWhiteTurn = chess.turn() === 'w';
      if ((isWhitePiece && !isWhiteTurn) || (!isWhitePiece && isWhiteTurn)) return;

      const rect = boardRef.current!.getBoundingClientRect();
      const scale = totalSize / rect.width;
      const x = (e.clientX - rect.left) * scale;
      const y = (e.clientY - rect.top) * scale;

      pointerHandledRef.current = true;
      setDragging({ piece, from: square, x, y });
      setInternalSelectedSquare(square);
      const moves = chess.moves({ square: square as ChessSquare, verbose: true });
      setInternalLegalMoves(moves.map((m) => m.to));

      try {
        boardRef.current?.setPointerCapture(e.pointerId);
      } catch {}
    },
    [interactive, pieces, chess, totalSize]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const rect = boardRef.current!.getBoundingClientRect();
      const scale = totalSize / rect.width;
      setDragging((d) =>
        d ? { ...d, x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale } : null
      );
    },
    [dragging, totalSize]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const rect = boardRef.current!.getBoundingClientRect();
      const scale = totalSize / rect.width;
      const x = (e.clientX - rect.left) * scale - coordSize;
      const y = (e.clientY - rect.top) * scale - coordSize;

      const col = Math.floor(x / squareSize);
      const row = Math.floor(y / squareSize);

      if (col >= 0 && col < 8 && row >= 0 && row < 8) {
        const targetSquare = coordsToSquare(col, row, flipped);

        if (targetSquare !== dragging.from && legalMoves.includes(targetSquare)) {
          const isPromotion =
            (dragging.piece === 'P' || dragging.piece === 'p') &&
            (targetSquare[1] === '8' || targetSquare[1] === '1');

          if (isPromotion) {
            setShowPromotion({ from: dragging.from, to: targetSquare });
          } else {
            onMove?.(dragging.from, targetSquare);
            setInternalSelectedSquare(null);
            setInternalLegalMoves([]);
          }
        }
        // If dropped on the same square (click), keep piece selected with legal moves showing
      }

      try {
        boardRef.current?.releasePointerCapture(e.pointerId);
      } catch {}
      setDragging(null);
    },
    [dragging, squareSize, flipped, legalMoves, onMove, coordSize, totalSize]
  );

  return (
    <div
      className={`board-theme-${boardTheme} select-none w-full h-full max-w-full aspect-square`}
      style={{ maxWidth: totalSize, maxHeight: totalSize }}
    >
      <svg
        ref={boardRef}
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        width="100%"
        height="100%"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ display: 'block' }}
      >
        {/* Coordinate labels inside the squares */}
        {showCoordinates && (
          <g pointerEvents="none" style={{ userSelect: 'none' }}>
            {/* File labels (bottom row: row = 7) */}
            {Array.from({ length: 8 }, (_, col) => {
              const file = flipped ? FILES[7 - col] : FILES[col];
              const isLight = (col + 7) % 2 === 0;
              const textColor = isLight ? 'var(--c-sq-dark)' : 'var(--c-sq-light)';
              return (
                <text
                  key={`file-label-${col}`}
                  x={(col + 1) * squareSize - 3}
                  y={8 * squareSize - 3}
                  textAnchor="end"
                  fill={textColor}
                  fontSize="10"
                  fontWeight="var(--wt-bold)"
                  fontFamily="Inter, sans-serif"
                >
                  {file}
                </text>
              );
            })}
            {/* Rank labels (rightmost column: col = 7) */}
            {Array.from({ length: 8 }, (_, row) => {
              const rank = flipped ? RANKS[7 - row] : RANKS[row];
              const isLight = (7 + row) % 2 === 0;
              const textColor = isLight ? 'var(--c-sq-dark)' : 'var(--c-sq-light)';
              return (
                <text
                  key={`rank-label-${row}`}
                  x={8 * squareSize - 3}
                  y={row * squareSize + 10}
                  textAnchor="end"
                  fill={textColor}
                  fontSize="10"
                  fontWeight="var(--wt-bold)"
                  fontFamily="Inter, sans-serif"
                >
                  {rank}
                </text>
              );
            })}
          </g>
        )}

        {/* Board squares */}
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            const square = coordsToSquare(col, row, flipped);
            const x = coordSize + col * squareSize;
            const y = coordSize + row * squareSize;
            const baseColor = getSquareColor(col, row);

            let bgColor = baseColor;
            let overlay = null;

            // Last move highlight
            if (lastMove && (square === lastMove.from || square === lastMove.to)) {
              const lastMoveColor = (col + row) % 2 === 0 ? 'var(--c-sq-last-l)' : 'var(--c-sq-last-d)';
              overlay = (
                <rect
                  x={x} y={y} width={squareSize} height={squareSize}
                  fill={lastMoveColor}
                  pointerEvents="none"
                />
              );
            }

            // Selected square
            if (square === selectedSquare) {
              overlay = (
                <rect
                  x={x} y={y} width={squareSize} height={squareSize}
                  fill="var(--c-sq-select)"
                  pointerEvents="none"
                />
              );
            }

            // Check highlight
            if (square === checkSquare) {
              overlay = (
                <rect
                  x={x} y={y} width={squareSize} height={squareSize}
                  fill="var(--c-sq-check)"
                  pointerEvents="none"
                />
              );
            }

            // Custom highlights
            if (highlightSquares?.has(square)) {
              overlay = (
                <rect
                  x={x} y={y} width={squareSize} height={squareSize}
                  fill={highlightSquares.get(square)!}
                  pointerEvents="none"
                />
              );
            }

            return (
              <g key={square}>
                <rect
                  x={x}
                  y={y}
                  width={squareSize}
                  height={squareSize}
                  fill={bgColor}
                  onClick={() => handleSquareClick(square)}
                  className="cursor-pointer"
                />
                {overlay}
              </g>
            );
          })
        )}

        {/* Legal move indicators — clickable to make a move */}
        {legalMoves.map((square) => {
          const { col, row } = squareToCoords(square, flipped);
          const x = coordSize + col * squareSize;
          const y = coordSize + row * squareSize;
          const hasPiece = pieces.has(square);

          if (hasPiece) {
            // Ring for captures
            return (
              <circle
                key={`legal-${square}`}
                cx={x + squareSize / 2}
                cy={y + squareSize / 2}
                r={squareSize * 0.42}
                fill="none"
                stroke="var(--c-sq-legal)"
                strokeWidth={squareSize * 0.08}
                onClick={() => handleSquareClick(square)}
                className="cursor-pointer"
              />
            );
          }

          // Dot for empty squares
          return (
            <circle
              key={`legal-${square}`}
              cx={x + squareSize / 2}
              cy={y + squareSize / 2}
              r={squareSize * 0.14}
              fill="var(--c-sq-legal)"
              onClick={() => handleSquareClick(square)}
              className="cursor-pointer"
            />
          );
        })}

        {/* Pieces */}
        {Array.from(pieces.entries()).map(([square, piece]) => {
          const pieceKey = fenToPieceKey(piece);
          if (!pieceKey) return null;

          // Skip piece being dragged from its original position
          if (dragging && square === dragging.from) return null;

          const { col, row } = squareToCoords(square, flipped);
          const x = coordSize + col * squareSize;
          const y = coordSize + row * squareSize;

          if (pieceSet && pieceSet !== 'standard') {
            return (
              <g
                key={`piece-${square}`}
                transform={`translate(${x}, ${y})`}
                onPointerDown={(e) => handlePointerDown(e, square)}
                className="cursor-pointer"
                style={{ touchAction: 'none' }}
              >
                <image
                  href={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${pieceSet}/${pieceKey}.svg`}
                  width={squareSize}
                  height={squareSize}
                />
              </g>
            );
          }

          const pathData = PIECE_PATHS[pieceKey];
          if (!pathData) return null;

          return (
            <g
              key={`piece-${square}`}
              transform={`translate(${x}, ${y})`}
              onPointerDown={(e) => handlePointerDown(e, square)}
              className="cursor-pointer"
              style={{ touchAction: 'none' }}
            >
              <g transform={`scale(${squareSize / 45})`}>
                {pathData.paths.map((p, i) => (
                  <path
                    key={i}
                    d={p.d}
                    fill={p.fill || 'none'}
                    stroke={p.stroke || 'none'}
                    strokeWidth={p.strokeWidth || 0}
                    strokeLinecap={(p.strokeLinecap as any) || undefined}
                    strokeLinejoin={(p.strokeLinejoin as any) || undefined}
                  />
                ))}
              </g>
            </g>
          );
        })}

        {/* Dragging piece */}
        {dragging && (() => {
          const pieceKey = fenToPieceKey(dragging.piece);
          if (!pieceKey) return null;

          if (pieceSet && pieceSet !== 'standard') {
            return (
              <g
                transform={`translate(${dragging.x - squareSize / 2}, ${dragging.y - squareSize / 2})`}
                pointerEvents="none"
                style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}
              >
                <image
                  href={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${pieceSet}/${pieceKey}.svg`}
                  width={squareSize * 1.1}
                  height={squareSize * 1.1}
                />
              </g>
            );
          }

          const pathData = PIECE_PATHS[pieceKey];
          if (!pathData) return null;

          return (
            <g
              transform={`translate(${dragging.x - squareSize / 2}, ${dragging.y - squareSize / 2})`}
              pointerEvents="none"
              style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}
            >
              <g transform={`scale(${(squareSize * 1.1) / 45})`}>
                {pathData.paths.map((p, i) => (
                  <path
                    key={i}
                    d={p.d}
                    fill={p.fill || 'none'}
                    stroke={p.stroke || 'none'}
                    strokeWidth={p.strokeWidth || 0}
                    strokeLinecap={(p.strokeLinecap as any) || undefined}
                    strokeLinejoin={(p.strokeLinejoin as any) || undefined}
                  />
                ))}
              </g>
            </g>
          );
        })()}

        {/* Arrows */}
        {arrows.map((arrow, i) => {
          const fromCoords = squareToCoords(arrow.from, flipped);
          const toCoords = squareToCoords(arrow.to, flipped);
          const x1 = coordSize + fromCoords.col * squareSize + squareSize / 2;
          const y1 = coordSize + fromCoords.row * squareSize + squareSize / 2;
          const x2 = coordSize + toCoords.col * squareSize + squareSize / 2;
          const y2 = coordSize + toCoords.row * squareSize + squareSize / 2;

          return (
            <g key={`arrow-${i}`} pointerEvents="none">
              <defs>
                <marker
                  id={`arrowhead-${i}`}
                  markerWidth="8" markerHeight="6"
                  refX="7" refY="3"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    fill={arrow.color || 'rgba(59, 130, 246, 0.8)'}
                  />
                </marker>
              </defs>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={arrow.color || 'rgba(59, 130, 246, 0.8)'}
                strokeWidth={squareSize * 0.12}
                strokeLinecap="round"
                markerEnd={`url(#arrowhead-${i})`}
                opacity={0.8}
              />
            </g>
          );
        })}

        {/* Promotion dialog */}
        {showPromotion && (() => {
          const { col } = squareToCoords(showPromotion.to, flipped);
          const isWhite = showPromotion.to[1] === '8';
          const promotionPieces = isWhite
            ? ['Q', 'R', 'B', 'N']
            : ['q', 'r', 'b', 'n'];
          const x = coordSize + col * squareSize;
          const startY = isWhite !== flipped ? coordSize : coordSize + 4 * squareSize;

          return (
            <>
              {/* Backdrop */}
              <rect
                x={0} y={0}
                width={totalSize} height={totalSize}
                fill="rgba(0,0,0,0.5)"
                onClick={() => setShowPromotion(null)}
              />
              {/* Promotion options */}
              {promotionPieces.map((piece, i) => {
                const pieceKey = fenToPieceKey(piece);
                if (!pieceKey) return null;
                const py = startY + i * squareSize;

                return (
                  <g
                    key={piece}
                    onClick={() => handlePromotion(piece.toLowerCase())}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x} y={py}
                      width={squareSize} height={squareSize}
                      fill="var(--c-elevated)"
                      stroke="var(--c-gold)"
                      strokeWidth={1.5}
                    />
                    {pieceSet && pieceSet !== 'standard' ? (
                      <g transform={`translate(${x}, ${py})`}>
                        <image
                          href={`https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/${pieceSet}/${pieceKey}.svg`}
                          width={squareSize}
                          height={squareSize}
                        />
                      </g>
                    ) : (
                      <g transform={`translate(${x}, ${py})`}>
                        <g transform={`scale(${squareSize / 45})`}>
                          {PIECE_PATHS[pieceKey]?.paths.map((p, j) => (
                            <path
                              key={j}
                              d={p.d}
                              fill={p.fill || 'none'}
                              stroke={p.stroke || 'none'}
                              strokeWidth={p.strokeWidth || 0}
                              strokeLinecap={(p.strokeLinecap as any) || undefined}
                              strokeLinejoin={(p.strokeLinejoin as any) || undefined}
                            />
                          ))}
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </>
          );
        })()}
      </svg>
    </div>
  );
}
