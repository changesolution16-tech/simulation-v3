import React, { useState, useEffect } from 'react';
import { Palette, Upload, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  updateBrandingSettings,
  uploadLogo,
  type BrandingSettings,
} from '../../lib/branding';
import { useBranding } from '../../contexts/BrandingContext';

const BrandingSettingsComponent: React.FC = () => {
  const { branding: currentBranding, isLoading: brandingLoading, refreshBranding } = useBranding();
  const [branding, setBranding] = useState<BrandingSettings>(currentBranding);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setBranding(currentBranding);
  }, [currentBranding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const { url, error } = await uploadLogo(file);

    if (error || !url) {
      setMessage({ type: 'error', text: error || 'Failed to upload logo' });
      setIsUploading(false);
      return;
    }

    setBranding({ ...branding, logo_url: url });
    setMessage({ type: 'success', text: 'Logo uploaded successfully' });
    setIsUploading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const { success, error } = await updateBrandingSettings({
      logo_url: branding.logo_url,
      primary_color: branding.primary_color,
      secondary_color: branding.secondary_color,
      company_name: branding.company_name,
      login_title: branding.login_title,
      login_subtitle: branding.login_subtitle,
    });

    if (success) {
      setMessage({ type: 'success', text: 'Branding settings saved successfully' });
      await refreshBranding();
    } else {
      setMessage({ type: 'error', text: error || 'Failed to save settings' });
    }

    setIsSaving(false);
  };

  if (brandingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-primary text-white p-3 rounded-lg">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Branding Settings</h2>
            <p className="text-sm text-gray-600">Customize your application's appearance</p>
          </div>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200">
        {/* Logo Upload */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Company Logo</h3>
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt="Company Logo"
                  className="h-24 w-auto object-contain border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                />
              ) : (
                <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="block">
                <span className="sr-only">Choose logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="text-xs text-gray-500">PNG, JPG or SVG. Max 2MB. Recommended: 200x80px</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Brand Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  placeholder="#2563eb"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">Used for buttons and main elements</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Secondary Color (Hover)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  placeholder="#1e40af"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">Used for hover states</p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
            <button
              type="button"
              className="px-6 py-2 rounded-md text-white font-medium transition-colors"
              style={{ backgroundColor: branding.primary_color }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = branding.secondary_color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = branding.primary_color;
              }}
            >
              Hover Me
            </button>
          </div>
        </div>

        {/* Text Content */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Login Page Content</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Login Page Title
              </label>
              <input
                type="text"
                value={branding.login_title}
                onChange={(e) => setBranding({ ...branding, login_title: e.target.value })}
                placeholder="Soft Skills Simulation"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Login Page Subtitle
              </label>
              <input
                type="text"
                value={branding.login_subtitle}
                onChange={(e) => setBranding({ ...branding, login_subtitle: e.target.value })}
                placeholder="Sign in to access your personalized soft skills training"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Footer Information</h3>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Company Name & Copyright
            </label>
            <input
              type="text"
              value={branding.company_name}
              onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
              placeholder="2025 Softskills Simulations - Change Solutions Limited"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500">
              This will appear in the footer across all pages
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className="flex items-center space-x-2 px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
};

export default BrandingSettingsComponent;
