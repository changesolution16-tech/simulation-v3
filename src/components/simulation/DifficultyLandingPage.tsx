'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, CheckCircle2, Clock, Target, User, AlertCircle } from 'lucide-react';

interface LandingPageContent {
  videoUrl?: string;
  title: string;
  description: string;
  objectives?: Array<{ text: string }>;
  roleDescription?: string;
  estimatedDuration?: number;
  imageUrl?: string;
  imageAlt?: string;
}

interface DifficultyLandingPageProps {
  content: LandingPageContent;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  fictionContractText?: string;
  onStart: () => void;
  onExit: () => void;
}

const DifficultyLandingPage: React.FC<DifficultyLandingPageProps> = ({
  content,
  difficulty,
  fictionContractText = 'I agree to fully engage in this simulation as if it were real. I understand this is a safe learning environment where I can practice and make mistakes without real-world consequences.',
  onStart,
  onExit
}) => {
  const [videoWatched, setVideoWatched] = useState(false);
  const [contractAgreed, setContractAgreed] = useState(false);

  const difficultyColors = {
    beginner: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    intermediate: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    advanced: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  };

  const colors = difficultyColors[difficulty];

  const handleStartSimulation = () => {
    if (contractAgreed) {
      onStart();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
              {difficulty.charAt(0).toUpperCase()}{difficulty.slice(1)}
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 mb-6">
                  {content.estimatedDuration && (
                    <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium">
                      <Clock className="w-4 h-4 mr-2" />
                      {content.estimatedDuration} minutes
                    </div>
                  )}
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                  {content.title}
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  {content.description}
                </p>
              </div>

              {content.imageUrl && (
                <div className="relative h-64 lg:h-auto bg-gradient-to-br from-blue-100 to-blue-50">
                  <img
                    src={content.imageUrl}
                    alt={content.imageAlt || 'Simulation illustration'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {content.videoUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Introduction Video</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get familiar with the simulation context</p>
                  </div>
                </div>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {content.objectives && content.objectives.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Learning Objectives</h2>
                </div>
                <div className="space-y-4">
                  {content.objectives.map((objective, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{objective.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {content.roleDescription && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Role</h2>
                </div>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    {content.roleDescription}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-8 shadow-lg">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">Fiction Contract</h2>
              <p className="text-blue-800 dark:text-blue-200 text-lg mb-6 leading-relaxed">{fictionContractText}</p>
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={contractAgreed}
                  onChange={(e) => setContractAgreed(e.target.checked)}
                  className="mt-1 h-6 w-6 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                />
                <span className="text-blue-900 dark:text-blue-100 font-semibold text-lg group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  I agree to fully engage in this simulation and treat it as a real scenario
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleStartSimulation}
              disabled={!contractAgreed}
              className={`flex-1 px-8 py-5 rounded-2xl shadow-lg font-bold text-xl flex items-center justify-center transition-all transform ${
                contractAgreed
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PlayCircle className="w-7 h-7 mr-3" />
              Start Simulation
            </button>
            <button
              onClick={onExit}
              className="sm:w-48 px-8 py-5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              Save & Exit
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DifficultyLandingPage;
