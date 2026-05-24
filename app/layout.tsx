import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/common/BottomNav';

export const metadata: Metadata = {
  title: 'PokeLog',
  description: 'ポケモンチャンピオンズ 対戦記録アプリ',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'PokeLog' },
};

export const viewport: Viewport = {
  themeColor: '#dc2626',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="flex min-h-full flex-col bg-gray-50 antialiased">
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
