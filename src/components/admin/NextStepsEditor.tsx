'use client';

import { useState } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';

interface NextStepsEditorProps {
  steps: string[];
  onChange: (steps: string[]) => void;
  label?: string;
  placeholder?: string;
}

export default function NextStepsEditor({
  steps,
  onChange,
  label = 'Next Steps',
  placeholder = 'Enter a next step...'
}: NextStepsEditorProps) {
  const [newStep, setNewStep] = useState('');

  const addStep = () => {
    if (newStep.trim()) {
      onChange([...steps, newStep.trim()]);
      setNewStep('');
    }
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    onChange(updated);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const updated = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Recommend next steps for continued growth and development.
        </p>
      </div>

      {/* Existing steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-2 group">
            <div className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                onClick={() => moveStep(index, 'up')}
                disabled={index === 0}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => moveStep(index, 'down')}
                disabled={index === steps.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center mt-2 text-blue-500">
              <ArrowRight className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={placeholder}
              />
            </div>

            <button
              type="button"
              onClick={() => removeStep(index)}
              className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove step"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new step */}
      <div className="flex gap-2">
        <div className="flex items-center text-blue-500">
          <ArrowRight className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addStep();
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={addStep}
          disabled={!newStep.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Press Enter to quickly add a next step
      </p>

      {steps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No next steps yet.</p>
          <p className="text-xs mt-1">Add steps to guide learners on their continued development journey.</p>
        </div>
      )}
    </div>
  );
}
