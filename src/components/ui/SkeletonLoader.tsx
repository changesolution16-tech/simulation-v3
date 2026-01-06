'use client';

import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'text',
  width = '100%',
  height,
  animate = true
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  const animateClasses = animate ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const computedHeight = height || (variant === 'text' ? '1rem' : variant === 'circular' ? width : '8rem');

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animateClasses} ${className}`}
      style={{ width, height: computedHeight }}
    />
  );
};

export const SimulationCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6">
          <SkeletonLoader variant="rectangular" width="200px" height="40px" />
        </div>
        <div className="mb-6 w-full">
          <SkeletonLoader variant="text" className="mb-2" />
          <SkeletonLoader variant="text" className="mb-2" width="80%" />
          <SkeletonLoader variant="text" width="60%" />
        </div>
        <div className="flex gap-4">
          <SkeletonLoader variant="rectangular" width="120px" height="32px" />
          <SkeletonLoader variant="rectangular" width="120px" height="32px" />
        </div>
      </div>
    </div>
  );
};

export const ScenarioListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <SkeletonLoader variant="circular" width="24px" height="24px" />
              <SkeletonLoader variant="text" width="200px" />
            </div>
            <SkeletonLoader variant="text" width="80px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
