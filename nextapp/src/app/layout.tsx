import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Soft Skills Training Platform',
  description: 'Interactive soft skills training simulations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
