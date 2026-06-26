interface EvalBarProps {
  /** Centipawn evaluation from white's perspective. Positive = white advantage. */
  eval: number | null;
  /** Mate score. Positive = white mates in N. Negative = black mates in N. */
  mate: number | null;
}

function evalToPercentage(cp: number): number {
  // Sigmoid-like mapping: eval → visual percentage (0-100)
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * cp)) - 1);
}

export default function EvalBar({ eval: evalScore, mate }: EvalBarProps) {
  let whitePercent = 50;
  let displayText = '';

  if (mate !== null) {
    if (mate > 0) {
      whitePercent = 96; // 4px min for opponent
      displayText = `M${mate}`;
    } else {
      whitePercent = 4;
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
  const showInBlack = (evalScore !== null && evalScore < 0) || (mate !== null && mate < 0);
  const showInWhite = (evalScore !== null && evalScore >= 0) || (mate !== null && mate > 0);

  return (
    <div
      style={{
        width: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Black section (top) */}
      <div
        style={{
          background: 'var(--c-elevated)',
          height: `${blackPercent}%`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          transition: 'height 350ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          position: 'relative',
        }}
      >
        {showInBlack && (
          <span style={{
            color: 'var(--c-text)',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 'var(--weight-medium)',
            writingMode: 'vertical-lr',
            textOrientation: 'mixed',
            paddingTop: 4,
          }}>
            {displayText}
          </span>
        )}
      </div>

      {/* White section (bottom) */}
      <div
        style={{
          background: 'var(--c-text)',
          height: `${whitePercent}%`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          transition: 'height 350ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          position: 'relative',
        }}
      >
        {showInWhite && (
          <span style={{
            color: 'var(--c-base)',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            fontWeight: 'var(--weight-medium)',
            writingMode: 'vertical-lr',
            textOrientation: 'mixed',
            paddingBottom: 4,
          }}>
            {displayText}
          </span>
        )}
      </div>
    </div>
  );
}
