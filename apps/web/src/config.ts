export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getWsUrl = (path: string): string => {
  if (import.meta.env.VITE_API_URL) {
    // If VITE_API_URL is set, e.g. https://knightos-api.onrender.com,
    // we convert it to wss://knightos-api.onrender.com or ws://...
    const wsBase = import.meta.env.VITE_API_URL.replace(/^http/, 'ws');
    return `${wsBase}${path}`;
  }
  
  // Local development relative fallback
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
};
