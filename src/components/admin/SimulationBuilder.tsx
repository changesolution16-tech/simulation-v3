'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Save, CheckCircle, Circle,
  FileText, Video, BarChart3, Network, Eye, Settings, X
} from 'lucide-react';
import VideoInputSelector from '../video/VideoInputSelector';
import ImageUpload from './ImageUpload';
import TabNavigation, { Tab } from './TabNavigation';
import type { VideoInput } from '@/types';

interface SimulationBuilderProps {
  simulationId?: string;
  categoryId?: string;
  onClose: () => void;
  onSuccess: (simulationId: string) => void;
}

type BuilderStep = 'basic' | 'landing' | 'introduction' | 'flow' | 'metrics' | 'closing' | 'review';

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface LearningObjective {
  id: string;
  text: string;
}

interface SimulationFormData {
  name: string;
  display_name: string;
  description: string;
  category_id: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;

  landing_page_enabled: boolean;
  landing_intro_video: VideoInput | null;
  landing_title: string;
  landing_description: string;
  landing_objectives: LearningObjective[];
  landing_role_description: string;
  landing_image_url: string;
  landing_image_alt: string;
  landing_fiction_contract: string;

  introduction_page_enabled: boolean;
  introduction_title: string;
  introduction_description: string;
  introduction_video: VideoInput | null;

  closing_page_enabled: boolean;
  closing_video_excellent: VideoInput | null;
  closing_video_good: VideoInput | null;
  closing_video_developing: VideoInput | null;
  closing_excellent_threshold: number;
  closing_good_threshold: number;
  closing_page_show_before_results: boolean;
  closing_title: string;
  closing_analysis_type: 'score' | 'skill' | 'journey' | 'comprehensive';
  closing_recommendations_enabled: boolean;

  tags: string[];
}

const SimulationBuilder: React.FC<SimulationBuilderProps> = ({
  simulationId,
  categoryId,
  onClose,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<BuilderStep>('basic');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingSimulation, setExistingSimulation] = useState<any | null>(null);

  const [formData, setFormData] = useState<SimulationFormData>({
    name: '',
    display_name: '',
    description: '',
    category_id: categoryId || '',
    difficulty: 'beginner',
    estimated_duration_minutes: 30,

    landing_page_enabled: true,
    landing_intro_video: null,
    landing_title: '',
    landing_description: '',
    landing_objectives: [],
    landing_role_description: '',
    landing_image_url: '',
    landing_image_alt: '',
    landing_fiction_contract: 'I agree to fully engage in this simulation as if it were real. I understand this is a safe learning environment where I can practice and make mistakes without real-world consequences.',

    introduction_page_enabled: true,
    introduction_title: '',
    introduction_description: '',
    introduction_video: null,

    closing_page_enabled: true,
    closing_video_excellent: null,
    closing_video_good: null,
    closing_video_developing: null,
    closing_excellent_threshold: 85,
    closing_good_threshold: 70,
    closing_page_show_before_results: true,
    closing_title: 'Simulation Complete',
    closing_analysis_type: 'comprehensive',
    closing_recommendations_enabled: true,

    tags: []
  });

  useEffect(() => {
    loadCategories();
    if (simulationId) {
      loadExistingSimulation();
    }
  }, [simulationId]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadExistingSimulation = async () => {
    if (!simulationId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/simulations/${simulationId}`);
      if (response.ok) {
        const simulation = await response.json();
        setExistingSimulation(simulation);
        setFormData({
          name: simulation.name,
          display_name: simulation.display_name,
          description: simulation.description || '',
          category_id: simulation.category_id || '',
          difficulty: simulation.difficulty,
          estimated_duration_minutes: simulation.estimated_duration_minutes,

          landing_page_enabled: simulation.landing_page_enabled,
          landing_intro_video: simulation.landing_intro_video || null,
          landing_title: simulation.landing_title || '',
          landing_description: simulation.landing_description || '',
          landing_objectives: simulation.landing_objectives || [],
          landing_role_description: simulation.landing_role_description || '',
          landing_image_url: simulation.landing_image_url || '',
          landing_image_alt: simulation.landing_image_alt || '',
          landing_fiction_contract: simulation.landing_fiction_contract,

          introduction_page_enabled: simulation.introduction_page_enabled !== false,
          introduction_title: simulation.introduction_title || '',
          introduction_description: simulation.introduction_description || '',
          introduction_video: simulation.introduction_video || null,

          closing_page_enabled: simulation.closing_page_enabled,
          closing_video_excellent: simulation.closing_video_excellent || null,
          closing_video_good: simulation.closing_video_good || null,
          closing_video_developing: simulation.closing_video_developing || null,
          closing_excellent_threshold: simulation.closing_excellent_threshold || 85,
          closing_good_threshold: simulation.closing_good_threshold || 70,
          closing_page_show_before_results: simulation.closing_page_show_before_results !== false,
          closing_title: simulation.closing_title,
          closing_analysis_type: simulation.closing_analysis_type,
          closing_recommendations_enabled: simulation.closing_recommendations_enabled,

          tags: simulation.tags || []
        });
      }
    } catch (error) {
      console.error('Error loading simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        name: formData.name || formData.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      };

      if (existingSimulation) {
        const response = await fetch(`/api/simulations/${existingSimulation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
        });

        if (response.ok) {
          alert('Simulation updated successfully!');
          onSuccess(existingSimulation.id);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to update simulation');
        }
      } else {
        const response = await fetch('/api/simulations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
        });

        if (response.ok) {
          const simulation = await response.json();
          alert('Simulation created successfully!');
          onSuccess(simulation.id);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create simulation');
        }
      }
    } catch (error: any) {
      console.error('Error saving simulation:', error);
      alert(`An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const steps: { id: BuilderStep; label: string; icon: React.ElementType }[] = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'landing', label: 'Landing Page', icon: FileText },
    { id: 'introduction', label: 'Introduction', icon: Video },
    { id: 'flow', label: 'Scenario Flow', icon: Network },
    { id: 'metrics', label: 'Metrics & Competencies', icon: Settings },
    { id: 'closing', label: 'Closing Page', icon: BarChart3 },
    { id: 'review', label: 'Review', icon: Eye }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return formData.display_name.trim() && formData.category_id;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      landing_objectives: [...prev.landing_objectives, { id: crypto.randomUUID(), text: '' }]
    }));
  };

  const removeObjective = (id: string) => {
    setFormData(prev => ({
      ...prev,
      landing_objectives: prev.landing_objectives.filter(obj => obj.id !== id)
    }));
  };

  const updateObjective = (id: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      landing_objectives: prev.landing_objectives.map(obj =>
        obj.id === id ? { ...obj, text } : obj
      )
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {existingSimulation ? 'Edit Simulation' : 'Create Simulation'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step Navigation */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex flex-col items-center gap-2 min-w-[100px] ${
                      isActive ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-center">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2 mt-5" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 'basic' && (
                <BasicInfoStep formData={formData} setFormData={setFormData} categories={categories} />
              )}
              {currentStep === 'landing' && (
                <LandingPageStep formData={formData} setFormData={setFormData} addObjective={addObjective} removeObjective={removeObjective} updateObjective={updateObjective} />
              )}
              {currentStep === 'introduction' && (
                <IntroductionPageStep formData={formData} setFormData={setFormData} />
              )}
              {currentStep === 'flow' && (
                <FlowBuilderStep simulationId={simulationId} />
              )}
              {currentStep === 'metrics' && (
                <MetricsStep simulationId={simulationId} />
              )}
              {currentStep === 'closing' && (
                <ClosingPageStep formData={formData} setFormData={setFormData} />
              )}
              {currentStep === 'review' && (
                <ReviewStep formData={formData} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {isLastStep ? (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : existingSimulation ? 'Update' : 'Create'} Simulation
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Step Components
const BasicInfoStep = ({ formData, setFormData, categories }: any) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Simulation Title *
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Difficult Conversations: Performance Management"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what learners will practice..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category...</option>
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty Level
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.estimated_duration_minutes}
            onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 30 })}
            min="1"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  </div>
);

const LandingPageStep = ({ formData, setFormData, addObjective, removeObjective, updateObjective }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Landing Page Configuration</h3>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.landing_page_enabled}
          onChange={(e) => setFormData({ ...formData, landing_page_enabled: e.target.checked })}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Enable landing page</span>
      </label>
    </div>

    {formData.landing_page_enabled && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Landing Title
          </label>
          <input
            type="text"
            value={formData.landing_title}
            onChange={(e) => setFormData({ ...formData, landing_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Welcome to the simulation..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Landing Description
          </label>
          <textarea
            value={formData.landing_description}
            onChange={(e) => setFormData({ ...formData, landing_description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what the learner will experience..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role Description
          </label>
          <textarea
            value={formData.landing_role_description}
            onChange={(e) => setFormData({ ...formData, landing_role_description: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Your role in this simulation..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Learning Objectives
          </label>
          <div className="space-y-2">
            {formData.landing_objectives.map((obj: LearningObjective) => (
              <div key={obj.id} className="flex gap-2">
                <input
                  type="text"
                  value={obj.text}
                  onChange={(e) => updateObjective(obj.id, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Learning objective..."
                />
                <button
                  onClick={() => removeObjective(obj.id)}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addObjective}
              className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              + Add Objective
            </button>
          </div>
        </div>

        <VideoInputSelector
          label="Landing Intro Video"
          value={formData.landing_intro_video}
          onChange={(video) => setFormData({ ...formData, landing_intro_video: video })}
          videoType="introduction"
          category="landing"
        />

        <ImageUpload
          label="Landing Page Image"
          value={formData.landing_image_url}
          onChange={(url) => setFormData({ ...formData, landing_image_url: url })}
          onAltTextChange={(alt) => setFormData({ ...formData, landing_image_alt: alt })}
          altText={formData.landing_image_alt}
        />
      </div>
    )}
  </div>
);

const IntroductionPageStep = ({ formData, setFormData }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Introduction Page Configuration</h3>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.introduction_page_enabled}
          onChange={(e) => setFormData({ ...formData, introduction_page_enabled: e.target.checked })}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Enable introduction page</span>
      </label>
    </div>

    {formData.introduction_page_enabled && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Introduction Title
          </label>
          <input
            type="text"
            value={formData.introduction_title}
            onChange={(e) => setFormData({ ...formData, introduction_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Get Ready"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Introduction Description
          </label>
          <textarea
            value={formData.introduction_description}
            onChange={(e) => setFormData({ ...formData, introduction_description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="What the learner should expect..."
          />
        </div>

        <VideoInputSelector
          label="Journey Overview Video"
          value={formData.introduction_video}
          onChange={(video) => setFormData({ ...formData, introduction_video: video })}
          videoType="introduction"
          category="introduction"
        />
      </div>
    )}
  </div>
);

const FlowBuilderStep = ({ simulationId }: any) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scenario Flow Builder</h3>
    {!simulationId ? (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Save the simulation first to add scenarios and configure flow.
        </p>
      </div>
    ) : (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Scenario flow builder will be available here. You'll be able to:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• Browse and add scenarios</li>
          <li>• Set entry points</li>
          <li>• Reorder scenario sequence</li>
          <li>• Configure branching logic</li>
        </ul>
      </div>
    )}
  </div>
);

const MetricsStep = ({ simulationId }: any) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Metrics & Competencies</h3>
    {!simulationId ? (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          Save the simulation first to configure metrics and competencies.
        </p>
      </div>
    ) : (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Metrics and competency configuration will be available here. You'll be able to:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• Select assessment metrics</li>
          <li>• Map metrics to competencies</li>
          <li>• Set competency weight matrix</li>
          <li>• Configure auto-mapping</li>
        </ul>
      </div>
    )}
  </div>
);

const ClosingPageStep = ({ formData, setFormData }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Closing Page Configuration</h3>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.closing_page_enabled}
          onChange={(e) => setFormData({ ...formData, closing_page_enabled: e.target.checked })}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Enable closing page</span>
      </label>
    </div>

    {formData.closing_page_enabled && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Closing Title
          </label>
          <input
            type="text"
            value={formData.closing_title}
            onChange={(e) => setFormData({ ...formData, closing_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Performance-Based Videos</h4>
          <p className="text-xs text-gray-500 mb-4">Configure different closing videos based on learner performance</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excellent Threshold (≥%)
                </label>
                <input
                  type="number"
                  value={formData.closing_excellent_threshold}
                  onChange={(e) => setFormData({ ...formData, closing_excellent_threshold: parseInt(e.target.value) || 85 })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Good Threshold (≥%)
                </label>
                <input
                  type="number"
                  value={formData.closing_good_threshold}
                  onChange={(e) => setFormData({ ...formData, closing_good_threshold: parseInt(e.target.value) || 70 })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <VideoInputSelector
              label="Excellent Performance Video (≥85%)"
              value={formData.closing_video_excellent}
              onChange={(video) => setFormData({ ...formData, closing_video_excellent: video })}
              videoType="conclusion"
              category="closing"
            />

            <VideoInputSelector
              label="Good Performance Video (70-84%)"
              value={formData.closing_video_good}
              onChange={(video) => setFormData({ ...formData, closing_video_good: video })}
              videoType="conclusion"
              category="closing"
            />

            <VideoInputSelector
              label="Developing Performance Video (<70%)"
              value={formData.closing_video_developing}
              onChange={(video) => setFormData({ ...formData, closing_video_developing: video })}
              videoType="conclusion"
              category="closing"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Analysis Type
          </label>
          <select
            value={formData.closing_analysis_type}
            onChange={(e) => setFormData({ ...formData, closing_analysis_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">Score Only</option>
            <option value="skill">Skill Breakdown</option>
            <option value="journey">Learning Journey</option>
            <option value="comprehensive">Comprehensive</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.closing_recommendations_enabled}
            onChange={(e) => setFormData({ ...formData, closing_recommendations_enabled: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Enable personalized learning recommendations</span>
        </label>
      </div>
    )}
  </div>
);

const ReviewStep = ({ formData }: any) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Configuration</h3>

    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Basic Information</h4>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Title:</dt>
            <dd className="text-gray-900 dark:text-white">{formData.display_name || 'Not set'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Difficulty:</dt>
            <dd className="text-gray-900 dark:text-white capitalize">{formData.difficulty}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600 dark:text-gray-400">Duration:</dt>
            <dd className="text-gray-900 dark:text-white">{formData.estimated_duration_minutes} min</dd>
          </div>
        </dl>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pages Configuration</h4>
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2">
            {formData.landing_page_enabled ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-gray-700 dark:text-gray-300">Landing Page</span>
          </li>
          <li className="flex items-center gap-2">
            {formData.introduction_page_enabled ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-gray-700 dark:text-gray-300">Introduction Page</span>
          </li>
          <li className="flex items-center gap-2">
            {formData.closing_page_enabled ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-gray-700 dark:text-gray-300">Closing Page</span>
          </li>
        </ul>
      </div>

      {formData.landing_objectives.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Learning Objectives</h4>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {formData.landing_objectives.map((obj: LearningObjective, idx: number) => (
              <li key={obj.id}>
                {idx + 1}. {obj.text || 'Empty objective'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);

export default SimulationBuilder;
