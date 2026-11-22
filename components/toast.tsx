"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";
type ToastInput = { tone?: ToastTone; title: string; text?: string };
type ToastItem = ToastInput & { id: number };

const tones: Record<ToastTone, { box: string; icon: string }> = {
  success: { box: "border-success/40", icon: "bg-success text-success-foreground" },
  error: { box: "border-danger/40", icon: "bg-danger text-danger-foreground" },
};

const DURATION = 6000;
const MAX_VISIBLE = 3;

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});
// Hook zwracający funkcję pokazującą powiadomienie.
export const useToast = () => useContext(ToastContext);

// Komponent przechowujący i wyświetlający powiadomienia.
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((all) => [...all.slice(-(MAX_VISIBLE - 1)), { ...toast, id }]);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  return (
    <ToastContext value={show}>
      {children}
      <div aria-live="polite" className="fixed right-4 bottom-4 left-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext>
  );
};

// Komponent pojedynczego powiadomienia.
const Toast = ({ tone = "success", title, text, onClose }: ToastInput & { onClose: () => void }) => {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const timer = setTimeout(() => close.current(), DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border bg-surface p-4 shadow-xl shadow-black/40 animate-toast-in ${tones[tone].box}`}
    >
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${tones[tone].icon}`}
        aria-hidden
      >
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
