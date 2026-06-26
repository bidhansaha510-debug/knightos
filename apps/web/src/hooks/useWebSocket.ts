import { useEffect, useRef, useCallback, useState } from 'react';
import { useUserStore } from '../stores/userStore';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnect = true,
  reconnectInterval = 2000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useUserStore((s) => s.accessToken);

  const messageQueueRef = useRef<string[]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = url.includes('?')
      ? `${url}&token=${accessToken}`
      : `${url}?token=${accessToken}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      onOpen?.();

      // Flush queued messages
      while (messageQueueRef.current.length > 0) {
        const msg = messageQueueRef.current.shift()!;
        ws.send(msg);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      onClose?.();

      if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      onError?.(error);
    };

    wsRef.current = ws;
  }, [url, accessToken, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval, maxReconnectAttempts]);

  const send = useCallback((data: any) => {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      messageQueueRef.current.push(message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnect
    wsRef.current?.close();
  }, [maxReconnectAttempts]);

  useEffect(() => {
    if (accessToken) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [accessToken]); // Reconnect when token changes

  return { send, disconnect, isConnected, connect };
}
