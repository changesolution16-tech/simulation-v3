import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertDialog, ConfirmDialog } from '../components/ui/Dialog';
import { ToastContainer } from '../components/ui/Toast';
import type { DialogVariant } from '../components/ui/Dialog';
import type { ToastVariant } from '../components/ui/Toast';

interface AlertOptions {
  title: string;
  message?: string;
  variant?: DialogVariant;
  confirmLabel?: string;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonVariant?: 'primary' | 'danger';
}

interface ToastOptions {
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface DialogContextValue {
  showAlert: (options: AlertOptions) => Promise<void>;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  showToast: (options: ToastOptions) => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

interface AlertState {
  isOpen: boolean;
  options: AlertOptions;
  resolve?: () => void;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve?: (value: boolean) => void;
  isLoading: boolean;
}

interface ToastData {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
}

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    options: { title: '' },
  });

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    options: { title: '' },
    isLoading: false,
  });

  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showAlert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleAlertClose = useCallback(() => {
    setAlertState((prev) => {
      if (prev.resolve) {
        prev.resolve();
      }
      return {
        isOpen: false,
        options: { title: '' },
      };
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
        isLoading: false,
      });
    });
  }, []);

  const handleConfirmClose = useCallback(() => {
    setConfirmState((prev) => {
      if (prev.resolve) {
        prev.resolve(false);
      }
      return {
        isOpen: false,
        options: { title: '' },
        isLoading: false,
      };
    });
  }, []);

  const handleConfirmAccept = useCallback(() => {
    setConfirmState((prev) => {
      if (prev.resolve) {
        prev.resolve(true);
      }
      return {
        isOpen: false,
        options: { title: '' },
        isLoading: false,
      };
    });
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(7);
    const toast: ToastData = {
      id,
      title: options.title,
      message: options.message,
      variant: options.variant || 'info',
      duration: options.duration,
    };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    showToast({ title, message, variant: 'success', duration });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    showToast({ title, message, variant: 'error', duration });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    showToast({ title, message, variant: 'warning', duration });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    showToast({ title, message, variant: 'info', duration });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value: DialogContextValue = {
    showAlert,
    showConfirm,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <DialogContext.Provider value={value}>
      {children}

      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={handleAlertClose}
        title={alertState.options.title}
        message={alertState.options.message}
        variant={alertState.options.variant}
        confirmLabel={alertState.options.confirmLabel}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmAccept}
        title={confirmState.options.title}
        message={confirmState.options.message}
        variant={confirmState.options.variant}
        confirmLabel={confirmState.options.confirmLabel}
        cancelLabel={confirmState.options.cancelLabel}
        confirmButtonVariant={confirmState.options.confirmButtonVariant}
        isLoading={confirmState.isLoading}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
