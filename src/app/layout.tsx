import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context-v2';
import { EncryptionProvider } from '@/lib/encryption-context';
import { Alegreya, Belleza } from 'next/font/google';

// Force dynamic rendering for the entire app to prevent SSG issues with auth
export const dynamic = 'force-dynamic';

const alegreya = Alegreya({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '700'],
  variable: '--font-alegreya',
  display: 'swap',
});

const belleza = Belleza({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-belleza',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CognitiveInsight',
  description: 'Unlock Your Cognitive Edge with CognitiveInsight',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${alegreya.variable} ${belleza.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>
          <EncryptionProvider>
            {children}
            <Toaster />
          </EncryptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
