import { useState, useEffect, useRef } from 'react';

interface GameClockProps {
  timeMs: number;
  isActive: boolean;
  isPlayerTurn: boolean;
  onTimeout?: () => void;
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const deciseconds = Math.floor((ms % 1000) / 100);

  if (totalSeconds < 20) {
    return `${seconds}.${deciseconds}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function GameClock({
  timeMs,
  isActive,
  isPlayerTurn,
  onTimeout,
}: GameClockProps) {
  const [displayTime, setDisplayTime] = useState(timeMs);
  const lastUpdateRef = useRef(Date.now());
  const animationRef = useRef<number>();

  useEffect(() => {
    setDisplayTime(timeMs);
    lastUpdateRef.current = Date.now();
  }, [timeMs]);

  useEffect(() => {
    if (!isActive || !isPlayerTurn) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      setDisplayTime((prev) => {
        const next = Math.max(0, prev - elapsed);
        if (next <= 0) {
          onTimeout?.();
          return 0;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, isPlayerTurn, onTimeout]);

  const totalSeconds = Math.floor(displayTime / 1000);
  const isWarning = totalSeconds <= 30 && totalSeconds > 10;
  const isCritical = totalSeconds <= 10;
  const isFlagged = displayTime <= 0;

  let color = 'var(--c-text)';
  let weight = 'var(--wt-normal)';

  if (isFlagged || isCritical) {
    color = 'var(--c-loss)';
    weight = 'var(--wt-bold)';
  } else if (isWarning) {
    color = 'var(--c-warn)';
    weight = 'var(--wt-medium)';
  }

  // Inactive clock: dim the text
  const opacity = (isPlayerTurn && isActive) ? 1 : 0.35;
  const isLessThan20s = totalSeconds < 20 && displayTime > 0;
  const fontSize = isLessThan20s ? 'calc(var(--tx-xl) * 1.1)' : 'var(--tx-xl)';

  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize,
        fontWeight: weight,
        color,
        opacity,
        minWidth: 80,
        textAlign: 'right',
        display: 'inline-block',
        transition: `color var(--dur-base) var(--ease-out)`,
      }}
    >
      {formatTime(displayTime)}
    </span>
  );
}
