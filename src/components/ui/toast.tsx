"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import styles from "./toast.module.scss";

type ToastKind = "success" | "error" | "info";
type ToastInput = {
  title: string;
  description?: string;
  kind?: ToastKind;
  duration?: number;
};
type ToastItem = ToastInput & { id: string; kind: ToastKind };
const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback(
    (id: string) =>
      setToasts((items) => items.filter((item) => item.id !== id)),
    [],
  );
  const show = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((items) => [
        ...items,
        { ...input, id, kind: input.kind ?? "info" },
      ]);
      window.setTimeout(() => dismiss(id), input.duration ?? 4500);
    },
    [dismiss],
  );
  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon =
            toast.kind === "success"
              ? CheckCircle2
              : toast.kind === "error"
                ? CircleAlert
                : Info;
          return (
            <div
              className={styles.toast}
              data-kind={toast.kind}
              role={toast.kind === "error" ? "alert" : "status"}
              key={toast.id}
            >
              <Icon />
              <div>
                <strong>{toast.title}</strong>
                {toast.description && <p>{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside ToastProvider");
  return toast;
}
