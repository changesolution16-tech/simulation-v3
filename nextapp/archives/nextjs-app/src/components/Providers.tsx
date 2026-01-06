'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <BrandingProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </BrandingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
