import type { Metadata } from 'next';
 devin/1751845727-add-env-example

 devin/1751831368-production-fixes
 main
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

import './globals.css';

// Use system fonts as fallback to avoid network issues during build
const geistSans = {
  variable: '--font-geist-sans',
};

const geistMono = {
  variable: '--font-geist-mono',
};
 main

export const metadata: Metadata = {
  title: 'Manuscript Diff Analyzer',
  description:
    'Multi-agent AI-powered academic manuscript analysis tool for tracking and analyzing changes between manuscript versions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
