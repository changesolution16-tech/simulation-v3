import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Save, Play, CheckCircle, Circle,
  FileText, Video, BarChart3, Network, Eye, ArrowUp, ArrowDown, AlertCircle, Settings
} from 'lucide-react';
import { useSimulationStore } from '../../store';
import { SimulationService } from '../../lib/simulations';
import { Simulation, SimulationFormData, Difficulty, LearningObjective, VideoInput } from '../../types';
import { supabase } from '../../lib/supabase';
import VideoInputSelectorWithLibrary from '../video/VideoInputSelectorWithLibrary';
import MetricCompetencyMappingManager from './MetricCompetencyMappingManager';
import CompetencyWeightMatrixEditor from './CompetencyWeightMatrixEditor';
import ImageUpload from './ImageUpload';

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

const SimulationBuilder: React.FC<SimulationBuilderProps> = ({
  simulationId,
  categoryId,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useSimulationStore();
  const [currentStep, setCurrentStep] = useState<BuilderStep>('basic');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingSimulation, setExistingSimulation] = useState<Simulation | null>(null);

  const detectPlatformFromUrl = (url: string | undefined, source: string): 'youtube' | 'synthesia' | 'vimeo' | 'file' | 'embed' => {
    if (!url) return 'synthesia';
    if (source === 'upload' || source === 'file') return 'file';
    if (source === 'embed') return 'embed';

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';

    return 'synthesia';
  };

  const [formData, setFormData] = useState<SimulationFormData>({
    name: '',
    display_name: '',
    description: '',
    category_id: categoryId || '',
    difficulty: 'beginner',
    estimated_duration_minutes: 30,

    landing_page_enabled: true,
    landing_intro_video_url: '',
    landing_intro_video_type: 'synthesia',
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
    introduction_video_url: '',
    introduction_video_type: 'synthesia',

    closing_page_enabled: true,
    closing_video_url: '',
    closing_video_type: 'synthesia',
    closing_video_excellent_url: '',
    closing_video_excellent_type: 'synthesia',
    closing_video_excellent_file_id: undefined,
    closing_video_excellent_source: undefined,
    closing_video_good_url: '',
    closing_video_good_type: 'synthesia',
    closing_video_good_file_id: undefined,
    closing_video_good_source: undefined,
    closing_video_developing_url: '',
    closing_video_developing_type: 'synthesia',
    closing_video_developing_file_id: undefined,
    closing_video_developing_source: undefined,
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
    const { data } = await supabase
      .from('simulation_categories')
      .select('id, name, description')
      .eq('is_active', true)
      .order('display_order');

    if (data) setCategories(data);
  };

  const loadExistingSimulation = async () => {
    if (!simulationId) return;

    setLoading(true);
    try {
      console.log('[SimulationBuilder] Loading simulation:', simulationId);
      const simulation = await SimulationService.getSimulation(simulationId);

      if (simulation) {
        console.log('[SimulationBuilder] Simulation loaded successfully');
        setExistingSimulation(simulation);
        setFormData({
          name: simulation.name,
          display_name: simulation.display_name,
          description: simulation.description || '',
          category_id: simulation.category_id || '',
          difficulty: simulation.difficulty,
          estimated_duration_minutes: simulation.estimated_duration_minutes,

          landing_page_enabled: simulation.landing_page_enabled,
          landing_intro_video_url: simulation.landing_intro_video_url || '',
          landing_intro_video_type: simulation.landing_intro_video_type,
          landing_title: simulation.landing_title || '',
          landing_description: simulation.landing_description || '',
          landing_objectives: simulation.landing_objectives,
          landing_role_description: simulation.landing_role_description || '',
          landing_image_url: simulation.landing_image_url || '',
          landing_image_alt: simulation.landing_image_alt || '',
          landing_fiction_contract: simulation.landing_fiction_contract,

          introduction_page_enabled: simulation.introduction_page_enabled !== false,
          introduction_title: simulation.introduction_title || '',
          introduction_description: simulation.introduction_description || '',
          introduction_video_url: simulation.introduction_video_url || '',
          introduction_video_type: simulation.introduction_video_type || 'synthesia',

          closing_page_enabled: simulation.closing_page_enabled,
          closing_video_url: simulation.closing_video_url || '',
          closing_video_type: simulation.closing_video_type,
          closing_video_excellent_url: simulation.closing_video_excellent_url || '',
          closing_video_excellent_type: simulation.closing_video_excellent_type || 'synthesia',
          closing_video_excellent_file_id: simulation.closing_video_excellent_file_id,
          closing_video_excellent_source: simulation.closing_video_excellent_source,
          closing_video_good_url: simulation.closing_video_good_url || '',
          closing_video_good_type: simulation.closing_video_good_type || 'synthesia',
          closing_video_good_file_id: simulation.closing_video_good_file_id,
          closing_video_good_source: simulation.closing_video_good_source,
          closing_video_developing_url: simulation.closing_video_developing_url || '',
          closing_video_developing_type: simulation.closing_video_developing_type || 'synthesia',
          closing_video_developing_file_id: simulation.closing_video_developing_file_id,
          closing_video_developing_source: simulation.closing_video_developing_source,
          closing_excellent_threshold: simulation.closing_excellent_threshold || 85,
          closing_good_threshold: simulation.closing_good_threshold || 70,
          closing_page_show_before_results: simulation.closing_page_show_before_results !== false,
          closing_title: simulation.closing_title,
          closing_analysis_type: simulation.closing_analysis_type,
          closing_recommendations_enabled: simulation.closing_recommendations_enabled,

          tags: simulation.tags
        });
      } else {
        console.error('[SimulationBuilder] Failed to load simulation - returned null');
      }
    } catch (error) {
      console.error('[SimulationBuilder] Error loading simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) {
      alert('You must be logged in to save simulations');
      return;
    }

    setLoading(true);

    try {
      console.log('[SimulationBuilder] Current user:', currentUser.id, currentUser.email, currentUser.role);
      console.log('[SimulationBuilder] Saving simulation...');

      // Clean formData: convert empty strings to null for optional text fields
      const cleanedFormData = {
        ...formData,
        introduction_title: formData.introduction_title?.trim() || null,
        introduction_description: formData.introduction_description?.trim() || null,
        introduction_video_url: formData.introduction_video_url?.trim() || null,
        landing_title: formData.landing_title?.trim() || null,
        landing_description: formData.landing_description?.trim() || null,
        landing_role_description: formData.landing_role_description?.trim() || null,
        landing_intro_video_url: formData.landing_intro_video_url?.trim() || null,
        landing_image_url: formData.landing_image_url?.trim() || null,
        landing_image_alt: formData.landing_image_alt?.trim() || null,
        closing_video_url: formData.closing_video_url?.trim() || null,
        closing_video_excellent_url: formData.closing_video_excellent_url?.trim() || null,
        closing_video_good_url: formData.closing_video_good_url?.trim() || null,
        closing_video_developing_url: formData.closing_video_developing_url?.trim() || null,
      };

      if (existingSimulation) {
        console.log('[SimulationBuilder] Updating existing simulation:', existingSimulation.id);

        try {
          const success = await SimulationService.updateSimulation(
            existingSimulation.id,
            cleanedFormData
          );

          if (success) {
            console.log('[SimulationBuilder] Update successful, calling onSuccess');
            alert('Simulation updated successfully!');
            onSuccess(existingSimulation.id);
          } else {
            console.error('[SimulationBuilder] Update returned false');
            alert('Failed to update simulation. The update did not complete successfully.');
          }
        } catch (updateError: any) {
          console.error('[SimulationBuilder] Update threw error:', updateError);
          alert(`Failed to update simulation: ${updateError.message || 'Unknown error'}`);
        }
      } else {
        console.log('[SimulationBuilder] Creating new simulation');

        try {
          const simulation = await SimulationService.createSimulation(cleanedFormData, currentUser.id);

          if (simulation) {
            console.log('[SimulationBuilder] Create successful:', simulation.id);
            alert('Simulation created successfully!');
            onSuccess(simulation.id);
          } else {
            console.error('[SimulationBuilder] Create returned null');
            alert('Failed to create simulation. The creation did not complete successfully.');
          }
        } catch (createError: any) {
          console.error('[SimulationBuilder] Create threw error:', createError);
          alert(`Failed to create simulation: ${createError.message || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('[SimulationBuilder] Unexpected error in handleSave:', error);
      alert(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const steps: { id: BuilderStep; label: string; icon: React.ElementType }[] = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'landing', label: 'Landing Page', icon: FileText },
    { id: 'introduction', label: 'Introduction Page', icon: Video },
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
        return formData.name.trim() && formData.display_name.trim() && formData.category_id;
      case 'landing':
        return true;
      case 'introduction':
        return true;
      case 'flow':
        return true;
      case 'metrics':
        return true;
      case 'closing':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1].id;
      setCurrentStep(nextStep);

      if (nextStep === 'review' && existingSimulation?.id) {
        await loadExistingSimulation();
      }
    }
  };

  const handlePrevious = async () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1].id;
      setCurrentStep(prevStep);

      if (prevStep === 'review' && existingSimulation?.id) {
        await loadExistingSimulation();
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return <BasicInfoStep formData={formData} setFormData={setFormData} categories={categories} />;
      case 'landing':
        return <LandingPageStep formData={formData} setFormData={setFormData} simulationId={simulationId} />;
      case 'introduction':
        return <IntroductionPageStep formData={formData} setFormData={setFormData} />;
      case 'flow':
        return <FlowBuilderStep simulationId={existingSimulation?.id} />;
      case 'metrics':
        return existingSimulation?.id ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Competency Weight Matrix</h3>
              <CompetencyWeightMatrixEditor
                simulationId={existingSimulation.id}
                showInheritanceInfo={true}
                readOnly={false}
              />
            </div>
            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Metric-Competency Mappings</h3>
              <MetricCompetencyMappingManager simulationId={existingSimulation.id} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600">Save the simulation first to configure metric-competency mappings</p>
            </div>
          </div>
        );
      case 'closing':
        return <ClosingPageStep formData={formData} setFormData={setFormData} />;
      case 'review':
        return <ReviewStep formData={formData} existingSimulation={existingSimulation} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {existingSimulation ? 'Edit' : 'Create'} Simulation
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium hidden md:inline">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-3">
            {isLastStep ? (
              <button
                onClick={handleSave}
                disabled={loading || !canProceed()}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : existingSimulation ? 'Update Simulation' : 'Create Simulation'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Basic Info Step Component
const BasicInfoStep: React.FC<{
  formData: SimulationFormData;
  setFormData: (data: SimulationFormData) => void;
  categories: Category[];
}> = ({ formData, setFormData, categories }) => {
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleDisplayNameChange = (displayName: string) => {
    setFormData({
      ...formData,
      display_name: displayName,
      name: formData.name || generateSlug(displayName)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Start by providing the core details about your simulation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Customer Service Excellence"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the name learners will see
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Internal Name (Slug) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="e.g., customer-service-excellence"
          />
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier for this simulation (lowercase, hyphens only)
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide a brief description of what learners will experience in this simulation..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.estimated_duration_minutes}
            onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 30 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="5"
            step="5"
          />
        </div>
      </div>
    </div>
  );
};

// Landing Page Step Component
const LandingPageStep: React.FC<{
  formData: SimulationFormData;
  setFormData: (data: SimulationFormData) => void;
  simulationId?: string;
}> = ({ formData, setFormData, simulationId }) => {
  const [newObjective, setNewObjective] = useState('');

  const detectPlatformFromUrl = (url: string | undefined, source: string): 'youtube' | 'synthesia' | 'vimeo' | 'file' | 'embed' => {
    if (!url) return 'synthesia';
    if (source === 'upload' || source === 'file') return 'file';
    if (source === 'embed') return 'embed';

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';

    return 'synthesia';
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData({
        ...formData,
        landing_objectives: [...formData.landing_objectives, { text: newObjective.trim() }]
      });
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      landing_objectives: formData.landing_objectives.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Landing Page Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure what learners see before starting the simulation
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={formData.landing_page_enabled}
          onChange={(e) => setFormData({ ...formData, landing_page_enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          Enable Landing Page
        </label>
      </div>

      {formData.landing_page_enabled && (
        <div className="space-y-6 pl-7">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Landing Page Title
            </label>
            <input
              type="text"
              value={formData.landing_title}
              onChange={(e) => setFormData({ ...formData, landing_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Welcome to Customer Service Excellence"
            />
          </div>

          <div>
            <VideoInputSelectorWithLibrary
              label="Introduction Video"
              value={
                formData.landing_intro_video_url
                  ? {
                      source: 'url',
                      url: formData.landing_intro_video_url,
                      videoType: formData.landing_intro_video_type
                    }
                  : undefined
              }
              onChange={(input: VideoInput) => {
                const platformType = detectPlatformFromUrl(input.url, input.source);
                setFormData({
                  ...formData,
                  landing_intro_video_url: input.url || '',
                  landing_intro_video_type: platformType
                });
              }}
              videoType="introduction"
              category="simulation-landing"
              helpText="Add an introductory video for the landing page"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Landing Description
            </label>
            <textarea
              value={formData.landing_description}
              onChange={(e) => setFormData({ ...formData, landing_description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what learners will experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Objectives
            </label>
            <div className="space-y-2 mb-3">
              {formData.landing_objectives.map((obj, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                    {obj.text}
                  </span>
                  <button
                    onClick={() => removeObjective(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add learning objective..."
              />
              <button
                onClick={addObjective}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Description
            </label>
            <textarea
              value={formData.landing_role_description}
              onChange={(e) => setFormData({ ...formData, landing_role_description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the role learners will take on..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Landing Page Image
            </label>
            <ImageUpload
              currentImageUrl={formData.landing_image_url}
              onImageUploaded={(imageUrl) => setFormData({ ...formData, landing_image_url: imageUrl })}
              onError={(error) => console.error('Image upload error:', error)}
              category="simulation-images"
              referenceId={simulationId || 'new'}
              maxFileSizeMB={10}
            />
            <p className="text-xs text-gray-500 mt-2">
              Upload a high-quality image for the simulation landing page. Recommended size: 1200x600px or larger.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Alt Text (for accessibility)
            </label>
            <input
              type="text"
              value={formData.landing_image_alt || ''}
              onChange={(e) => setFormData({ ...formData, landing_image_alt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the image for screen readers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fiction Contract Text
            </label>
            <textarea
              value={formData.landing_fiction_contract}
              onChange={(e) => setFormData({ ...formData, landing_fiction_contract: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Introduction Page Step Component
const IntroductionPageStep: React.FC<{
  formData: SimulationFormData;
  setFormData: (data: SimulationFormData) => void;
}> = ({ formData, setFormData }) => {
  const detectPlatformFromUrl = (url: string | undefined, source: string): 'youtube' | 'synthesia' | 'vimeo' | 'file' | 'embed' => {
    if (!url) return 'synthesia';
    if (source === 'upload' || source === 'file') return 'file';
    if (source === 'embed') return 'embed';

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';

    return 'synthesia';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Introduction Page Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure what learners see after clicking "Start Simulation" on the landing page. This is where they commit to participating.
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={formData.introduction_page_enabled}
          onChange={(e) => setFormData({ ...formData, introduction_page_enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          Enable Introduction Page
        </label>
      </div>

      {formData.introduction_page_enabled && (
        <div className="space-y-6 pl-7">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Introduction Page Title
            </label>
            <input
              type="text"
              value={formData.introduction_title}
              onChange={(e) => setFormData({ ...formData, introduction_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Welcome to Your Leadership Journey"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use the simulation display name
            </p>
          </div>

          <div>
            <VideoInputSelectorWithLibrary
              label="Journey Overview Video"
              value={
                formData.introduction_video_url
                  ? {
                      source: 'url',
                      url: formData.introduction_video_url,
                      videoType: formData.introduction_video_type
                    }
                  : undefined
              }
              onChange={(input: VideoInput) => {
                console.log('[IntroductionPage] Video input changed:', input);
                const platformType = detectPlatformFromUrl(input.url, input.source);
                const updatedFormData = {
                  ...formData,
                  introduction_video_url: input.url || '',
                  introduction_video_type: platformType
                };
                console.log('[IntroductionPage] Updated formData:', {
                  introduction_video_url: updatedFormData.introduction_video_url,
                  introduction_video_type: updatedFormData.introduction_video_type,
                  detected_platform: platformType
                });
                setFormData(updatedFormData);
              }}
              videoType="introduction"
              category="simulation-introduction"
              helpText="Add a video that introduces the journey and sets expectations"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What to Expect (Description)
            </label>
            <textarea
              value={formData.introduction_description}
              onChange={(e) => setFormData({ ...formData, introduction_description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what learners should expect during this simulation..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This appears after the video and before the participation agreement
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Participation Agreement</h4>
            <p className="text-sm text-gray-700">
              Learners will be required to check a box agreeing to:
            </p>
            <p className="text-sm text-gray-600 italic mt-2">
              "I agree to fully engage in this simulation as if it were real. I understand this is a safe learning environment where I can practice and make mistakes without real-world consequences."
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Note: This agreement text is currently hardcoded. Future updates will allow customization.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Flow Builder Step Component
const FlowBuilderStep: React.FC<{
  simulationId?: string;
}> = ({ simulationId }) => {
  const [availableScenarios, setAvailableScenarios] = useState<any[]>([]);
  const [addedScenarios, setAddedScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [entryScenarioId, setEntryScenarioId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTopics();
    loadScenarios();
    if (simulationId) {
      loadSimulationScenarios();
    }
  }, [simulationId]);

  const loadTopics = async () => {
    const { data } = await supabase.from('topics').select('*').order('title');
    if (data) setTopics(data);
  };

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('id, title, description, topic_id, difficulty, content_status, is_end_scenario')
        .order('title');

      if (error) throw error;
      setAvailableScenarios(data || []);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSimulationScenarios = async () => {
    if (!simulationId) return;

    setLoading(true);
    try {
      const { data: simData } = await supabase
        .from('simulations')
        .select('entry_scenario_id')
        .eq('id', simulationId)
        .maybeSingle();

      if (simData?.entry_scenario_id) {
        setEntryScenarioId(simData.entry_scenario_id);
      }

      const { data, error } = await supabase
        .from('simulation_scenarios')
        .select(`
          id,
          scenario_id,
          sequence_order,
          is_entry_point,
          is_exit_point,
          scenarios (
            id,
            title,
            description,
            topic_id,
            difficulty,
            content_status,
            is_end_scenario
          )
        `)
        .eq('simulation_id', simulationId)
        .order('sequence_order');

      if (error) throw error;

      const scenarios = (data || []).map((item: any) => ({
        ...item.scenarios,
        simulationScenarioId: item.id,
        sequence_order: item.sequence_order,
        is_entry_point: item.is_entry_point,
        is_exit_point: item.is_exit_point
      }));

      setAddedScenarios(scenarios);
    } catch (error) {
      console.error('Error loading simulation scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScenario = async (scenario: any) => {
    if (!simulationId) {
      alert('Please save the simulation first before adding scenarios');
      return;
    }

    setSaving(true);
    try {
      const nextSequence = addedScenarios.length;
      const isFirstScenario = addedScenarios.length === 0;

      const result = await SimulationService.addScenarioToSimulation(
        simulationId,
        scenario.id,
        {
          isEntryPoint: isFirstScenario,
          sequenceOrder: nextSequence
        }
      );

      if (result) {
        if (isFirstScenario) {
          await SimulationService.setEntryPoint(simulationId, scenario.id);
          setEntryScenarioId(scenario.id);
        }
        await loadSimulationScenarios();
      }
    } catch (error) {
      console.error('Error adding scenario:', error);
      alert('Failed to add scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveScenario = async (scenario: any) => {
    if (!simulationId) return;

    if (!confirm(`Remove "${scenario.title}" from this simulation?`)) return;

    setSaving(true);
    try {
      const success = await SimulationService.removeScenarioFromSimulation(
        simulationId,
        scenario.id
      );

      if (success) {
        if (entryScenarioId === scenario.id) {
          setEntryScenarioId('');
        }
        await loadSimulationScenarios();
      }
    } catch (error) {
      console.error('Error removing scenario:', error);
      alert('Failed to remove scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleSetEntryPoint = async (scenarioId: string) => {
    if (!simulationId) return;

    setSaving(true);
    try {
      const success = await SimulationService.setEntryPoint(simulationId, scenarioId);
      if (success) {
        setEntryScenarioId(scenarioId);
        await loadSimulationScenarios();
      }
    } catch (error) {
      console.error('Error setting entry point:', error);
      alert('Failed to set entry point');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveScenario = async (index: number, direction: 'up' | 'down') => {
    if (!simulationId) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= addedScenarios.length) return;

    const reordered = [...addedScenarios];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    setAddedScenarios(reordered);

    setSaving(true);
    try {
      for (let i = 0; i < reordered.length; i++) {
        await SimulationService.updateSimulationScenario(
          reordered[i].simulationScenarioId,
          { sequence_order: i }
        );
      }
    } catch (error) {
      console.error('Error reordering scenarios:', error);
      await loadSimulationScenarios();
    } finally {
      setSaving(false);
    }
  };

  const filteredAvailable = availableScenarios.filter(scenario => {
    const alreadyAdded = addedScenarios.some(added => added.id === scenario.id);
    if (alreadyAdded) return false;

    const matchesSearch = !searchTerm ||
      scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTopic = !topicFilter || scenario.topic_id === topicFilter;
    const matchesDifficulty = !difficultyFilter || scenario.difficulty === difficultyFilter;

    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  const getTopicName = (topicId: string) => {
    return topics.find(t => t.id === topicId)?.title || 'Unknown';
  };

  if (!simulationId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Scenario Flow</h3>
          <p className="text-sm text-gray-600 mb-6">
            Build your learning path by connecting scenarios
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-600" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Save Simulation First
          </h4>
          <p className="text-sm text-gray-600">
            Please complete the basic information and save your simulation before adding scenarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Scenario Flow</h3>
        <p className="text-sm text-gray-600 mb-6">
          Add scenarios to build your learning path. The first scenario added becomes the entry point.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Available Scenarios</h4>
            <span className="text-xs text-gray-500">{filteredAvailable.length} available</span>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Topics</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : filteredAvailable.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No scenarios available
              </div>
            ) : (
              filteredAvailable.map(scenario => (
                <div
                  key={scenario.id}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{scenario.title}</h5>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{scenario.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {getTopicName(scenario.topic_id)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                          {scenario.difficulty}
                        </span>
                        {scenario.is_end_scenario && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            End Scenario
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddScenario(scenario)}
                      disabled={saving}
                      className="ml-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Simulation Scenarios</h4>
            <span className="text-xs text-gray-500">{addedScenarios.length} scenarios</span>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg min-h-96 max-h-96 overflow-y-auto">
            {addedScenarios.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No scenarios added yet. Add scenarios from the left panel.
              </div>
            ) : (
              addedScenarios.map((scenario, index) => (
                <div
                  key={scenario.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                    entryScenarioId === scenario.id ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">{scenario.title}</h5>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {getTopicName(scenario.topic_id)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                          {scenario.difficulty}
                        </span>
                        {entryScenarioId === scenario.id && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                            Entry Point
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 ml-3">
                      <button
                        onClick={() => handleMoveScenario(index, 'up')}
                        disabled={index === 0 || saving}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveScenario(index, 'down')}
                        disabled={index === addedScenarios.length - 1 || saving}
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {entryScenarioId !== scenario.id && (
                      <button
                        onClick={() => handleSetEntryPoint(scenario.id)}
                        disabled={saving}
                        className="text-xs px-2 py-1 text-green-700 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                      >
                        Set as Entry
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveScenario(scenario)}
                      disabled={saving}
                      className="text-xs px-2 py-1 text-red-700 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {addedScenarios.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Scenarios are connected through their response options.
                Use the Flow Builder to visualize and edit connections between scenarios.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Closing Page Step Component
const ClosingPageStep: React.FC<{
  formData: SimulationFormData;
  setFormData: (data: SimulationFormData) => void;
}> = ({ formData, setFormData }) => {
  const detectPlatformFromUrl = (url: string | undefined, source: string): 'youtube' | 'synthesia' | 'vimeo' | 'file' | 'embed' => {
    if (!url) return 'synthesia';
    if (source === 'upload' || source === 'file') return 'file';
    if (source === 'embed') return 'embed';

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';

    return 'synthesia';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Closing Page Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure what learners see after completing the simulation. Set performance-based videos that adapt to the learner's metric scores.
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={formData.closing_page_enabled}
          onChange={(e) => setFormData({ ...formData, closing_page_enabled: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          Enable Closing Page
        </label>
      </div>

      {formData.closing_page_enabled && (
        <div className="space-y-6 pl-7">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Closing Page Title
            </label>
            <input
              type="text"
              value={formData.closing_title}
              onChange={(e) => setFormData({ ...formData, closing_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Simulation Complete"
            />
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={formData.closing_page_show_before_results}
              onChange={(e) => setFormData({ ...formData, closing_page_show_before_results: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Show closing as separate page before results
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Performance-Based Video Tiers</h4>
            <p className="text-xs text-gray-700 mb-3">
              Configure different closing videos based on learner performance. The appropriate video will be shown automatically based on their total metric score percentage.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Excellent Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.closing_excellent_threshold}
                  onChange={(e) => setFormData({ ...formData, closing_excellent_threshold: parseInt(e.target.value) || 85 })}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-600 mt-1">≥ this score shows excellent video</p>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Good Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.closing_good_threshold}
                  onChange={(e) => setFormData({ ...formData, closing_good_threshold: parseInt(e.target.value) || 70 })}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-600 mt-1">≥ this score shows good video</p>
              </div>
            </div>
          </div>

          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <VideoInputSelectorWithLibrary
              label="🏆 Excellent Performance Video"
              value={
                formData.closing_video_excellent_url
                  ? {
                      source: formData.closing_video_excellent_source || 'url',
                      url: formData.closing_video_excellent_url,
                      videoType: formData.closing_video_excellent_type,
                      fileId: formData.closing_video_excellent_file_id
                    }
                  : undefined
              }
              onChange={(input: VideoInput) => {
                const platformType = detectPlatformFromUrl(input.url, input.source);
                setFormData({
                  ...formData,
                  closing_video_excellent_url: input.url || '',
                  closing_video_excellent_type: platformType,
                  closing_video_excellent_file_id: input.fileId,
                  closing_video_excellent_source: input.source
                });
              }}
              videoType="supplementary"
              category="simulation-closing-excellent"
              helpText={`Shown to learners scoring ≥${formData.closing_excellent_threshold}%. Celebrate their achievement!`}
            />
          </div>

          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <VideoInputSelectorWithLibrary
              label="👍 Good Performance Video"
              value={
                formData.closing_video_good_url
                  ? {
                      source: formData.closing_video_good_source || 'url',
                      url: formData.closing_video_good_url,
                      videoType: formData.closing_video_good_type,
                      fileId: formData.closing_video_good_file_id
                    }
                  : undefined
              }
              onChange={(input: VideoInput) => {
                const platformType = detectPlatformFromUrl(input.url, input.source);
                setFormData({
                  ...formData,
                  closing_video_good_url: input.url || '',
                  closing_video_good_type: platformType,
                  closing_video_good_file_id: input.fileId,
                  closing_video_good_source: input.source
                });
              }}
              videoType="supplementary"
              category="simulation-closing-good"
              helpText={`Shown to learners scoring ${formData.closing_good_threshold}%-${formData.closing_excellent_threshold - 1}%. Encourage continued growth!`}
            />
          </div>

          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <VideoInputSelectorWithLibrary
              label="📈 Developing Performance Video"
              value={
                formData.closing_video_developing_url
                  ? {
                      source: formData.closing_video_developing_source || 'url',
                      url: formData.closing_video_developing_url,
                      videoType: formData.closing_video_developing_type,
                      fileId: formData.closing_video_developing_file_id
                    }
                  : undefined
              }
              onChange={(input: VideoInput) => {
                const platformType = detectPlatformFromUrl(input.url, input.source);
                setFormData({
                  ...formData,
                  closing_video_developing_url: input.url || '',
                  closing_video_developing_type: platformType,
                  closing_video_developing_file_id: input.fileId,
                  closing_video_developing_source: input.source
                });
              }}
              videoType="supplementary"
              category="simulation-closing-developing"
              helpText={`Shown to learners scoring <${formData.closing_good_threshold}%. Provide supportive guidance for improvement!`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Type
            </label>
            <select
              value={formData.closing_analysis_type}
              onChange={(e) => setFormData({ ...formData, closing_analysis_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="score">Score-Based Analysis</option>
              <option value="skill">Skill-Based Analysis</option>
              <option value="journey">Journey-Based Analysis</option>
              <option value="comprehensive">Comprehensive Analysis</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.closing_recommendations_enabled}
              onChange={(e) => setFormData({ ...formData, closing_recommendations_enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Show Personalized Recommendations
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// Review Step Component
const ReviewStep: React.FC<{
  formData: SimulationFormData;
  existingSimulation: Simulation | null;
}> = ({ formData, existingSimulation }) => {
  const [scenarioCount, setScenarioCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (existingSimulation?.id) {
      loadScenarioCount();
    }
  }, [existingSimulation?.id]);

  const loadScenarioCount = async () => {
    if (!existingSimulation?.id) return;

    setLoading(true);
    try {
      const { count } = await supabase
        .from('simulation_scenarios')
        .select('*', { count: 'exact', head: true })
        .eq('simulation_id', existingSimulation.id);

      setScenarioCount(count || 0);
    } catch (error) {
      console.error('Error loading scenario count:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Review & Create</h3>
        <p className="text-sm text-gray-600 mb-6">
          Review your simulation configuration before {existingSimulation ? 'updating' : 'creating'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Basic Information</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Display Name:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.display_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Difficulty:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium capitalize">{formData.difficulty}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Duration:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.estimated_duration_minutes} minutes</dd>
            </div>
          </dl>
        </div>

        {existingSimulation && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Scenario Flow</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-gray-600">Scenarios Added:</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {loading ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : (
                    <span className={scenarioCount === 0 ? 'text-red-600' : 'text-green-600'}>
                      {scenarioCount}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            {!loading && scenarioCount === 0 && (
              <p className="text-xs text-amber-700 mt-2">
                No scenarios added yet. Add scenarios in the Scenario Flow step to make this simulation playable.
              </p>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Landing Page</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Enabled:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.landing_page_enabled ? 'Yes' : 'No'}</dd>
            </div>
            {formData.landing_page_enabled && (
              <>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Objectives:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.landing_objectives.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Video:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.landing_intro_video_url ? 'Yes' : 'No'}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Introduction Page</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Enabled:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.introduction_page_enabled ? 'Yes' : 'No'}</dd>
            </div>
            {formData.introduction_page_enabled && (
              <>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Title:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.introduction_title || 'Default'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Video:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.introduction_video_url ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Description:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.introduction_description ? 'Yes' : 'No'}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Closing Page</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Enabled:</dt>
              <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.closing_page_enabled ? 'Yes' : 'No'}</dd>
            </div>
            {formData.closing_page_enabled && (
              <>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Analysis Type:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium capitalize">{formData.closing_analysis_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Recommendations:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">{formData.closing_recommendations_enabled ? 'Yes' : 'No'}</dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Next Steps:</strong> After {existingSimulation ? 'updating' : 'creating'} this simulation,
          you'll be able to add scenarios and build the learning path in the flow builder.
        </p>
      </div>
    </div>
  );
};

export default SimulationBuilder;
