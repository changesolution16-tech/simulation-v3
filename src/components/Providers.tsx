'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { DialogProvider } from '@/contexts/DialogContext';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrandingProvider>
            <LanguageProvider>
              <DialogProvider>
                {children}
              </DialogProvider>
            </LanguageProvider>
          </BrandingProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
