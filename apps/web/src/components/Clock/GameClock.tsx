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
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const deciseconds = Math.floor((ms % 1000) / 100);

  if (totalSeconds < 20) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${deciseconds}`;
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
  const isLow = totalSeconds < 10;
  const isCritical = totalSeconds < 5;

  return (
    <div
      className={`
        font-mono text-xl font-semibold px-4 py-2 min-w-[120px] text-center
        transition-colors duration-200
        ${isPlayerTurn && isActive
          ? isLow
            ? 'bg-accent-red/20 text-accent-red'
            : 'bg-surface text-text-primary'
          : 'bg-base text-text-muted'
        }
        ${isCritical && isPlayerTurn && isActive ? 'clock-critical' : ''}
      `}
      style={{
        borderLeft: isPlayerTurn && isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
      }}
    >
      {formatTime(displayTime)}
    </div>
  );
}
