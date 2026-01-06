'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, AlertCircle, Trash2, Link2, ExternalLink, Zap } from 'lucide-react';
import VideoInputSelector from '../video/VideoInputSelector';
import OptionMetricScoreInput, { OptionMetricScoreData } from './OptionMetricScoreInput';
import CompetencyImpactEditor from './CompetencyImpactEditor';
import AutomaticCompetencyImpactDisplay from './AutomaticCompetencyImpactDisplay';
import { MetricCompetencyMappingService } from '@/lib/metricCompetencyMapping';
import type { VideoInput } from '@/types';

interface CompetencyImpact {
  impact: number;
  description?: string;
}

export interface OptionAccordionData {
  id?: string;
  text: string;
  feedback_beginner: string;
  feedback_intermediate: string;
  feedback_advanced: string;
  feedback_video_beginner: VideoInput | null;
  feedback_video_intermediate: VideoInput | null;
  feedback_video_advanced: VideoInput | null;
  transition_video: VideoInput | null;
  skillImpact: { [key: string]: number };
  competency_impacts?: { [competencyId: string]: CompetencyImpact };
  metricScores: OptionMetricScoreData[];
}

interface OptionAccordionProps {
  option: OptionAccordionData;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (field: string, value: any) => void;
  onRemove?: () => void;
  canRemove: boolean;
  selectedMetricIds: string[];
  topicId: string;
  scenarioTitle: string;
  scenarioDifficulty: string;
  isEditMode?: boolean;
  simulationId?: string;
  scenarioId?: string;
  connectionInfo?: {
    hasConnection: boolean;
    targetTitle?: string;
    targetScenarioId?: string;
  };
}

const OptionAccordion: React.FC<OptionAccordionProps> = ({
  option,
  index,
  isOpen,
  onToggle,
  onChange,
  onRemove,
  canRemove,
  selectedMetricIds,
  topicId,
  scenarioTitle,
  scenarioDifficulty,
  isEditMode = false,
  simulationId,
  scenarioId,
  connectionInfo
}) => {
  const optionLetter = String.fromCharCode(65 + index);
  const [showBravinEditor, setShowBravinEditor] = useState(false);

  const isValid = option.text.trim() !== '' && option.feedback_beginner.trim() !== '';

  const getPreviewText = () => {
    if (option.text.trim()) {
      return option.text.length > 50 ? `${option.text.substring(0, 50)}...` : option.text;
    }
    return 'No option text entered';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
          isOpen ? 'bg-gray-50' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex-shrink-0">
            {optionLetter}
          </span>
          <div className="text-left flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">Option {optionLetter}</span>
              {isValid ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              )}
              {connectionInfo && connectionInfo.hasConnection && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  <Link2 className="w-3 h-3" />
                  Connected
                </span>
              )}
            </div>
            {!isOpen && (
              <div className="space-y-0.5">
                <p className="text-sm text-gray-500">{getPreviewText()}</p>
                {connectionInfo && connectionInfo.hasConnection && connectionInfo.targetTitle && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <ExternalLink className="w-3 h-3" />
                    <span>Leads to: {connectionInfo.targetTitle}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Remove Option"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 py-5 bg-white border-t border-gray-200 dark:border-gray-700 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Option Text *
            </label>
            <input
              type="text"
              value={option.text}
              onChange={(e) => onChange('text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Address the issue directly with the team member"
            />
          </div>

          {selectedMetricIds.length > 0 && (
            <div className="border-t pt-4">
              <OptionMetricScoreInput
                key={`metrics-${option.id || index}`}
                metricIds={selectedMetricIds}
                scores={option.metricScores || []}
                onChange={(scores) => onChange('metricScores', scores)}
                optionLetter={optionLetter}
              />
            </div>
          )}

          {isEditMode && simulationId && scenarioId && option.id && (
            <div className="border-t pt-4">
              <AutomaticCompetencyImpactDisplay
                simulationId={simulationId}
                scenarioId={scenarioId}
                optionId={option.id}
                onOverride={async (competencyId, manualImpact, reason) => {
                  await MetricCompetencyMappingService.createMapping({
                    simulation_id: simulationId,
                    competency_id: competencyId,
                    metric_id: '',
                    calculation_method: 'direct',
                    mapping_weight: manualImpact,
                    is_active: true
                  });
                }}
              />
            </div>
          )}

          {isEditMode && option.competency_impacts && (
            <div className="border-t pt-4">
              <CompetencyImpactEditor
                impacts={option.competency_impacts}
                onChange={(impacts) => onChange('competency_impacts', impacts)}
                label="Manual Competency Impacts"
              />
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Text Feedback</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Beginner Feedback *
                </label>
                <textarea
                  value={option.feedback_beginner}
                  onChange={(e) => onChange('feedback_beginner', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Feedback for beginner level learners"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Intermediate Feedback
                </label>
                <textarea
                  value={option.feedback_intermediate}
                  onChange={(e) => onChange('feedback_intermediate', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Feedback for intermediate level learners"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Advanced Feedback
                </label>
                <textarea
                  value={option.feedback_advanced}
                  onChange={(e) => onChange('feedback_advanced', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Feedback for advanced level learners"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Video Feedback</h4>
            <div className="space-y-4">
              <VideoInputSelector
                label="Beginner Feedback Video"
                value={option.feedback_video_beginner || undefined}
                onChange={(input) => onChange('feedback_video_beginner', input)}
                videoType="feedback"
                category="feedback"
                referenceId={scenarioId}
              />

              <VideoInputSelector
                label="Intermediate Feedback Video"
                value={option.feedback_video_intermediate || undefined}
                onChange={(input) => onChange('feedback_video_intermediate', input)}
                videoType="feedback"
                category="feedback"
                referenceId={scenarioId}
              />

              <VideoInputSelector
                label="Advanced Feedback Video"
                value={option.feedback_video_advanced || undefined}
                onChange={(input) => onChange('feedback_video_advanced', input)}
                videoType="feedback"
                category="feedback"
                referenceId={scenarioId}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <VideoInputSelector
              label="Transition Video"
              value={option.transition_video || undefined}
              onChange={(input) => onChange('transition_video', input)}
              videoType="transition"
              category="transitions"
              referenceId={scenarioId}
              helpText="Video shown after selecting this option before moving to the next scenario"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionAccordion;
