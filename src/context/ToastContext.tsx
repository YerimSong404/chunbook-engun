'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showError: (message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showError: () => {},
});

const TOAST_DURATION = 2000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<ToastType>('success');
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((msg: string, toastType: ToastType = 'success') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setMessage(null);
    }, TOAST_DURATION);
  }, []);

  const showError = useCallback(
    (msg = '오류가 발생했어요. 다시 시도해 주세요.') => {
      showToast(msg, 'error');
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showError }}>
      {children}
      <div
        className={`toast ${visible ? 'show' : ''} ${type === 'error' ? 'toast-error' : ''}`}
        role="alert"
        aria-live="polite"
      >
        {type === 'success' && message ? `${message} ✓` : message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
