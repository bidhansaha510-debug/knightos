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
  const [showPromotion, setShowPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const settingsCoords = useSettingsStore((s) => s.showCoordinates);
  const boardTheme = useSettingsStore((s) => s.boardTheme);
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
  const coordSize = showCoordinates ? 16 : 0;
  const totalSize = boardSize + coordSize;

  const getSquareColor = useCallback(
    (col: number, row: number): string => {
      return (col + row) % 2 === 0 ? 'var(--sq-light)' : 'var(--sq-dark)';
    },
    []
  );

  const handleSquareClick = useCallback(
    (square: string) => {
      if (!interactive) return;

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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDragging({ piece, from: square, x, y });
      setInternalSelectedSquare(square);
      const moves = chess.moves({ square: square as ChessSquare, verbose: true });
      setInternalLegalMoves(moves.map((m) => m.to));

      try {
        boardRef.current?.setPointerCapture(e.pointerId);
      } catch {}
    },
    [interactive, pieces, chess]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const rect = boardRef.current!.getBoundingClientRect();
      setDragging((d) =>
        d ? { ...d, x: e.clientX - rect.left, y: e.clientY - rect.top } : null
      );
    },
    [dragging]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const rect = boardRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left - coordSize;
      const y = e.clientY - rect.top - coordSize;

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
      }

      try {
        boardRef.current?.releasePointerCapture(e.pointerId);
      } catch {}
      setDragging(null);
    },
    [dragging, squareSize, flipped, legalMoves, onMove, coordSize]
  );

  return (
    <div
      className={`board-theme-${boardTheme} select-none`}
      style={{ width: totalSize, height: totalSize }}
    >
      <svg
        ref={boardRef}
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        width={totalSize}
        height={totalSize}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ display: 'block' }}
      >
        {/* Coordinate labels */}
        {showCoordinates && (
          <>
            {/* File labels (bottom) */}
            {Array.from({ length: 8 }, (_, i) => {
              const file = flipped ? FILES[7 - i] : FILES[i];
              return (
                <text
                  key={`file-${i}`}
                  x={coordSize + i * squareSize + squareSize / 2}
                  y={totalSize - 2}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                >
                  {file}
                </text>
              );
            })}
            {/* Rank labels (left) */}
            {Array.from({ length: 8 }, (_, i) => {
              const rank = flipped ? RANKS[7 - i] : RANKS[i];
              return (
                <text
                  key={`rank-${i}`}
                  x={6}
                  y={coordSize + i * squareSize + squareSize / 2 + 4}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                >
                  {rank}
                </text>
              );
            })}
          </>
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
              overlay = (
                <rect
                  x={x} y={y} width={squareSize} height={squareSize}
                  fill="var(--sq-lastmove)"
                  pointerEvents="none"
                />
              );
            }

            // Selected square
            if (square === selectedSquare) {
              overlay = (
                <rect
                  x={x} y={y} width={squareSize} height={squareSize}
                  fill="var(--sq-selected)"
                  pointerEvents="none"
                />
              );
            }

            // Check highlight
            if (square === checkSquare) {
              overlay = (
                <circle
                  cx={x + squareSize / 2} cy={y + squareSize / 2}
                  r={squareSize / 2}
                  fill="rgba(255, 0, 0, 0.5)"
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

        {/* Legal move indicators */}
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
                stroke="var(--sq-legal)"
                strokeWidth={squareSize * 0.08}
                pointerEvents="none"
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
              fill="var(--sq-legal)"
              pointerEvents="none"
            />
          );
        })}

        {/* Pieces */}
        {Array.from(pieces.entries()).map(([square, piece]) => {
          const pieceKey = fenToPieceKey(piece);
          if (!pieceKey) return null;
          const pathData = PIECE_PATHS[pieceKey];
          if (!pathData) return null;

          // Skip piece being dragged from its original position
          if (dragging && square === dragging.from) return null;

          const { col, row } = squareToCoords(square, flipped);
          const x = coordSize + col * squareSize;
          const y = coordSize + row * squareSize;

          return (
            <g
              key={`piece-${square}`}
              transform={`translate(${x}, ${y})`}
              onPointerDown={(e) => handlePointerDown(e, square)}
              onClick={() => handleSquareClick(square)}
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
                const pathData = PIECE_PATHS[pieceKey];
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
                      fill="var(--bg-elevated)"
                      stroke="var(--accent-blue)"
                      strokeWidth={1.5}
                    />
                    <g transform={`translate(${x}, ${py})`}>
                      <g transform={`scale(${squareSize / 45})`}>
                        {pathData.paths.map((p, j) => (
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
