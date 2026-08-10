"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseAntiCheatOptions {
  enabled: boolean;
  onDisqualify: () => void | Promise<void>;
}

/**
 * Active only during LEVEL play (enabled=true on level page).
 *
 * Disqualify when:
 * - Switch tab / minimize / hide window (visibility hidden)
 * - Leave the game window (blur / another app or window)
 * - Copy / cut / paste
 * - Right-click
 * - DevTools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+C/X/V)
 */
export function useAntiCheat({ enabled, onDisqualify }: UseAntiCheatOptions) {
  const router = useRouter();
  const hasDisqualified = useRef(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ignore blur/visibility for a short time after mount so page load does not false-fire
  const armedAt = useRef<number>(0);

  const disqualify = useCallback(
    async (reason: string) => {
      if (hasDisqualified.current || !enabled) return;
      // Grace period: 800ms after anti-cheat arms
      if (Date.now() < armedAt.current) return;
      hasDisqualified.current = true;

      toast.error(`Disqualified: ${reason}`, { duration: 4000 });

      try {
        await Promise.resolve(onDisqualify());
      } catch (e) {
        console.error("Disqualify handler error:", e);
      }

      try {
        await fetch("/api/game/disqualify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
          keepalive: true,
        });
      } catch {}

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
        if (uid) localStorage.setItem("cq_disqualified_" + uid, "1");
      } catch {}

      router.replace("/result?status=disqualified");
    },
    [enabled, onDisqualify, router]
  );

  useEffect(() => {
    if (!enabled) {
      armedAt.current = 0;
      return;
    }

    armedAt.current = Date.now() + 800;

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

    // Tab switch, minimize, another browser tab
    const handleVisibility = () => {
      if (document.hidden) {
        disqualify("Tab switch or window hidden");
      }
    };

    // Another window / Alt+Tab / click outside browser
    const handleBlur = () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
      blurTimer.current = setTimeout(() => {
        if (!document.hasFocus() || document.hidden) {
          disqualify("Left the game window");
        }
      }, 200);
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
