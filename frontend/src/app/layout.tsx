import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { ForceChangePassword } from '@/components/ForceChangePassword';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bolão Futebol',
  description: 'Plataforma de gerenciamento de bolões de futebol - Palpites, Rankings e Resultados em tempo real',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-fifa-black min-h-screen overflow-x-hidden">
        <AuthProvider>
          <Navbar />
          <ForceChangePassword />
          <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
