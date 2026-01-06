import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, PlayCircle } from 'lucide-react';
import { useSimulationStore } from '../../store';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { SimulationService } from '../../lib/simulations';
import { SimulationWithScenarios } from '../../types';

const SimulationIntroduction: React.FC = () => {
  const { simulationId } = useParams<{ simulationId: string }>();
  const navigate = useNavigate();
  const { currentUser, activeSession } = useSimulationStore();

  const [simulation, setSimulation] = useState<SimulationWithScenarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);
  const [agreedToParticipate, setAgreedToParticipate] = useState(false);

  useEffect(() => {
    if (!simulationId || !currentUser || !activeSession) {
      navigate('/learner');
      return;
    }

    if (activeSession.simulationId !== simulationId) {
      navigate('/learner');
      return;
    }

    loadSimulation();
  }, [simulationId, currentUser, activeSession, navigate]);

  const loadSimulation = async () => {
    if (!simulationId) return;

    setLoading(true);
    try {
      const data = await SimulationService.getSimulation(simulationId);
      if (data) {
        setSimulation(data);
      } else {
        console.error('Simulation not found');
        navigate('/learner');
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
      navigate('/learner');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = () => {
    setVideoWatched(true);
  };

  const handleVideoSkip = () => {
    setVideoWatched(true);
  };

  const handleContinue = () => {
    if (!simulation || !simulationId) return;

    if (simulation.scenarios && simulation.scenarios.length > 0) {
      // Find entry point scenario
      const entryScenario = simulation.scenarios.find(s => s.is_entry_point);
      const entryIndex = entryScenario ? simulation.scenarios.indexOf(entryScenario) : 0;
      navigate(`/simulation/${simulationId}/scenario/${entryIndex}/introduction`);
    } else {
      alert('This simulation has no scenarios configured.');
      navigate('/learner');
    }
  };

  const canContinue = () => {
    const videoRequirement = !simulation?.introduction_video_url || videoWatched;
    const agreementRequirement = agreedToParticipate;
    return videoRequirement && agreementRequirement;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Simulation not found</p>
          <button
            onClick={() => navigate('/learner')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Simulations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <button
          onClick={() => navigate('/learner')}
          className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-gray-100 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Exit Simulation
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
        >
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {simulation.introduction_title || simulation.display_name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">
                Before we begin, let me introduce you to this learning experience.
              </p>
            </div>

            {simulation.introduction_video_url && (
              <div className="mb-8">
                <SynthesiaPlayer
                  videoUrl={simulation.introduction_video_url}
                  videoType="introduction"
                  onComplete={handleVideoComplete}
                  onSkip={handleVideoSkip}
                  allowSkip={true}
                  testingMode={true}
                />
              </div>
            )}

            {simulation.introduction_description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  What to Expect
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {simulation.introduction_description}
                </p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Participation Agreement
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                onClick={handleContinue}
                disabled={!canContinue()}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg flex items-center"
              >
                Let's Begin
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
