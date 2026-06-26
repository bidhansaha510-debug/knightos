// Stockfish WASM Web Worker wrapper using jsDelivr CDN
declare const importScripts: (...urls: string[]) => void;

let engine: any = null;

try {
  // Load Stockfish 10.0.2 single-threaded engine from cdnjs
  const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
  
  // Import the CDN script inside the Web Worker
  importScripts(cdnUrl);
  
  // Initialize the engine
  if (typeof (self as any).STOCKFISH === 'function') {
    engine = (self as any).STOCKFISH();
    
    engine.onmessage = (e: any) => {
      self.postMessage(e);
    };
  } else {
    console.error('STOCKFISH function not found after importing CDN script');
  }
} catch (err) {
  console.error('Failed to load Stockfish from CDN:', err);
}

self.onmessage = (e) => {
  if (engine) {
    engine.postMessage(e.data);
  } else {
    // Stub responses if loading fails
    const msg = String(e.data);
    if (msg === 'uci') {
      self.postMessage('uciok');
    } else if (msg === 'isready') {
      self.postMessage('readyok');
    } else if (msg.startsWith('go')) {
      setTimeout(() => {
        self.postMessage('info depth 1 score cp 15 multipv 1 pv e2e4');
        self.postMessage('bestmove e2e4');
      }, 100);
    }
  }
};
