import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type DialogVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  variant?: DialogVariant;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  actions?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const variantStyles = {
  success: {
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
  },
  error: {
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
  },
  warning: {
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: AlertTriangle,
  },
  info: {
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Info,
  },
  default: {
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: Info,
  },
};

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'default',
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  actions,
  maxWidth = 'md',
}) => {
  const variantStyle = variantStyles[variant];
  const Icon = variantStyle.icon;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} overflow-hidden`}
          >
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${variantStyle.bgColor} ${variantStyle.borderColor} border-2 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${variantStyle.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                  </h3>

                  {message && (
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {message}
                    </p>
                  )}

                  {children && (
                    <div className="mt-4">
                      {children}
                    </div>
                  )}
                </div>
              </div>

              {actions && (
                <div className="mt-6 flex justify-end space-x-3">
                  {actions}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  variant?: DialogVariant;
  confirmLabel?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  confirmLabel = 'OK',
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      variant={variant}
      actions={
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {confirmLabel}
        </button>
      }
    />
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'warning',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmButtonVariant = 'primary',
  isLoading = false,
}) => {
  const confirmButtonClasses =
    confirmButtonVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      message={message}
      variant={variant}
      closeOnBackdropClick={!isLoading}
      showCloseButton={!isLoading}
      actions={
        <>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClasses}`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </>
      }
    />
  );
};
