'use client';

import { BookOpen, FileText, Video, Headphones, Wrench, ExternalLink, Check, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface LearningResource {
  id: string;
  title: string;
  resource_type: 'book' | 'article' | 'course' | 'video' | 'podcast' | 'tool' | 'framework' | 'assessment';
  url?: string;
  description?: string;
  author?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes?: number;
}

interface LearningRecommendationsDisplayProps {
  practiceExercises?: string[];
  nextSteps?: string[];
  resources?: LearningResource[];
}

const resourceIcons = {
  book: BookOpen,
  article: FileText,
  course: BookOpen,
  video: Video,
  podcast: Headphones,
  tool: Wrench,
  framework: Wrench,
  assessment: FileText,
};

const resourceColors = {
  book: 'bg-purple-50 border-purple-200 text-purple-700',
  article: 'bg-blue-50 border-blue-200 text-blue-700',
  course: 'bg-green-50 border-green-200 text-green-700',
  video: 'bg-red-50 border-red-200 text-red-700',
  podcast: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  tool: 'bg-gray-50 border-gray-200 text-gray-700',
  framework: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  assessment: 'bg-pink-50 border-pink-200 text-pink-700',
};

export default function LearningRecommendationsDisplay({
  practiceExercises = [],
  nextSteps = [],
  resources = []
}: LearningRecommendationsDisplayProps) {
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  const toggleExercise = (index: number) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedExercises(newCompleted);
  };

  const hasRecommendations = practiceExercises.length > 0 || nextSteps.length > 0 || resources.length > 0;

  if (!hasRecommendations) {
    return null;
  }

  const ResourceIcon = ({ type }: { type: string }) => {
    const Icon = resourceIcons[type as keyof typeof resourceIcons] || BookOpen;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Continue Your Learning Journey
        </h3>
        <p className="text-gray-600 mb-6">
          Here are personalized recommendations to help you develop this skill further.
        </p>
      </div>

      {/* Practice Exercises */}
      {practiceExercises.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">
              Practice Exercises
            </h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Try these exercises to reinforce what you've learned:
          </p>
          <div className="space-y-3">
            {practiceExercises.map((exercise, index) => (
              <button
                key={index}
                onClick={() => toggleExercise(index)}
                className="w-full flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    completedExercises.has(index)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {completedExercises.has(index) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span className={`flex-1 text-sm ${
                  completedExercises.has(index)
                    ? 'text-gray-500 line-through'
                    : 'text-gray-700'
                }`}>
                  {exercise}
                </span>
              </button>
            ))}
          </div>
          {completedExercises.size > 0 && (
            <div className="mt-4 text-sm text-blue-700 font-medium">
              {completedExercises.size} of {practiceExercises.length} completed
            </div>
          )}
        </div>
      )}

      {/* Learning Resources */}
      {resources.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-gray-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">
              Recommended Resources
            </h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Explore these curated resources to deepen your understanding:
          </p>
          <div className="space-y-3">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${resourceColors[resource.resource_type]}`}
              >
                <div className="flex-shrink-0 pt-1">
                  <ResourceIcon type={resource.resource_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-gray-900 mb-1">
                    {resource.title}
                  </h5>
                  {resource.author && (
                    <p className="text-sm text-gray-600 mb-1">by {resource.author}</p>
                  )}
                  {resource.description && (
                    <p className="text-sm text-gray-700 mb-2">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-white rounded font-medium">
                      {resource.resource_type}
                    </span>
                    {resource.difficulty_level && (
                      <span className="text-xs px-2 py-1 bg-white rounded font-medium">
                        {resource.difficulty_level}
                      </span>
                    )}
                    {resource.duration_minutes && (
                      <span className="text-xs px-2 py-1 bg-white rounded font-medium">
                        {resource.duration_minutes} min
                      </span>
                    )}
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Resource
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowRight className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">
              Next Steps
            </h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Continue your development journey with these recommended next steps:
          </p>
          <div className="space-y-2">
            {nextSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200"
              >
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-semibold">
                    {index + 1}
                  </div>
                </div>
                <span className="flex-1 text-sm text-gray-700">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-600 text-center">
          These recommendations are personalized based on your response. Track your progress and revisit these resources as you continue your learning journey.
        </p>
      </div>
    </div>
  );
}
