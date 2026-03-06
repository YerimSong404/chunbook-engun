import type { Metadata } from 'next';
import { MemberProvider } from '@/context/MemberContext';
import './globals.css';

export const metadata: Metadata = {
  title: '천북인권 | 독서모임',
  description: '천북인권 독서모임 앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MemberProvider>{children}</MemberProvider>
      </body>
    </html>
  );
}
