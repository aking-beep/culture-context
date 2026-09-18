import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Culture Context',
  description: 'Sourced destination briefs with provenance. Not a chatbot, not legal advice.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Culture Context', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#D94C2B',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
