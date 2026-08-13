"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseAntiCheatOptions {
  enabled: boolean;
  onDisqualify: () => void | Promise<void>;
}

/**
 * Active only during LEVEL play.
 * Redirects to result IMMEDIATELY, then saves DQ in background.
 */
export function useAntiCheat({ enabled, onDisqualify }: UseAntiCheatOptions) {
  const router = useRouter();
  const hasDisqualified = useRef(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armedAt = useRef<number>(0);

  const disqualify = useCallback(
    (reason: string) => {
      if (hasDisqualified.current || !enabled) return;
      if (Date.now() < armedAt.current) return;
      hasDisqualified.current = true;

      toast.error(`Disqualified: ${reason}`, { duration: 3000 });

      // Snapshot progress for result page BEFORE anything clears session
      try {
        const uid =
          localStorage.getItem("cq_session") ||
          (() => {
            try {
              const s = JSON.parse(localStorage.getItem("cq_supabase_session") || "{}");
              return s.userId || null;
            } catch {
              return null;
            }
          })();
        if (uid) {
          localStorage.setItem("cq_disqualified_" + uid, "1");
          // Snapshot for result UI — prefer local progress, then expanded supabase cache
          const progressRaw = localStorage.getItem("cq_progress");
          const all = progressRaw ? JSON.parse(progressRaw) : {};
          const p = all[uid] || {};
          let sCache: Record<string, unknown> = {};
          try {
            sCache = JSON.parse(localStorage.getItem("cq_supabase_session") || "{}");
          } catch {}
          const levelsCompleted =
            (Array.isArray(p.levelsCompleted) && p.levelsCompleted.length > 0
              ? p.levelsCompleted
              : Array.isArray(sCache.levelsCompleted)
                ? (sCache.levelsCompleted as number[])
                : []) || [];
          const snap = {
            userId: uid,
            name:
              (typeof sCache.displayName === "string" && sCache.displayName) ||
              "Explorer",
            setId: p.setId ?? sCache.setId ?? null,
            currentLevel: p.currentLevel ?? sCache.currentLevel ?? 1,
            levelsCompleted,
            fragments: p.fragments ?? sCache.fragments ?? 0,
            score: p.score ?? sCache.score ?? 0,
            wrongAttempts: p.wrongAttempts ?? sCache.wrongAttempts ?? 0,
            status: "disqualified",
            reason,
          };
          sessionStorage.setItem("cq_result_snapshot", JSON.stringify(snap));
        }
      } catch {}

      // IMMEDIATE redirect — do not wait for network
      router.replace("/result?status=disqualified");

      // Background save
      Promise.resolve(onDisqualify()).catch((e) => console.error(e));
      try {
        fetch("/api/game/disqualify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    },
    [enabled, onDisqualify, router]
  );

  useEffect(() => {
    if (!enabled) {
      armedAt.current = 0;
      return;
    }

    armedAt.current = Date.now() + 600;

    const handleContext = (e: MouseEvent) => {
      e.preventDefault();
      disqualify("Right-click is not allowed");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      disqualify("Copy / Cut is not allowed");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      disqualify("Paste is not allowed");
    };

    const handleVisibility = () => {
      if (document.hidden) {
        disqualify("Tab switch or window hidden");
      }
    };

    const handleBlur = () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
      blurTimer.current = setTimeout(() => {
        if (!document.hasFocus() || document.hidden) {
          disqualify("Left the game window");
        }
      }, 150);
    };

    const handleFocus = () => {
      if (blurTimer.current) {
        clearTimeout(blurTimer.current);
        blurTimer.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase?.() || "";
      if (e.ctrlKey || e.metaKey) {
        if (key === "c" || key === "x" || key === "v") {
          e.preventDefault();
          disqualify(`Keyboard shortcut Ctrl+${key.toUpperCase()} blocked`);
          return;
        }
        if (e.shiftKey && (key === "i" || key === "j" || key === "c")) {
          e.preventDefault();
          disqualify("Developer tools blocked");
          return;
        }
      }
      if (e.key === "F12") {
        e.preventDefault();
        disqualify("Developer tools blocked");
      }
    };

    document.addEventListener("contextmenu", handleContext, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCopy, true);
    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
      document.removeEventListener("contextmenu", handleContext, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCopy, true);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, disqualify]);

  return { disqualify };
}
