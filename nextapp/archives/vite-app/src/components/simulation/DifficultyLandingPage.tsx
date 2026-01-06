import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, CheckCircle2, Clock, Target, User, AlertCircle } from 'lucide-react';
import { useSimulationStore } from '../../store';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import { supabase } from '../../lib/supabase';
import { Difficulty, LandingPageContent } from '../../types';

const DifficultyLandingPage: React.FC = () => {
  const { topicId, difficulty } = useParams<{ topicId: string; difficulty: string }>();
  const navigate = useNavigate();

  const { currentUser, selectedTopic, selectedDifficulty, loadLandingPage, saveLandingPageProgress } = useSimulationStore();

  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent | null>(null);
  const [fictionContractText, setFictionContractText] = useState<string>('');
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoSkipped, setVideoSkipped] = useState(false);
  const [contractAgreed, setContractAgreed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId || !difficulty || !currentUser) {
      navigate('/simulation');
      return;
    }

    const loadContent = async () => {
      setLoading(true);
      try {
        const { data: simulation, error: simError } = await supabase
          .from('simulations')
          .select('*')
          .eq('category_id', topicId)
          .eq('difficulty', difficulty)
          .eq('status', 'published')
          .limit(1)
          .maybeSingle();

        if (simError && simError.code !== 'PGRST116') throw simError;

        if (simulation) {
          const content: LandingPageContent = {
            videoUrl: simulation.landing_intro_video_url,
            title: simulation.landing_title || simulation.display_name,
            description: simulation.landing_description || simulation.description,
            objectives: simulation.landing_objectives || [],
            roleDescription: simulation.landing_role_description,
            estimatedDuration: simulation.estimated_duration_minutes || 20,
            imageUrl: simulation.landing_image_url,
            imageAlt: simulation.landing_image_alt || 'Simulation illustration'
          };

          setLandingPageContent(content);
          setFictionContractText(simulation.landing_fiction_contract || 'I agree to fully engage in this simulation as if it were real. I understand this is a safe learning environment where I can practice and make mistakes without real-world consequences.');
        } else {
          const { data: scenarios, error } = await supabase
            .from('scenarios')
            .select('*')
            .eq('topic_id', topicId)
            .eq('difficulty', difficulty)
            .limit(1)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') throw error;

          if (scenarios) {
            const content: LandingPageContent = {
              videoUrl: scenarios[`landing_page_video_${difficulty}`],
              title: scenarios[`landing_page_title_${difficulty}`] || scenarios.title,
              description: scenarios[`landing_page_description_${difficulty}`] || scenarios.description,
              objectives: scenarios[`landing_page_objectives_${difficulty}`] || [],
              roleDescription: scenarios[`role_description_${difficulty}`],
              estimatedDuration: scenarios[`estimated_duration_${difficulty}`] || 20,
              imageUrl: scenarios[`landing_page_image_${difficulty}`],
              imageAlt: scenarios[`landing_page_image_alt_${difficulty}`] || 'Simulation illustration'
            };

            setLandingPageContent(content);
            setFictionContractText(scenarios.fiction_contract_text || 'I agree to fully engage in this simulation as if it were real. I understand this is a safe learning environment where I can practice and make mistakes without real-world consequences.');
          }
        }

        const { data: progress } = await supabase
          .from('landing_page_progress')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('topic_id', topicId)
          .eq('difficulty', difficulty)
          .maybeSingle();

        if (progress) {
          setVideoWatched(progress.video_watched);
          setVideoSkipped(progress.video_skipped);
          setContractAgreed(progress.fiction_contract_agreed);
        }
      } catch (error) {
        console.error('Error loading landing page:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [topicId, difficulty, currentUser, navigate]);

  const handleVideoComplete = async () => {
    setVideoWatched(true);
    await updateProgress({ video_watched: true, video_watch_percentage: 100 });
  };

  const handleVideoSkip = async () => {
    setVideoSkipped(true);
    await updateProgress({ video_skipped: true });
  };

  const updateProgress = async (updates: any) => {
    if (!currentUser || !topicId || !difficulty) return;

    try {
      const { data: existing } = await supabase
        .from('landing_page_progress')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('topic_id', topicId)
        .eq('difficulty', difficulty)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('landing_page_progress')
          .update({ ...updates, last_interaction_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('landing_page_progress')
          .insert({
            user_id: currentUser.id,
            topic_id: topicId,
            difficulty: difficulty,
            ...updates,
            last_interaction_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleContractChange = (checked: boolean) => {
    setContractAgreed(checked);
    if (checked) {
      updateProgress({
        fiction_contract_agreed: true,
        fiction_contract_agreed_at: new Date().toISOString()
      });
    }
  };

  const handleStartSimulation = async () => {
    if (!contractAgreed) return;

    await updateProgress({ ready_to_start: true });
    navigate('/simulation/scenario');
  };

  const handleSaveAndExit = async () => {
    await updateProgress({ ready_to_start: false });
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading simulation...</p>
        </div>
      </div>
    );
  }

  if (!landingPageContent) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
            <h3 className="text-lg font-semibold text-yellow-800">Content Not Available</h3>
          </div>
          <p className="text-yellow-700 mb-4">
            Landing page content is not yet configured for this simulation.
          </p>
          <button
            onClick={() => navigate('/simulation/scenario')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Continue to Simulation
          </button>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    beginner: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    intermediate: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    advanced: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  };

  const colors = difficultyColors[difficulty as Difficulty] || difficultyColors.beginner;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center">
          <button
            onClick={() => navigate('/simulation')}
            className="flex items-center text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Selection</span>
          </button>

          <div className="mx-4 text-gray-300">/</div>

          <div className="flex items-center gap-3">
            <span className="text-gray-800 dark:text-gray-100 font-medium">{selectedTopic?.title || 'Simulation'}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
              {difficulty?.charAt(0).toUpperCase()}{difficulty?.slice(1)}
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
                  {landingPageContent.estimatedDuration && (
                    <div className="flex items-center bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium">
                      <Clock className="w-4 h-4 mr-2" />
                      {landingPageContent.estimatedDuration} minutes
                    </div>
                  )}
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                  {landingPageContent.title}
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-500 leading-relaxed">
                  {landingPageContent.description}
                </p>
              </div>

              {landingPageContent.imageUrl && (
                <div className="relative h-64 lg:h-auto bg-gradient-to-br from-blue-100 to-blue-50">
                  <img
                    src={landingPageContent.imageUrl}
                    alt={landingPageContent.imageAlt}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {landingPageContent.videoUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Introduction Video</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Get familiar with the simulation context</p>
                  </div>
                </div>
                <SynthesiaPlayer
                  videoUrl={landingPageContent.videoUrl}
                  videoType="introduction"
                  onComplete={handleVideoComplete}
                  onSkip={handleVideoSkip}
                  autoPlay={false}
                  requireFullWatch={false}
                  minWatchPercentage={0}
                  allowSkip={true}
                  testingMode={true}
                />
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {landingPageContent.objectives && landingPageContent.objectives.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Learning Objectives</h2>
                </div>
                <div className="space-y-4">
                  {landingPageContent.objectives.map((objective, index) => (
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

            {landingPageContent.roleDescription && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Role</h2>
                </div>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    {landingPageContent.roleDescription}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Fiction Contract</h2>
              <p className="text-blue-800 text-lg mb-6 leading-relaxed">{fictionContractText}</p>
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={contractAgreed}
                  onChange={(e) => handleContractChange(e.target.checked)}
                  className="mt-1 h-6 w-6 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                />
                <span className="text-blue-900 font-semibold text-lg group-hover:text-blue-700 transition-colors">
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
                  : 'bg-gray-200 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <PlayCircle className="w-7 h-7 mr-3" />
              Start Simulation
            </button>
            <button
              onClick={handleSaveAndExit}
              className="sm:w-48 px-8 py-5 bg-white border-2 border-gray-300 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:bg-gray-900 hover:border-gray-400 transition-all font-semibold shadow-md hover:shadow-lg"
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
