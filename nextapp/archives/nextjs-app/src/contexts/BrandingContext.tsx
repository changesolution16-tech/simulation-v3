'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BrandingSettings {
  id?: string;
  organization_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  login_title?: string;
  login_subtitle?: string;
  app_title?: string;
  footer_text?: string;
  custom_css?: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  organization_name: 'Soft Skills Simulation',
  primary_color: '#3B82F6',
  secondary_color: '#2563EB',
  accent_color: '#60A5FA',
  login_title: 'Welcome',
  login_subtitle: 'Sign in to continue',
  app_title: 'Soft Skills Training',
  footer_text: '',
};

interface BrandingContextValue {
  branding: BrandingSettings;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  const loadBranding = async () => {
    try {
      const response = await fetch('/api/branding');
      if (response.ok) {
        const settings = await response.json();
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
    if (typeof document === 'undefined') return;

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
}

export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '37, 99, 235';

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
}
