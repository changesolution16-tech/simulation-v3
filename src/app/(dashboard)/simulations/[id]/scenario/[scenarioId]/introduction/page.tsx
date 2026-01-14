'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, PlayCircle, Clock, FolderOpen, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import VideoPlayer from '@/components/simulation/VideoPlayer';

export default function ScenarioIntroductionPage({
  params,
}: {
  params: { id: string; scenarioId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { language, t } = useLanguage();

  const [simulation, setSimulation] = useState<any>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoWatched, setVideoWatched] = useState(false);

  const simulationId = params.id;
  const scenarioId = params.scenarioId;
  const instanceId = searchParams?.get('instanceId') || sessionStorage.getItem('currentInstanceId');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    loadData();
  }, [session, simulationId, scenarioId]);

  const loadData = async () => {
    setLoading(true);

    try {
      // Load simulation
      const simResponse = await fetch(`/api/simulations/${simulationId}`);
      if (!simResponse.ok) throw new Error('Failed to load simulation');

      const simData = await simResponse.json();
      setSimulation(simData);

      // Find the scenario
      const foundScenario = simData.scenarios?.find(
        (s: any) => s.scenario_id === scenarioId || s.id === scenarioId
      );

      if (!foundScenario) {
        throw new Error('Scenario not found');
      }

      setScenario(foundScenario);
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/dashboard');
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
    router.push(
      `/simulations/${simulationId}/scenario/${scenarioId}/question?instanceId=${instanceId}`
    );
  };

  const getTranslatedField = (obj: any, field: string) => {
    const fieldWithLang = `${field}_${language}`;
    return obj?.[fieldWithLang] || obj?.[field] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('simulation.introduction.loadingScenario')}</p>
        </div>
      </div>
    );
  }

  if (!simulation || !scenario) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('simulation.introduction.scenarioNotFound')}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('simulation.landing.backToSimulations')}
          </button>
        </div>
      </div>
    );
  }

  const scenarioData = scenario.scenarios || scenario;
  const introVideoUrl = scenarioData.introductionVideoUrl || scenarioData.introduction_video_url;
  const canContinue = !introVideoUrl || videoWatched;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>{t('simulation.introduction.exitSimulation')}</span>
            </button>

            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <span>
                {t('simulation.question.levelOf', {
                  current: (scenarioData?.hierarchyLevel ?? 0) + 1,
                  total: (simulation.max_level ?? 0) + 1,
                })}
              </span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-blue-600 text-white">
                  1
                </div>
                <span>{t('simulation.introduction.stepIntroduction')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-300 text-white">
                  2
                </div>
                <span>{t('simulation.introduction.stepDecision')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-300 text-white">
                  3
                </div>
                <span>{t('simulation.introduction.stepFeedback')}</span>
              </div>
            </div>
          </div>

          {/* Video */}
          {introVideoUrl && (
            <div className="mb-6">
              <VideoPlayer
                videoUrl={introVideoUrl}
                videoType="introduction"
                onComplete={handleVideoComplete}
                onSkip={handleVideoSkip}
                autoPlay={true}
                allowSkip={true}
              />
            </div>
          )}

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {getTranslatedField(scenarioData, 'title')}
              </h1>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  {getTranslatedField(scenarioData, 'description')}
                </p>
              </div>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                {simulation.category_name && (
                  <>
                    <FolderOpen className="w-4 h-4 mr-1" />
                    <span>{simulation.category_name}</span>
                    <span className="mx-2">•</span>
                  </>
                )}
                <Clock className="w-4 h-4 mr-1" />
                <span>
                  {simulation.max_level
                    ? `${(simulation.max_level + 1) * 2} ${t('common.minutes')}`
                    : `10 ${t('common.minutes')}`}
                </span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          {canContinue && (
            <div className="flex justify-center">
              <button
                onClick={handleContinue}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium flex items-center text-lg"
              >
                {t('common.continue')}
                <PlayCircle className="w-6 h-6 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
