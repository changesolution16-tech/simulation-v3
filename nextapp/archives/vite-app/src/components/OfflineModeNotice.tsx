import React from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { useOfflineMode } from '../hooks/useOfflineMode';

interface OfflineModeNoticeProps {
  feature?: string;
  className?: string;
}

const OfflineModeNotice: React.FC<OfflineModeNoticeProps> = ({
  feature,
  className = ''
}) => {
  const offlineMode = useOfflineMode();

  if (offlineMode.isOnline) {
    return null;
  }

  const getMessage = () => {
    if (offlineMode.isOffline) {
      return feature
        ? `${feature} is unavailable while offline. Please check your connection.`
        : 'You are currently offline. Some features may be unavailable.';
    }

    if (offlineMode.isDegraded) {
      return feature
        ? `${feature} may experience delays due to poor connection.`
        : 'Connection is unstable. Some features may be slow or unavailable.';
    }

    return '';
  };

  const Icon = offlineMode.isOffline ? WifiOff : AlertTriangle;
  const bgColor = offlineMode.isOffline ? 'bg-red-50' : 'bg-amber-50';
  const borderColor = offlineMode.isOffline ? 'border-red-200' : 'border-amber-200';
  const textColor = offlineMode.isOffline ? 'text-red-800' : 'text-amber-800';
  const iconColor = offlineMode.isOffline ? 'text-red-600' : 'text-amber-600';

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>
            {getMessage()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineModeNotice;
