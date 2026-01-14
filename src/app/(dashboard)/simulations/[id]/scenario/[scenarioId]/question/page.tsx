'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function QuestionPage({
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
  const [submitting, setSubmitting] = useState(false);
  const questionStartTime = useRef<number>(Date.now());

  const simulationId = params.id;
  const scenarioId = params.scenarioId;
  const instanceId = searchParams?.get('instanceId') || sessionStorage.getItem('currentInstanceId');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    loadData();
    questionStartTime.current = Date.now();
  }, [session, simulationId, scenarioId]);

  const loadData = async () => {
    setLoading(true);

    try {
      // Load simulation with all scenarios
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

  const handleOptionSelect = async (optionId: string) => {
    if (!instanceId) {
      alert('Error: No simulation instance found');
      return;
    }

    setSubmitting(true);

    try {
      const decisionTimeSeconds = Math.floor((Date.now() - questionStartTime.current) / 1000);

      // Save the learner's response
      const response = await fetch(`/api/instances/${instanceId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenarioId,
          selected_option_id: optionId,
          response_time_seconds: decisionTimeSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save response');
      }

      const responseData = await response.json();

      // Navigate to feedback page
      router.push(
        `/simulations/${simulationId}/scenario/${scenarioId}/feedback?instanceId=${instanceId}&optionId=${optionId}`
      );
    } catch (error: any) {
      console.error('Error saving response:', error);
      alert(error.message || 'Failed to save your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-gray-600 dark:text-gray-400">{t('simulation.question.loadingQuestion')}</p>
        </div>
      </div>
    );
  }

  if (!simulation || !scenario) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('simulation.question.questionNotFound')}</p>
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
  const options = scenarioData.options || [];
  const questionText = getTranslatedField(scenarioData, 'question_text') || 'How would you respond?';

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
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-green-600 text-white">
                  ✓
                </div>
                <span>{t('simulation.question.stepIntroduction')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-blue-600 text-white">
                  2
                </div>
                <span>{t('simulation.question.stepDecision')}</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-300 text-white">
                  3
                </div>
                <span>{t('simulation.question.stepFeedback')}</span>
              </div>
            </div>
          </div>

          {/* Scenario Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {getTranslatedField(scenarioData, 'title')}
              </h1>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {getTranslatedField(scenarioData, 'description')}
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {questionText}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('simulation.question.selectOption')}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {options.map((option: any, index: number) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  disabled={submitting}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    submitting
                      ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold text-sm">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {getTranslatedField(option, 'option_text') || option.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {submitting && (
              <div className="mt-4 flex items-center justify-center text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>{t('common.loading')}</span>
              </div>
            )}
          </div>

          {/* Thinking prompt */}
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            <Clock className="w-4 h-4 inline mr-1" />
            <span>{t('simulation.question.thinking')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
