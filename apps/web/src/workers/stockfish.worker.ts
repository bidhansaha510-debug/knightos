// Stockfish WASM Web Worker wrapper
// This worker proxies messages to the Stockfish engine

let engine: Worker | null = null;

// Try to load stockfish from the npm package
try {
  // The stockfish npm package exposes the engine as a script
  // In production, copy stockfish files to public/ and reference directly
  // For dev, we create a simple passthrough
  
  // Check if we can create the actual Stockfish worker
  const stockfishUrl = '/stockfish/stockfish-nnue-16-single.js';
  
  engine = new Worker(stockfishUrl);
  
  engine.onmessage = (e) => {
    self.postMessage(e.data);
  };
} catch (err) {
  // Stockfish not available — use a stub that returns static evals
  console.warn('Stockfish WASM not available, using stub');
}

self.onmessage = (e) => {
  if (engine) {
    engine.postMessage(e.data);
  } else {
    // Stub responses for development without Stockfish
    const msg = String(e.data);
    if (msg === 'uci') {
      self.postMessage('uciok');
    } else if (msg === 'isready') {
      self.postMessage('readyok');
    } else if (msg.startsWith('go')) {
      // Return a dummy eval after a short delay
      setTimeout(() => {
        self.postMessage('info depth 1 score cp 15 multipv 1 pv e2e4');
        self.postMessage('bestmove e2e4');
      }, 100);
    }
  }
};
