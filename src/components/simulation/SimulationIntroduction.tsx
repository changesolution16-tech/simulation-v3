'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';

interface SimulationIntroductionProps {
  title: string;
  description?: string;
  videoUrl?: string;
  displayName: string;
  onContinue: () => void;
}

const SimulationIntroduction: React.FC<SimulationIntroductionProps> = ({
  title,
  description,
  videoUrl,
  displayName,
  onContinue
}) => {
  const [videoWatched, setVideoWatched] = useState(false);
  const [agreedToParticipate, setAgreedToParticipate] = useState(false);

  const canContinue = () => {
    const videoRequirement = !videoUrl || videoWatched;
    const agreementRequirement = agreedToParticipate;
    return videoRequirement && agreementRequirement;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
        >
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {title || displayName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Before we begin, let me introduce you to this learning experience.
              </p>
            </div>

            {videoUrl && (
              <div className="mb-8">
                {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={videoUrl.includes('youtube.com/embed/')
                        ? videoUrl
                        : videoUrl.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => {
                        setTimeout(() => setVideoWatched(true), 5000);
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      onEnded={() => setVideoWatched(true)}
                      className="w-full h-full"
                    />
                  </div>
                )}
                <button
                  onClick={() => setVideoWatched(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Skip video
                </button>
              </div>
            )}

            {description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  What to Expect
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {description}
                </p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Participation Agreement
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="participation-agreement"
                    checked={agreedToParticipate}
                    onChange={(e) => setAgreedToParticipate(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-0 mt-0.5"
                  />
                  <label
                    htmlFor="participation-agreement"
                    className="ml-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    I agree to fully engage in this simulation as if it were real. I understand
                    this is a safe learning environment where I can practice and make mistakes
                    without real-world consequences.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={onContinue}
                disabled={!canContinue()}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg flex items-center"
              >
                Let&apos;s Begin
                <PlayCircle className="w-6 h-6 ml-2" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimulationIntroduction;
