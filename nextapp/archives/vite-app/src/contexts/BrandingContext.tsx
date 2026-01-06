import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBrandingSettings, DEFAULT_BRANDING, type BrandingSettings } from '../lib/branding';

interface BrandingContextValue {
  branding: BrandingSettings;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  const loadBranding = async () => {
    try {
      const settings = await getBrandingSettings();
      if (settings) {
        setBranding(settings);
        applyBrandingToDOM(settings);
      } else {
        applyBrandingToDOM(DEFAULT_BRANDING);
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      applyBrandingToDOM(DEFAULT_BRANDING);
    } finally {
      setIsLoading(false);
    }
  };

  const applyBrandingToDOM = (settings: BrandingSettings) => {
    const root = document.documentElement;

    const primaryRgb = hexToRgb(settings.primary_color);
    const secondaryRgb = hexToRgb(settings.secondary_color);

    root.style.setProperty('--color-brand-primary', settings.primary_color);
    root.style.setProperty('--color-brand-secondary', settings.secondary_color);
    root.style.setProperty('--color-brand-primary-rgb', primaryRgb);
    root.style.setProperty('--color-brand-secondary-rgb', secondaryRgb);
  };

  const refreshBranding = async () => {
    setIsLoading(true);
    await loadBranding();
  };

  useEffect(() => {
    loadBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextValue => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '37, 99, 235';

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
}
