import type { Metadata } from 'next';
import { Inter, Roboto } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { AppHeader } from '@/components/AppHeader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pillar - Communication Management',
  description: 'Communication and document management for accounting professionals',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body className={`${inter.variable} ${roboto.variable} font-inter antialiased`}>
          <div className='min-h-screen bg-gray-50'>
            <AppHeader />
            <main>{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
