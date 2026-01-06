import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Zap, Shield, Target, Eye, Heart, Users, AlertCircle } from 'lucide-react';
import { BravinMetricsService } from '../../lib/bravinMetrics';
import { BravinScenarioOptionMapping, PressureLevel, ComplexityLevel } from '../../types';

interface BravinConfigEditorProps {
  scenarioId: string;
  optionId: string;
  optionText: string;
  onClose: () => void;
  onSave: () => void;
}

const BravinConfigEditor: React.FC<BravinConfigEditorProps> = ({
  scenarioId,
  optionId,
  optionText,
  onClose,
  onSave
}) => {
  const [mapping, setMapping] = useState<Partial<BravinScenarioOptionMapping>>({
    scenario_id: scenarioId,
    option_id: optionId,
    boldness_impact: 0,
    responsibility_impact: 0,
    accountability_impact: 0,
    vision_impact: 0,
    integrity_impact: 0,
    nurturance_impact: 0,
    pressure_level: 'medium',
    complexity_level: 'moderate',
    trust_impact_config: {},
    ethical_quality_config: {},
    ei_indicators_config: {},
    cultural_stewardship_config: {}
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMapping();
  }, [scenarioId, optionId]);

  const loadMapping = async () => {
    setLoading(true);
    const data = await BravinMetricsService.getScenarioOptionMapping(scenarioId, optionId);
    if (data) {
      setMapping(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await BravinMetricsService.upsertScenarioOptionMapping(mapping);
    setSaving(false);
    onSave();
  };

  const updateImpact = (dimension: string, value: number) => {
    setMapping(prev => ({ ...prev, [`${dimension}_impact`]: value }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configure BRAVIN Impact</h2>
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{optionText}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  Configure how this decision impacts each BRAVIN dimension. Use values from -100 (very
                  negative) to +100 (very positive). A value of 0 indicates no impact on that dimension.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">BRAVIN Dimension Impacts</h3>
            <div className="space-y-4">
              <ImpactSlider
                label="Boldness"
                icon={Zap}
                color="red"
                value={mapping.boldness_impact || 0}
                onChange={(val) => updateImpact('boldness', val)}
                description="Courage to take risks and challenge the status quo"
              />

              <ImpactSlider
                label="Responsibility"
                icon={Shield}
                color="amber"
                value={mapping.responsibility_impact || 0}
                onChange={(val) => updateImpact('responsibility', val)}
                description="Taking ownership of actions and outcomes"
              />

              <ImpactSlider
                label="Accountability"
                icon={Target}
                color="blue"
                value={mapping.accountability_impact || 0}
                onChange={(val) => updateImpact('accountability', val)}
                description="Holding self and others to high standards"
              />

              <ImpactSlider
                label="Vision"
                icon={Eye}
                color="purple"
                value={mapping.vision_impact || 0}
                onChange={(val) => updateImpact('vision', val)}
                description="Thinking strategically about the future"
              />

              <ImpactSlider
                label="Integrity"
                icon={Heart}
                color="emerald"
                value={mapping.integrity_impact || 0}
                onChange={(val) => updateImpact('integrity', val)}
                description="Demonstrating honesty and ethical behavior"
              />

              <ImpactSlider
                label="Nurturance"
                icon={Users}
                color="pink"
                value={mapping.nurturance_impact || 0}
                onChange={(val) => updateImpact('nurturance', val)}
                description="Creating supportive environments for growth"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Decision Context</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pressure Level
                </label>
                <select
                  value={mapping.pressure_level || 'medium'}
                  onChange={(e) => setMapping(prev => ({ ...prev, pressure_level: e.target.value as PressureLevel }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complexity Level
                </label>
                <select
                  value={mapping.complexity_level || 'moderate'}
                  onChange={(e) => setMapping(prev => ({ ...prev, complexity_level: e.target.value as ComplexityLevel }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="simple">Simple</option>
                  <option value="moderate">Moderate</option>
                  <option value="complex">Complex</option>
                  <option value="very_complex">Very Complex</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Notes
            </label>
            <textarea
              value={mapping.configuration_notes || ''}
              onChange={(e) => setMapping(prev => ({ ...prev, configuration_notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about this configuration..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface ImpactSliderProps {
  label: string;
  icon: React.ElementType;
  color: 'red' | 'amber' | 'blue' | 'purple' | 'emerald' | 'pink';
  value: number;
  onChange: (value: number) => void;
  description: string;
}

const ImpactSlider: React.FC<ImpactSliderProps> = ({
  label,
  icon: Icon,
  color,
  value,
  onChange,
  description
}) => {
  const colorClasses = {
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', slider: 'accent-red-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', slider: 'accent-amber-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', slider: 'accent-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', slider: 'accent-purple-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', slider: 'accent-emerald-600' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', slider: 'accent-pink-600' }
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} border ${classes.border} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Icon className={`w-5 h-5 ${classes.text} mr-2`} />
          <div>
            <h4 className={`font-medium ${classes.text}`}>{label}</h4>
            <p className={`text-xs ${classes.text} opacity-75 mt-0.5`}>{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min="-100"
            max="100"
            className={`w-20 px-2 py-1 text-center border ${classes.border} rounded ${classes.text} font-medium`}
          />
        </div>
      </div>
      <input
        type="range"
        min="-100"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${classes.slider}`}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Very Negative</span>
        <span>Neutral</span>
        <span>Very Positive</span>
      </div>
    </div>
  );
};

export default BravinConfigEditor;
