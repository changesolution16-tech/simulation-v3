import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

const variantStyles = {
  success: {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    textColor: 'text-green-900',
    iconColor: 'text-green-600',
    icon: CheckCircle,
  },
  error: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
    icon: AlertCircle,
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-900',
    iconColor: 'text-yellow-600',
    icon: AlertTriangle,
  },
  info: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600',
    icon: Info,
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  variant,
  duration = 5000,
  onClose,
}) => {
  const variantStyle = variantStyles[variant];
  const Icon = variantStyle.icon;

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={`${variantStyle.bgColor} ${variantStyle.borderColor} border-l-4 rounded-lg shadow-lg p-4 min-w-[320px] max-w-md`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${variantStyle.iconColor} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${variantStyle.textColor} text-sm`}>
            {title}
          </h4>
          {message && (
            <p className={`mt-1 text-sm ${variantStyle.textColor} opacity-90`}>
              {message}
            </p>
          )}
        </div>

        <button
          onClick={() => onClose(id)}
          className={`flex-shrink-0 ${variantStyle.iconColor} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

interface ToastData {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
}) => {
  return (
    <div className={`fixed ${positionClasses[position]} z-[100] space-y-3`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
