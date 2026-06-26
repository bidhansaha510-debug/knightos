interface EvalBarProps {
  /** Centipawn evaluation from white's perspective. Positive = white advantage. */
  eval: number | null;
  /** Mate score. Positive = white mates in N. Negative = black mates in N. */
  mate: number | null;
  /** Height of the eval bar in pixels */
  height?: number;
}

function evalToPercentage(cp: number): number {
  // Sigmoid-like mapping: eval → visual percentage (0-100)
  // At 0cp → 50%, at +300cp → ~75%, at +1000cp → ~95%
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * cp)) - 1);
}

export default function EvalBar({ eval: evalScore, mate, height = 400 }: EvalBarProps) {
  let whitePercent = 50;
  let displayText = '';

  if (mate !== null) {
    if (mate > 0) {
      whitePercent = 100;
      displayText = `M${mate}`;
    } else {
      whitePercent = 0;
      displayText = `M${Math.abs(mate)}`;
    }
  } else if (evalScore !== null) {
    whitePercent = evalToPercentage(evalScore);
    const absEval = Math.abs(evalScore) / 100;
    displayText = evalScore >= 0
      ? `+${absEval.toFixed(1)}`
      : `-${absEval.toFixed(1)}`;
  }

  const blackPercent = 100 - whitePercent;

  return (
    <div
      className="relative flex flex-col w-7 overflow-hidden"
      style={{ height }}
    >
      {/* Black section (top) */}
      <div
        className="bg-[#333] transition-all duration-500 ease-out flex items-start justify-center"
        style={{ height: `${blackPercent}%` }}
      >
        {evalScore !== null && evalScore < 0 && (
          <span className="text-white text-[10px] font-mono mt-1 font-bold">
            {displayText}
          </span>
        )}
        {mate !== null && mate < 0 && (
          <span className="text-white text-[10px] font-mono mt-1 font-bold">
            {displayText}
          </span>
        )}
      </div>

      {/* White section (bottom) */}
      <div
        className="bg-white transition-all duration-500 ease-out flex items-end justify-center"
        style={{ height: `${whitePercent}%` }}
      >
        {evalScore !== null && evalScore >= 0 && (
          <span className="text-black text-[10px] font-mono mb-1 font-bold">
            {displayText}
          </span>
        )}
        {mate !== null && mate > 0 && (
          <span className="text-black text-[10px] font-mono mb-1 font-bold">
            {displayText}
          </span>
        )}
      </div>
    </div>
  );
}
