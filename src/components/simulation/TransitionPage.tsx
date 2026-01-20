'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

interface TransitionPageProps {
  videoUrl?: string;
  videoLibraryId?: string;
  simulationInstanceId?: string;
  scenarioId?: string;
  optionId?: string;
  message?: string;
  isLastScenario?: boolean;
  onContinue: () => void;
}

const TransitionPage: React.FC<TransitionPageProps> = ({
  videoUrl,
  videoLibraryId,
  simulationInstanceId,
  scenarioId,
  optionId,
  message = 'Preparing next scenario...',
  isLastScenario = false,
  onContinue
}) => {
  const [videoWatched, setVideoWatched] = useState(false);

  const canContinue = !videoUrl || videoWatched;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                  <ChevronRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {isLastScenario ? 'Simulation Complete' : 'Moving Forward'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {isLastScenario ? 'Thank you for completing this simulation' : message}
                </p>
              </div>

              {videoUrl && (
                <div className="mb-8">
                  <VideoPlayer
                    videoUrl={videoUrl as string}
                    videoType="transition"
                    videoLibraryId={videoLibraryId}
                    simulationInstanceId={simulationInstanceId}
                    scenarioId={scenarioId}
                    optionId={optionId}
                    onComplete={() => setVideoWatched(true)}
                    onSkip={() => setVideoWatched(true)}
                    autoPlay={false}
                    allowSkip
                  />
                </div>
              )}

              <div className="flex justify-center">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: canContinue ? 1 : 0.5 }}
                  onClick={onContinue}
                  disabled={!canContinue}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLastScenario ? 'View Results' : 'Continue'}
                  <ChevronRight className="w-6 h-6 ml-2" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TransitionPage;
