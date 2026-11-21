"use client";

import { useEffect } from "react";

export type ToastTone = "success" | "error";

const tones: Record<ToastTone, { box: string; icon: string }> = {
  success: { box: "border-success/40", icon: "bg-success text-success-foreground" },
  error: { box: "border-danger/40", icon: "bg-danger text-danger-foreground" },
};

// Powiadomienie w prawym dolnym rogu. Znika samo po `duration` ms albo po kliknięciu ×.
// role="status" + aria-live: czytnik ekranu odczyta treść bez przenoszenia fokusu.
export const Toast = ({
  tone = "success",
  title,
  text,
  onClose,
  duration = 6000,
}: {
  tone?: ToastTone;
  title: string;
  text?: string;
  onClose: () => void;
  duration?: number;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 bottom-4 left-4 z-50 flex items-start gap-3 rounded-xl border bg-surface p-4 shadow-xl shadow-black/40 sm:left-auto sm:w-96 animate-toast-in ${tones[tone].box}`}
    >
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tones[tone].icon}`} aria-hidden>
        {tone === "success" ? "✓" : "!"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {text && <p className="mt-0.5 text-sm text-muted">{text}</p>}
      </div>
      <button onClick={onClose} aria-label="Zamknij" className="-m-1 rounded p-1 text-muted hover:text-foreground">
        ×
      </button>
    </div>
  );
};
