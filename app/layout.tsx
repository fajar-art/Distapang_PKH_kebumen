import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import AiChatWidget from '@/components/ai-chat-widget';
import CustomToastProvider from '@/components/common/CustomToast';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'SiMantap — Sistem Informasi Manajemen Peternakan Terpadu',
  description:
    'Portal resmi Bidang Peternakan dan Kesehatan Hewan, Dinas Pertanian dan Pangan Kabupaten Kebumen. Merangkum data Perbibitan & Produksi, Kesehatan Hewan, dan Kesehatan Masyarakat Veteriner.',
  icons: {
    icon: [
      { url: '/logo-circle.svg', type: 'image/svg+xml' },
      { url: '/logo-simantap.png', type: 'image/png' },
    ],
    shortcut: '/logo-circle.svg',
    apple: '/logo-circle.svg',
  },
  manifest: '/manifest.json',
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${poppins.variable} ${poppins.className}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('simantap_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className={`${poppins.className} font-sans antialiased text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 selection:bg-blue-600 selection:text-white`} suppressHydrationWarning>
        {children}
        <AiChatWidget />
        <CustomToastProvider />
      </body>
    </html>
  );
}