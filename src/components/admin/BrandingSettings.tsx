'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Upload, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BrandingData {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  company_name: string;
  login_title?: string;
  login_subtitle?: string;
}

const BrandingSettings: React.FC = () => {
  const [branding, setBranding] = useState<BrandingData>({
    primary_color: '#2563eb',
    secondary_color: '#1e40af',
    company_name: 'Soft Skills Training'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const response = await fetch('/api/branding');
      if (response.ok) {
        const data = await response.json();
        setBranding(data);
      }
    } catch (error) {
      console.error('Error loading branding:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Branding settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-3 rounded-lg">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Branding Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customize your application&apos;s appearance</p>
          </div>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
            {message.text}
          </p>
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={branding.company_name}
                onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Login Page Title
              </label>
              <input
                type="text"
                value={branding.login_title || ''}
                onChange={(e) => setBranding({ ...branding, login_title: e.target.value })}
                placeholder="Welcome to Training"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Login Page Subtitle
              </label>
              <input
                type="text"
                value={branding.login_subtitle || ''}
                onChange={(e) => setBranding({ ...branding, login_subtitle: e.target.value })}
                placeholder="Interactive Learning Platform"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Brand Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  placeholder="#2563eb"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Used for buttons and main elements</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Secondary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  placeholder="#1e40af"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Used for hover states</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 transition-colors"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BrandingSettings;
