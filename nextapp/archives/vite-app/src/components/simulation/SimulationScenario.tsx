import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationStore } from '../../store';
import { ArrowLeft, MessageSquare, User, Clock, ChevronRight, PlayCircle } from 'lucide-react';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { saveVideoWatchProgress, markVideoAsSkipped } from '../../lib/videoTracking';
import { BravinMetricsIntegration } from '../../lib/bravinMetricsIntegration';

type ScenarioPhase = 'INTRODUCTION' | 'PROMPT' | 'DECISION' | 'FEEDBACK' | 'TRANSITION' | 'COMPLETE';

const SimulationScenario: React.FC = () => {
  const { currentScenario, selectedDifficulty, selectedTopic, selectOption, currentUser } = useSimulationStore(state => ({
    currentScenario: state.currentScenario,
    selectedDifficulty: state.selectedDifficulty,
    selectedTopic: state.selectedTopic,
    selectOption: state.selectOption,
    currentUser: state.currentUser
  }));

  const [phase, setPhase] = useState<ScenarioPhase>('INTRODUCTION');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [introductionWatched, setIntroductionWatched] = useState(false);
  const [promptVideoWatched, setPromptVideoWatched] = useState(false);
  const [feedbackVideoWatched, setFeedbackVideoWatched] = useState(false);
  const [transitionVideoWatched, setTransitionVideoWatched] = useState(false);
  const [showResponseOptions, setShowResponseOptions] = useState(false);

  const navigate = useNavigate();

  const isVideoRequired = currentScenario?.isVideoRequired !== undefined
    ? currentScenario.isVideoRequired
    : false;
  const allowSkip = !isVideoRequired;

  useEffect(() => {
    if (!currentScenario || !selectedTopic || !selectedDifficulty) {
      navigate('/simulation');
    }
  }, [currentScenario, selectedTopic, selectedDifficulty, navigate]);

  useEffect(() => {
    if (currentScenario) {
      setPhase('INTRODUCTION');
      setSelectedOptionId(null);
      setIntroductionWatched(false);
      setPromptVideoWatched(false);
      setFeedbackVideoWatched(false);
      setTransitionVideoWatched(false);
      setShowResponseOptions(false);
    }
  }, [currentScenario]);

  const handleIntroductionComplete = async () => {
    setIntroductionWatched(true);

    if (currentUser && currentScenario) {
      await saveVideoWatchProgress({
        userId: currentUser.id,
        scenarioId: currentScenario.id,
        videoType: 'introduction',
        watchPercentage: 100,
        completed: true,
        watchDurationSeconds: currentScenario.introductionVideoDuration || 0
      });
    }
  };

  const handleIntroductionSkip = async () => {
    setIntroductionWatched(true);

    if (currentUser && currentScenario) {
      await markVideoAsSkipped(
        currentUser.id,
        'introduction',
        currentScenario.id,
        undefined,
        'User skipped in testing mode'
      );
    }
  };

  const handleStartScenario = () => {
    if (currentScenario?.promptVideoUrl) {
      setPhase('PROMPT');
    } else {
      setPhase('DECISION');
      setShowResponseOptions(true);
    }
  };

  const handlePromptVideoComplete = async () => {
    setPromptVideoWatched(true);

    if (currentUser && currentScenario) {
      await saveVideoWatchProgress({
        userId: currentUser.id,
        scenarioId: currentScenario.id,
        videoType: 'prompt',
        watchPercentage: 100,
        completed: true,
        watchDurationSeconds: currentScenario.promptVideoDuration || 0
      });
    }
  };

  const handlePromptVideoSkip = async () => {
    setPromptVideoWatched(true);

    if (currentUser && currentScenario) {
      await markVideoAsSkipped(
        currentUser.id,
        'prompt',
        currentScenario.id,
        undefined,
        'User skipped in testing mode'
      );
    }
  };

  const handleContinueToDecision = () => {
    setPhase('DECISION');
    setShowResponseOptions(true);
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  const handleSubmitResponse = () => {
    if (!selectedOptionId || !currentScenario) return;

    const option = currentScenario.options.find(o => o.id === selectedOptionId);
    if (!option) return;

    setPhase('FEEDBACK');
  };

  const handleFeedbackVideoComplete = async () => {
    setFeedbackVideoWatched(true);

    if (currentUser && selectedOptionId) {
      await saveVideoWatchProgress({
        userId: currentUser.id,
        optionId: selectedOptionId,
        videoType: 'feedback',
        watchPercentage: 100,
        completed: true,
        watchDurationSeconds: 0
      });
    }
  };

  const handleFeedbackVideoSkip = async () => {
    setFeedbackVideoWatched(true);

    if (currentUser && selectedOptionId) {
      await markVideoAsSkipped(
        currentUser.id,
        'feedback',
        undefined,
        selectedOptionId,
        'User skipped in testing mode'
      );
    }
  };

  const handleContinueToTransition = () => {
    const selectedOption = currentScenario?.options.find(o => o.id === selectedOptionId);

    if (selectedOption?.transitionVideoUrl || currentScenario?.transitionVideoUrl) {
      setPhase('TRANSITION');
    } else {
      handleNextScenario();
    }
  };

  const handleTransitionVideoComplete = async () => {
    setTransitionVideoWatched(true);

    if (currentUser && selectedOptionId) {
      await saveVideoWatchProgress({
        userId: currentUser.id,
        optionId: selectedOptionId,
        videoType: 'transition',
        watchPercentage: 100,
        completed: true,
        watchDurationSeconds: 0
      });
    }
  };

  const handleTransitionVideoSkip = async () => {
    setTransitionVideoWatched(true);

    if (currentUser && selectedOptionId) {
      await markVideoAsSkipped(
        currentUser.id,
        'transition',
        undefined,
        selectedOptionId,
        'User skipped in testing mode'
      );
    }
  };

  const handleNextScenario = async () => {
    if (!selectedOptionId || !currentScenario || !currentUser) return;

    try {
      await BravinMetricsIntegration.recordBravinMetricAssessments({
        learnerId: currentUser.id,
        scenarioId: currentScenario.id,
        optionId: selectedOptionId,
        simulationInstanceId: undefined
      });
    } catch (error) {
      console.error('Error recording BRAVIN metrics:', error);
    }

    selectOption(selectedOptionId);

    const selectedOption = currentScenario.options.find(o => o.id === selectedOptionId);

    if (currentScenario.isEndScenario || !selectedOption?.nextScenarioId) {
      navigate('/simulation/results');
    }
  };

  if (!currentScenario || !selectedTopic || !selectedDifficulty) {
    return null;
  }

  const selectedOption = currentScenario.options.find(o => o.id === selectedOptionId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/simulation')}
          className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to Topics</span>
        </button>

        <div className="mx-3 text-gray-400 dark:text-gray-500">/</div>

        <div className="flex items-center">
          <span className="text-gray-800 dark:text-gray-100">{selectedTopic.title}</span>
          <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            selectedDifficulty === 'beginner'
              ? 'bg-green-100 text-green-800'
              : selectedDifficulty === 'intermediate'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
          </span>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 text-sm">
          <div className={`flex items-center gap-2 ${phase === 'INTRODUCTION' ? 'text-blue-600 font-semibold' : introductionWatched ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${phase === 'INTRODUCTION' ? 'bg-blue-600 text-white' : introductionWatched ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'}`}>1</div>
            <span>Introduction</span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${phase === 'PROMPT' ? 'text-blue-600 font-semibold' : promptVideoWatched ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${phase === 'PROMPT' ? 'bg-blue-600 text-white' : promptVideoWatched ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'}`}>2</div>
            <span>Scenario</span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${phase === 'DECISION' ? 'text-blue-600 font-semibold' : selectedOptionId ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${phase === 'DECISION' ? 'bg-blue-600 text-white' : selectedOptionId ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'}`}>3</div>
            <span>Decision</span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${phase === 'FEEDBACK' ? 'text-blue-600 font-semibold' : feedbackVideoWatched ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${phase === 'FEEDBACK' ? 'bg-blue-600 text-white' : feedbackVideoWatched ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'}`}>4</div>
            <span>Feedback</span>
          </div>
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${phase === 'TRANSITION' ? 'text-blue-600 font-semibold' : transitionVideoWatched ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${phase === 'TRANSITION' ? 'bg-blue-600 text-white' : transitionVideoWatched ? 'bg-green-600 text-white' : 'bg-gray-300 text-white'}`}>5</div>
            <span>Next</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'INTRODUCTION' && (
          <motion.div
            key="introduction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-7 h-7 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 ml-3">{currentScenario.title}</h2>
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{currentScenario.description}</p>
                </div>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  <User className="w-4 h-4 mr-1" />
                  <span>Scenario {currentScenario.id.split('-').pop()}</span>
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4 mr-1" />
                  <span>2-5 minutes</span>
                </div>
              </div>
            </div>

            {currentScenario.introductionVideoUrl && (
              <div className="mb-6">
                <SynthesiaPlayer
                  videoUrl={currentScenario.introductionVideoUrl}
                  videoType="introduction"
                  onComplete={handleIntroductionComplete}
                  onSkip={handleIntroductionSkip}
                  autoPlay={true}
                  requireFullWatch={isVideoRequired}
                  minWatchPercentage={90}
                  allowSkip={allowSkip}
                  testingMode={allowSkip}
                />
              </div>
            )}

            {(introductionWatched || !currentScenario.introductionVideoUrl) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleStartScenario}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium flex items-center text-lg"
                >
                  <PlayCircle className="w-6 h-6 mr-2" />
                  Start Scenario
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'PROMPT' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {currentScenario.promptVideoUrl && (
              <div className="mb-8">
                <SynthesiaPlayer
                  videoUrl={currentScenario.promptVideoUrl}
                  videoType="prompt"
                  onComplete={handlePromptVideoComplete}
                  onSkip={handlePromptVideoSkip}
                  autoPlay={true}
                  requireFullWatch={isVideoRequired}
                  minWatchPercentage={90}
                  allowSkip={allowSkip}
                  testingMode={allowSkip}
                />
              </div>
            )}

            {promptVideoWatched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleContinueToDecision}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  Continue to Decision <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'DECISION' && (
          <motion.div
            key="decision"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">How would you respond?</h3>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="space-y-4"
            >
              {currentScenario.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ scale: 1.01 }}
                  className="relative"
                >
                  <button
                    onClick={() => handleOptionSelect(option.id)}
                    className={`w-full text-left p-5 rounded-lg border ${
                      selectedOptionId === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 dark:border-gray-700 bg-white hover:border-blue-200 hover:bg-blue-50'
                    } transition-colors`}
                  >
                    <div className="flex">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        selectedOptionId === option.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 dark:text-gray-500'
                      } flex items-center justify-center font-semibold text-sm`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-800 dark:text-gray-100">{option.text}</p>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </motion.div>

            {selectedOptionId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-8"
              >
                <button
                  onClick={handleSubmitResponse}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  Submit Response <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'FEEDBACK' && selectedOption && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {selectedOption.feedbackVideos?.[selectedDifficulty] ? (
              <div className="mb-6">
                <SynthesiaPlayer
                  videoUrl={selectedOption.feedbackVideos[selectedDifficulty]!}
                  videoType="feedback"
                  onComplete={handleFeedbackVideoComplete}
                  onSkip={handleFeedbackVideoSkip}
                  autoPlay={true}
                  requireFullWatch={isVideoRequired}
                  minWatchPercentage={90}
                  allowSkip={allowSkip}
                  testingMode={allowSkip}
                />
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Feedback</h3>
                <p className="text-blue-700">
                  {selectedOption.feedback[selectedDifficulty]}
                </p>
              </div>
            )}

            {selectedOption.learningRecommendations && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Learning Resources</h3>
                <div className="space-y-4">
                  {selectedOption.learningRecommendations.resources.map((resource, index) => (
                    <div key={index} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 dark:text-gray-100">{resource.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500 text-sm mt-1">{resource.description}</p>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                        >
                          Access Resource →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(feedbackVideoWatched || !selectedOption.feedbackVideos?.[selectedDifficulty]) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleContinueToTransition}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  Continue <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'TRANSITION' && selectedOption && (
          <motion.div
            key="transition"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {(selectedOption.transitionVideoUrl || currentScenario.transitionVideoUrl) && (
              <div className="mb-6">
                <SynthesiaPlayer
                  videoUrl={selectedOption.transitionVideoUrl || currentScenario.transitionVideoUrl!}
                  videoType="transition"
                  onComplete={handleTransitionVideoComplete}
                  onSkip={handleTransitionVideoSkip}
                  autoPlay={true}
                  requireFullWatch={isVideoRequired}
                  minWatchPercentage={90}
                  allowSkip={allowSkip}
                  testingMode={allowSkip}
                />
              </div>
            )}

            {transitionVideoWatched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleNextScenario}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                >
                  {currentScenario.isEndScenario || !selectedOption.nextScenarioId ? (
                    <>View Results <ChevronRight className="w-5 h-5 ml-2" /></>
                  ) : (
                    <>Continue to Next Scenario <ChevronRight className="w-5 h-5 ml-2" /></>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimulationScenario;
