import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { requestSseToken } from "../services/notification.service";
import { NOTIFICATIONS_KEY } from "./useNotifications";

const SSE_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api-dashboard";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

export const useNotificationSSE = () => {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Per-effect flag: under React StrictMode the first effect run is cleaned up and a second one
    // starts before the first token request resolves. A shared ref would be reset to true by the
    // second run, letting the first run open a second (leaked) EventSource.
    let cancelled = false;

    const connect = async () => {
      if (cancelled) return;

      try {
        const token = await requestSseToken();
        if (cancelled) return;

        const url = `${SSE_BASE_URL}/notifications/sse?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.addEventListener("connected", () => {
          retriesRef.current = 0;
        });

        es.addEventListener("message", () => {
          // Server sends a lightweight ping; refetch the notification list
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        });

        es.onerror = () => {
          es.close();
          esRef.current = null;

          if (cancelled) return;
          if (retriesRef.current >= MAX_RETRIES) return;

          const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current);
          retriesRef.current += 1;

          retryTimerRef.current = setTimeout(() => {
            if (!cancelled) connect();
          }, delay);
        };
      } catch {
        // If token request fails (e.g. logged out), don't retry
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [queryClient]);
};
