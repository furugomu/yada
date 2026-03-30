import { useCallback, useEffect, useRef, useState } from "react";

interface Stats {
  totalCount: number;
  userCount: number;
}

export function useYadaSync(userId: string): {
  totalCount: number;
  userCount: number;
  increment: () => void;
} {
  const [serverStats, setServerStats] = useState<Stats>({ totalCount: 0, userCount: 0 });
  const [optimisticTotal, setOptimisticTotal] = useState(0);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);

  const flush = useCallback(async () => {
    if (pendingRef.current <= 0 || flushingRef.current) return;
    flushingRef.current = true;
    const count = pendingRef.current;
    pendingRef.current = 0;
    try {
      const res = await fetch("/api/yada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, count }),
        keepalive: true,
      });
      if (res.ok) {
        const data = (await res.json()) as Stats;
        setServerStats(data);
        setOptimisticTotal(0);
      } else {
        pendingRef.current += count;
      }
    } catch {
      pendingRef.current += count;
    } finally {
      flushingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setServerStats(data as Stats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("beforeunload", () => void flush());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  const increment = useCallback(() => {
    pendingRef.current += 1;
    setOptimisticTotal((n) => n + 1);

    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), 500);
  }, [flush]);

  return {
    totalCount: serverStats.totalCount + optimisticTotal,
    userCount: serverStats.userCount,
    increment,
  };
}
