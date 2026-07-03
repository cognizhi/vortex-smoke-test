import type { Metadata, Viewport } from 'next';
import '@/globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: {
    default: 'SimplyBook',
    template: '%s | SimplyBook',
  },
  description: 'Modern web application built with Next.js, React, and TypeScript',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-background text-foreground antialiased">
        <AuthProvider>
          <ThemeProvider>
            <main className="flex min-h-screen flex-col">{children}</main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
