import { useEffect, useRef, useState, useCallback } from 'react';
import type { AlertEvent } from '../types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertEvent['data'][]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const token = localStorage.getItem('safevision_token');
    if (!token) return;

    const wsUrl =
      (import.meta.env.VITE_WS_URL || 'ws://localhost:8000') +
      `/ws/alerts?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      if (!unmountedRef.current) {
        reconnectRef.current = setTimeout(connect, 5000);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: AlertEvent = JSON.parse(event.data);
        if (msg.type === 'alert') {
          setAlerts((prev) => [msg.data, ...prev].slice(0, 50));
        }
      } catch {
        // ignore malformed messages
      }
    };
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const clearAlerts = useCallback(() => setAlerts([]), []);
  const dismissAlert = useCallback(
    (id: number) => setAlerts((prev) => prev.filter((a) => a.incident_id !== id)),
    []
  );

  return { alerts, connected, clearAlerts, dismissAlert };
}
