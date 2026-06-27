import { useCallback, useRef, useState, useEffect } from 'react';

interface StockfishEval {
  depth: number;
  score: { type: 'cp' | 'mate'; value: number };
  pv: string[];
  multipv: number;
}

interface UseStockfishReturn {
  isReady: boolean;
  isAnalyzing: boolean;
  evals: StockfishEval[];
  bestMove: string | null;
  depth: number;
  analyze: (fen: string, depth?: number) => void;
  stop: () => void;
  quit: () => void;
}

export function useStockfish(): UseStockfishReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evals, setEvals] = useState<StockfishEval[]>([]);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    // Try to load Stockfish WASM worker
    try {
      const blobCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
      const blob = new Blob([blobCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));

      worker.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data : String(e.data);

        if (line === 'uciok') {
          worker.postMessage('setoption name MultiPV value 3');
          worker.postMessage('isready');
        }

        if (line === 'readyok') {
          setIsReady(true);
        }

        // Parse "info" lines
        if (line.startsWith('info depth')) {
          const parsed = parseInfoLine(line);
          if (parsed) {
            setDepth(parsed.depth);
            setEvals((prev) => {
              const existing = prev.filter((e) => e.multipv !== parsed.multipv);
              return [...existing, parsed].sort((a, b) => a.multipv - b.multipv);
            });
          }
        }

        // Parse "bestmove"
        if (line.startsWith('bestmove')) {
          const parts = line.split(' ');
          setBestMove(parts[1] || null);
          setIsAnalyzing(false);
        }
      };

      worker.postMessage('uci');
      workerRef.current = worker;
    } catch (err) {
      console.warn('Stockfish worker failed to load:', err);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const analyze = useCallback((fen: string, analysisDepth = 20) => {
    if (!workerRef.current || !isReady) return;
    setIsAnalyzing(true);
    setEvals([]);
    setBestMove(null);
    workerRef.current.postMessage('stop');
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${analysisDepth}`);
  }, [isReady]);

  const stop = useCallback(() => {
    workerRef.current?.postMessage('stop');
    setIsAnalyzing(false);
  }, []);

  const quit = useCallback(() => {
    workerRef.current?.postMessage('quit');
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  return { isReady, isAnalyzing, evals, bestMove, depth, analyze, stop, quit };
}

function parseInfoLine(line: string): StockfishEval | null {
  try {
    const depthMatch = line.match(/depth (\d+)/);
    const multipvMatch = line.match(/multipv (\d+)/);
    const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
    const pvMatch = line.match(/ pv (.+)/);

    if (!depthMatch || !scoreMatch) return null;

    return {
      depth: parseInt(depthMatch[1]),
      score: {
        type: scoreMatch[1] as 'cp' | 'mate',
        value: parseInt(scoreMatch[2]),
      },
      pv: pvMatch ? pvMatch[1].split(' ') : [],
      multipv: multipvMatch ? parseInt(multipvMatch[1]) : 1,
    };
  } catch {
    return null;
  }
}
