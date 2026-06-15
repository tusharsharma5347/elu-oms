// src/app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'ELU OMS — Order Management System',
    template: '%s | ELU OMS',
  },
  description:
    'AI-powered order management system for eyewear fulfillment. Track lens orders, SLA compliance, and inventory in real-time.',
  keywords: ['eyewear', 'order management', 'SLA', 'lens inventory', 'AI predictions'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto pt-20 px-6 pb-12">
            {children}
          </main>
        </div>
        <Toaster
          theme="light"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'oklch(1 0 0)',
              border: '1px solid oklch(0.9 0.008 240)',
              color: 'oklch(0.22 0.01 240)',
              borderRadius: '0px',
            },
          }}
        />
      </body>
    </html>
  );
}
