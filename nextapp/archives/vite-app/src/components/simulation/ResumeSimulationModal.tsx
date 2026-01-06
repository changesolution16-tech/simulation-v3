import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, RotateCcw, Clock } from 'lucide-react';
import { ResumePoint } from '../../types';

interface ResumeSimulationModalProps {
  isOpen: boolean;
  resumePoint: ResumePoint;
  onContinue: () => void;
  onStartOver: () => void;
  onClose: () => void;
}

const ResumeSimulationModal: React.FC<ResumeSimulationModalProps> = ({
  isOpen,
  resumePoint,
  onContinue,
  onStartOver,
  onClose
}) => {
  if (!isOpen) return null;

  const getLocationText = () => {
    switch (resumePoint.location) {
      case 'landing_page':
        return 'the introduction landing page';
      case 'scenario':
        return 'an active scenario';
      case 'results':
        return 'viewing your results';
      default:
        return 'your simulation';
    }
  };

  const getLastInteractionText = () => {
    if (!resumePoint.lastInteractionAt) return '';

    const date = new Date(resumePoint.lastInteractionAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
            <p className="text-blue-100">You have a simulation in progress</p>
          </div>

          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-gray-800 dark:text-gray-100 font-medium mb-1">
                    You were on {getLocationText()}
                  </p>
                  {resumePoint.lastInteractionAt && (
                    <p className="text-gray-600 text-sm">
                      Last activity: {getLastInteractionText()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onContinue}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center shadow-md hover:shadow-lg"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Continue from where I left off
              </button>

              <button
                onClick={onStartOver}
                className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Start Over
              </button>

              <button
                onClick={onClose}
                className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 dark:text-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResumeSimulationModal;
