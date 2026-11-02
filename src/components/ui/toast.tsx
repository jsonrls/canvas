"use client";

import { ButtonControl } from "@/components/ui/button";
import { Check, X } from "@/components/ui/icons";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./toast.module.css";

interface ToastItem {
  id: number;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
}

interface SuccessState {
  message: string;
  status: string;
}

const TOAST_DURATION_MS = 4_200;
const ToastContext = createContext<ToastContextValue | null>(null);

function SuccessToast({
  id,
  message,
  onDismiss,
}: {
  id: number;
  message: string;
  onDismiss: (id: number) => void;
}): React.ReactElement {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <li className={styles.toast} role="status">
      <span className={styles.icon} aria-hidden="true">
        <Check size={15} strokeWidth={2.6} />
      </span>
      <div className={styles.copy}>
        <strong>Success</strong>
        <p>{message}</p>
      </div>
      <ButtonControl
        variant="ghost"
        aria-label="Dismiss notification"
        className={styles.dismiss}
        onClick={() => onDismiss(id)}
        type="button"
      >
        <X aria-hidden="true" size={15} />
      </ButtonControl>
      <span className={styles.progress} aria-hidden="true" />
    </li>
  );
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const nextIdRef = useRef(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string): void => {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) return;

    nextIdRef.current += 1;
    const toast = { id: nextIdRef.current, message: normalizedMessage };

    setToasts((current) => [
      ...current.filter((item) => item.message !== normalizedMessage).slice(-2),
      toast,
    ]);
  }, []);

  const value = useMemo(() => ({ success }), [success]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ol aria-label="Notifications" className={styles.viewport}>
        {toasts.map((toast) => (
          <SuccessToast
            id={toast.id}
            key={toast.id}
            message={toast.message}
            onDismiss={dismiss}
          />
        ))}
      </ol>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("Toast components must be rendered inside ToastProvider.");
  }

  return context;
}

export function useSuccessToast(state: SuccessState): void {
  const { success } = useToast();
  const handledStateRef = useRef<SuccessState | null>(null);

  useEffect(() => {
    if (handledStateRef.current === state) return;

    handledStateRef.current = state;

    if (state.status === "success" && state.message) {
      success(state.message);
    }
  }, [state, success]);
}

export function SuccessToastOnMount({ message }: { message: string }): null {
  const { success } = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;

    shownRef.current = true;
    success(message);
  }, [message, success]);

  return null;
}
