import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, RotateCcw, Eye, ChevronRight,
  ArrowLeft, TrendingUp, TrendingDown, AlertCircle, PlayCircle, MessageSquare, User, Clock
} from 'lucide-react';
import { useSimulationStore } from '../../store';
import SynthesiaPlayer from '../video/SynthesiaPlayer';

type PreviewPhase = 'INTRODUCTION' | 'PROMPT' | 'DECISION' | 'FEEDBACK' | 'TRANSITION';

const ScenarioPreview: React.FC = () => {
  const {
    currentScenario,
    selectedDifficulty,
    previewSession,
    selectPreviewOption,
    exitPreview,
    resetPreview
  } = useSimulationStore();

  const [phase, setPhase] = useState<PreviewPhase>('INTRODUCTION');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [introductionWatched, setIntroductionWatched] = useState(false);
  const [promptVideoWatched, setPromptVideoWatched] = useState(false);
  const [feedbackVideoWatched, setFeedbackVideoWatched] = useState(false);
  const [transitionVideoWatched, setTransitionVideoWatched] = useState(false);
  const [showPathPanel, setShowPathPanel] = useState(true);

  useEffect(() => {
    if (!currentScenario) {
      setPhase('INTRODUCTION');
      setSelectedOptionId(null);
      setIntroductionWatched(false);
      setPromptVideoWatched(false);
      setFeedbackVideoWatched(false);
      setTransitionVideoWatched(false);
    } else {
      setPhase('INTRODUCTION');
      setSelectedOptionId(null);
      setIntroductionWatched(false);
      setPromptVideoWatched(false);
      setFeedbackVideoWatched(false);
      setTransitionVideoWatched(false);
    }
  }, [currentScenario]);

  if (!previewSession.isActive) {
    return null;
  }

  const handleIntroductionComplete = () => {
    setIntroductionWatched(true);
  };

  const handleIntroductionSkip = () => {
    setIntroductionWatched(true);
  };

  const handleStartScenario = () => {
    if (currentScenario?.promptVideoUrl) {
      setPhase('PROMPT');
    } else {
      setPhase('DECISION');
    }
  };

  const handlePromptVideoComplete = () => {
    setPromptVideoWatched(true);
  };

  const handlePromptVideoSkip = () => {
    setPromptVideoWatched(true);
  };

  const handleContinueToDecision = () => {
    setPhase('DECISION');
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

  const handleFeedbackVideoComplete = () => {
    setFeedbackVideoWatched(true);
  };

  const handleFeedbackVideoSkip = () => {
    setFeedbackVideoWatched(true);
  };

  const handleContinueToTransition = () => {
    const selectedOption = currentScenario?.options.find(o => o.id === selectedOptionId);

    if (!selectedOption) return;

    if (selectedOption.transitionVideoUrl || currentScenario?.transitionVideoUrl) {
      setPhase('TRANSITION');
    } else if (currentScenario?.isEndScenario || !selectedOption.nextScenarioId) {
      return;
    } else {
      handleNextScenario();
    }
  };

  const handleTransitionVideoComplete = () => {
    setTransitionVideoWatched(true);
  };

  const handleTransitionVideoSkip = () => {
    setTransitionVideoWatched(true);
  };

  const handleNextScenario = () => {
    if (!selectedOptionId || !currentScenario) return;

    const selectedOption = currentScenario.options.find(o => o.id === selectedOptionId);

    if (!selectedOption || !selectedOption.nextScenarioId) {
      return;
    }

    selectPreviewOption(selectedOptionId);

    setPhase('INTRODUCTION');
    setSelectedOptionId(null);
    setIntroductionWatched(false);
    setPromptVideoWatched(false);
    setFeedbackVideoWatched(false);
    setTransitionVideoWatched(false);
  };

  const handleReset = () => {
    setPhase('INTRODUCTION');
    setSelectedOptionId(null);
    setIntroductionWatched(false);
    setPromptVideoWatched(false);
    setFeedbackVideoWatched(false);
    setTransitionVideoWatched(false);
    resetPreview();
  };

  const handleExit = () => {
    exitPreview();
  };

  if (!currentScenario || !selectedDifficulty) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Preview Ended</h2>
          <p className="text-gray-600 mb-6">
            The scenario flow has ended or no next scenario is configured.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Exit Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedOption = currentScenario.options.find(o => o.id === selectedOptionId);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 mb-6 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">PREVIEW MODE</span>
            <span className="text-blue-200 text-sm">
              Testing as {selectedDifficulty} level learner
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded flex items-center gap-2 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
            <button
              onClick={handleExit}
              className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded flex items-center gap-2 text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Exit Preview
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex gap-6">
          <div className="flex-1">
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
                        <p className="text-gray-700 text-lg leading-relaxed">{currentScenario.description}</p>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1" />
                        <span>Scenario {currentScenario.id.split('-').pop()}</span>
                        <span className="mx-2">•</span>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>2-5 minutes</span>
                        {currentScenario.isEndScenario && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                              End Scenario
                            </span>
                          </>
                        )}
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
                        requireFullWatch={false}
                        minWatchPercentage={90}
                        allowSkip={true}
                        testingMode={true}
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
                        requireFullWatch={false}
                        minWatchPercentage={90}
                        allowSkip={true}
                        testingMode={true}
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
                  <h3 className="text-lg font-semibold text-white mb-4">How would you respond?</h3>

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
                      >
                        <button
                          onClick={() => handleOptionSelect(option.id)}
                          className={`w-full text-left p-5 rounded-lg border ${
                            selectedOptionId === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 dark:border-gray-700 bg-white hover:border-blue-200 hover:bg-blue-50'
                          } transition-colors`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                              selectedOptionId === option.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            } flex items-center justify-center font-semibold text-sm`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-800 dark:text-gray-100">{option.text}</p>
                              {Object.entries(option.skillImpact).length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {Object.entries(option.skillImpact).map(([skill, impact]) => (
                                    <span
                                      key={skill}
                                      className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                                        impact > 0
                                          ? 'bg-green-100 text-green-700'
                                          : impact < 0
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {impact > 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                      ) : impact < 0 ? (
                                        <TrendingDown className="w-3 h-3" />
                                      ) : null}
                                      {skill}: {impact > 0 ? '+' : ''}{impact}
                                    </span>
                                  ))}
                                </div>
                              )}
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
                  {(() => {
                    const feedbackVideoUrl = selectedOption.feedbackVideos?.[selectedDifficulty];

                    return feedbackVideoUrl ? (
                      <div className="mb-6">
                        <SynthesiaPlayer
                          videoUrl={feedbackVideoUrl}
                          videoType="feedback"
                          onComplete={handleFeedbackVideoComplete}
                          onSkip={handleFeedbackVideoSkip}
                          autoPlay={true}
                          requireFullWatch={false}
                          minWatchPercentage={90}
                          allowSkip={true}
                          testingMode={true}
                        />
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">
                          Feedback ({selectedDifficulty} level)
                        </h3>
                        <p className="text-gray-700">
                          {selectedOption.feedback[selectedDifficulty]}
                        </p>
                      </div>
                    );
                  })()}

                  {(feedbackVideoWatched || !selectedOption.feedbackVideos?.[selectedDifficulty]) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center"
                    >
                      {(currentScenario.isEndScenario || !selectedOption.nextScenarioId) &&
                       !selectedOption.transitionVideoUrl && !currentScenario.transitionVideoUrl ? (
                        <button
                          onClick={handleExit}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-medium flex items-center"
                        >
                          End Preview <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                      ) : (
                        <button
                          onClick={handleContinueToTransition}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                        >
                          Continue <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                      )}
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
                        requireFullWatch={false}
                        minWatchPercentage={90}
                        allowSkip={true}
                        testingMode={true}
                      />
                    </div>
                  )}

                  {transitionVideoWatched && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center"
                    >
                      {(currentScenario.isEndScenario || !selectedOption?.nextScenarioId) ? (
                        <button
                          onClick={handleExit}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-medium flex items-center"
                        >
                          End Preview <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                      ) : (
                        <button
                          onClick={handleNextScenario}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center"
                        >
                          Continue to Next Scenario <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {showPathPanel && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Path Taken</h3>
                  <button
                    onClick={() => setShowPathPanel(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {previewSession.pathHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No choices made yet</p>
                  ) : (
                    previewSession.pathHistory.map((entry, index) => (
                      <div key={index} className="border-l-2 border-blue-300 pl-3 pb-2">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {entry.scenarioTitle}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Selected: {entry.optionText}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Skill Impacts</h4>
                  {Object.keys(previewSession.skillImpacts).length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No impacts yet</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(previewSession.skillImpacts).map(([skill, impact]) => (
                        <div key={skill} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 capitalize">{skill}</span>
                          <span className={`text-sm font-semibold ${
                            impact > 0 ? 'text-green-600' : impact < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {impact > 0 ? '+' : ''}{impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!showPathPanel && (
            <button
              onClick={() => setShowPathPanel(true)}
              className="fixed right-6 top-24 bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioPreview;
