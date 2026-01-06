import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { connectionMonitor, ConnectionState } from '../lib/connectionMonitor';

const NetworkStatusIndicator: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    connectionMonitor.getState()
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    connectionMonitor.start();
    const unsubscribe = connectionMonitor.subscribe(setConnectionState);
    return () => {
      unsubscribe();
      connectionMonitor.stop();
    };
  }, []);

  const handleRetry = async () => {
    await connectionMonitor.checkConnection();
  };

  if (connectionState.status === 'connected') {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionState.status) {
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'red',
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          title: 'No Connection',
          message: 'Unable to connect to the server. Check environment variables in deployment settings (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).'
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          color: 'amber',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          title: 'Poor Connection',
          message: 'Connection is unstable. You may experience delays.'
        };
      case 'checking':
        return {
          icon: RefreshCw,
          color: 'blue',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          title: 'Checking Connection',
          message: 'Verifying server connectivity...'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div
          className={`${config.bg} ${config.border} border rounded-lg shadow-lg overflow-hidden`}
        >
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${connectionState.status === 'checking' ? 'animate-spin' : ''}`}>
                <Icon className={`w-5 h-5 ${config.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${config.text}`}>
                    {config.title}
                  </h3>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className={`text-xs ${config.text} hover:underline`}
                  >
                    {showDetails ? 'Hide' : 'Details'}
                  </button>
                </div>
                <p className={`text-xs mt-1 ${config.text}`}>
                  {config.message}
                </p>

                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`mt-3 pt-3 border-t ${config.border} text-xs ${config.text}`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span className="capitalize">{connectionState.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Failures:</span>
                        <span>{connectionState.consecutiveFailures}</span>
                      </div>
                      {connectionState.latency && (
                        <div className="flex justify-between">
                          <span className="font-medium">Latency:</span>
                          <span>{connectionState.latency}ms</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-medium">Last Check:</span>
                        <span>{new Date(connectionState.lastChecked).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {connectionState.status !== 'checking' && (
                  <button
                    onClick={handleRetry}
                    className={`mt-3 w-full px-3 py-1.5 text-xs font-medium text-white bg-${config.color}-600 hover:bg-${config.color}-700 rounded transition-colors flex items-center justify-center space-x-1`}
                    style={{
                      backgroundColor: connectionState.status === 'disconnected' ? '#DC2626' : '#D97706'
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Connection</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NetworkStatusIndicator;
