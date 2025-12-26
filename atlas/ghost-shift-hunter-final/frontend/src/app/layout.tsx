import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AnalyticsTracker } from '@/components/analytics-tracker';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Ghost Shift Hunter',
  description: 'AI-Powered Operations Audit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
