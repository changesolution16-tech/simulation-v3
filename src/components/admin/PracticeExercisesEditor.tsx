'use client';

import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';

interface PracticeExercisesEditorProps {
  exercises: string[];
  onChange: (exercises: string[]) => void;
  label?: string;
  placeholder?: string;
}

export default function PracticeExercisesEditor({
  exercises,
  onChange,
  label = 'Practice Exercises',
  placeholder = 'Enter a practice exercise...'
}: PracticeExercisesEditorProps) {
  const [newExercise, setNewExercise] = useState('');

  const addExercise = () => {
    if (newExercise.trim()) {
      onChange([...exercises, newExercise.trim()]);
      setNewExercise('');
    }
  };

  const removeExercise = (index: number) => {
    onChange(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, value: string) => {
    const updated = [...exercises];
    updated[index] = value;
    onChange(updated);
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === exercises.length - 1)
    ) {
      return;
    }

    const updated = [...exercises];
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
          Add actionable exercises learners can practice to reinforce their skills.
        </p>
      </div>

      {/* Existing exercises */}
      <div className="space-y-2">
        {exercises.map((exercise, index) => (
          <div key={index} className="flex items-start gap-2 group">
            <div className="flex flex-col gap-1 mt-2">
              <button
                type="button"
                onClick={() => moveExercise(index, 'up')}
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
                onClick={() => moveExercise(index, 'down')}
                disabled={index === exercises.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="flex-1">
              <textarea
                value={exercise}
                onChange={(e) => updateExercise(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                placeholder={placeholder}
              />
            </div>

            <button
              type="button"
              onClick={() => removeExercise(index)}
              className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove exercise"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new exercise */}
      <div className="flex gap-2">
        <textarea
          value={newExercise}
          onChange={(e) => setNewExercise(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              addExercise();
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={2}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={addExercise}
          disabled={!newExercise.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Press Cmd/Ctrl + Enter to quickly add an exercise
      </p>

      {exercises.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No practice exercises yet.</p>
          <p className="text-xs mt-1">Add exercises to help learners reinforce their skills.</p>
        </div>
      )}
    </div>
  );
}
