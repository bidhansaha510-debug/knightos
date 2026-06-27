// Stockfish WASM Web Worker wrapper using cdnjs CDN
// This runs as a classic (non-module) worker so importScripts is available.

/* eslint-disable no-restricted-globals */

try {
  var cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
  
  // Import the CDN script inside the Web Worker
  importScripts(cdnUrl);
} catch (err) {
  console.error('Failed to load Stockfish from CDN:', err);
}
