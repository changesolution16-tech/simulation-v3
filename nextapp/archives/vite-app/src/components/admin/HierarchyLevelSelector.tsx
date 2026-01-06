import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Target, RefreshCw } from 'lucide-react';

interface HierarchyLevelSelectorProps {
  value: number | null;
  autoCalculate: boolean;
  calculatedLevel?: number | null;
  onChange: (level: number | null) => void;
  onAutoCalculateChange: (auto: boolean) => void;
  onRecalculate?: () => void;
  disabled?: boolean;
  showAutoToggle?: boolean;
  isRecalculating?: boolean;
}

const HierarchyLevelSelector: React.FC<HierarchyLevelSelectorProps> = ({
  value,
  autoCalculate,
  calculatedLevel,
  onChange,
  onAutoCalculateChange,
  onRecalculate,
  disabled = false,
  showAutoToggle = true,
  isRecalculating = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayValue = autoCalculate ? calculatedLevel : value;
  const isManualMode = !autoCalculate;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLevel = (level: number) => {
    onChange(level);
    setIsOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    const parsed = parseInt(customValue, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 999) {
      onChange(parsed);
      setCustomValue('');
      setShowCustomInput(false);
      setIsOpen(false);
    }
  };

  const handleAutoToggle = (checked: boolean) => {
    onAutoCalculateChange(checked);
    if (checked && calculatedLevel !== null && calculatedLevel !== undefined) {
      onChange(calculatedLevel);
    }
  };

  const quickLevels = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      {showAutoToggle && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700">
          <input
            type="checkbox"
            id="auto-calculate-level"
            checked={autoCalculate}
            onChange={(e) => handleAutoToggle(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="auto-calculate-level" className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${autoCalculate ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`} />
            Auto-calculate level from connections
          </label>
          {autoCalculate && onRecalculate && (
            <button
              onClick={onRecalculate}
              disabled={isRecalculating}
              className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
              title="Recalculate level now"
            >
              {isRecalculating ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                'Recalculate'
              )}
            </button>
          )}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hierarchy Level
          {autoCalculate && (
            <span className="ml-2 text-xs text-green-600 font-normal">(Auto-calculated)</span>
          )}
        </label>

        <button
          type="button"
          onClick={() => !disabled && isManualMode && setIsOpen(!isOpen)}
          disabled={disabled || autoCalculate}
          className={`w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled || autoCalculate ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
          } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className={`flex items-center gap-2 ${displayValue === null ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
              {autoCalculate ? (
                <>
                  <RefreshCw className="w-4 h-4 text-green-600" />
                  <span>Level {displayValue ?? 'Not calculated'}</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>{displayValue !== null ? `Level ${displayValue}` : 'Select level...'}</span>
                </>
              )}
            </span>
            {isManualMode && <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
          </div>
        </button>

        {isOpen && isManualMode && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-auto">
            <div className="p-2 space-y-1">
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quick Select (1-30)
              </div>
              <div className="grid grid-cols-5 gap-1">
                {quickLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSelectLevel(level)}
                    className={`px-2 py-1.5 text-sm rounded hover:bg-blue-50 transition-colors ${
                      value === level ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <div className="border-t pt-2 mt-2">
                {!showCustomInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors text-center"
                  >
                    Enter custom level (31+)
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                      placeholder="Enter level (0-999)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCustomSubmit}
                        className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Set Level
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomValue('');
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>Level represents depth in the scenario flow.</p>
        <p>Root scenarios (no incoming connections) are level 0.</p>
        {autoCalculate && (
          <p className="text-green-600 font-medium">
            Level is automatically calculated based on connections.
          </p>
        )}
      </div>
    </div>
  );
};

export default HierarchyLevelSelector;
