'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, MessageSquare } from 'lucide-react';

interface ScenarioOption {
  id: string;
  option_text: string;
  next_scenario_id: string | null;
  feedback_beginner?: string;
  feedback_intermediate?: string;
  feedback_advanced?: string;
  transition_video_url?: string | null;
}

interface ScenarioData {
  id: string;
  title?: string;
  description?: string;
  question_text?: string;
  prompt_video_url?: string | null;
  introduction_video_url?: string | null;
  transition_video_url?: string | null;
  options?: ScenarioOption[];
  difficulty?: string;
  is_end_scenario?: boolean;
}

interface SimulationScenarioLink {
  scenario_id: string;
  is_entry_point?: boolean;
  is_exit_point?: boolean;
  scenarios?: ScenarioData;
}

interface ScenarioFlowEngineProps {
  simulation: {
    id: string;
    display_name?: string;
    difficulty?: string;
    scenarios: Array<SimulationScenarioLink | ScenarioData>;
  };
  onComplete: () => void;
}

const ScenarioFlowEngine: React.FC<ScenarioFlowEngineProps> = ({ simulation, onComplete }) => {
  const scenarioMap = useMemo(() => {
    const map = new Map<string, ScenarioData>();
    simulation.scenarios.forEach((item: any) => {
      const scenario = item.scenarios || item;
      if (scenario?.id) {
        map.set(item.scenario_id || scenario.id, scenario);
      }
    });
    return map;
  }, [simulation]);

  const entryScenarioId = useMemo(() => {
    const entry = (simulation.scenarios as any[]).find((s) => s.is_entry_point);
    if (entry?.scenario_id) return entry.scenario_id;
    const first = simulation.scenarios[0] as any;
    return first?.scenario_id || first?.id || '';
  }, [simulation]);

  const [currentScenarioId, setCurrentScenarioId] = useState(entryScenarioId);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentScenario = scenarioMap.get(currentScenarioId);
  const options = currentScenario?.options || [];
  const selectedOption = options.find((opt) => opt.id === selectedOptionId) || null;

  const feedbackText = selectedOption
    ? selectedOption.feedback_beginner || selectedOption.feedback_intermediate || selectedOption.feedback_advanced || 'Feedback not available.'
    : '';

  const handleContinue = () => {
    if (!selectedOption) return;
    if (!selectedOption.next_scenario_id || !scenarioMap.has(selectedOption.next_scenario_id)) {
      onComplete();
      return;
    }
    setCurrentScenarioId(selectedOption.next_scenario_id);
    setSelectedOptionId(null);
    setShowFeedback(false);
  };

  if (!currentScenario) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No scenarios available for preview.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{currentScenario.title || 'Scenario'}</h2>
          <p className="text-sm text-gray-600">{currentScenario.description}</p>
        </div>
        <div className="text-xs text-gray-500">{simulation.display_name}</div>
      </div>

      {!showFeedback ? (
        <div className="space-y-4">
          <p className="text-gray-700">{currentScenario.question_text || 'How would you respond?'}</p>
          <div className="space-y-2">
            {options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => setSelectedOptionId(option.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border ${
                  selectedOptionId === option.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm text-gray-800">{option.option_text}</span>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => selectedOptionId && setShowFeedback(true)}
            disabled={!selectedOptionId}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Feedback</h3>
            <p className="text-sm text-blue-800">{feedbackText}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFeedback(false)}
              className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <button
              onClick={handleContinue}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next Scenario
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioFlowEngine;
