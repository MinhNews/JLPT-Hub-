import { AuthProvider } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import LayoutClientWrapper from '@/components/LayoutClientWrapper';
import './globals.css';

export const metadata = {
  title: 'JLPT N3 Hub - Lộ Trình Ôn Thi Từ Vựng & Kanji 20 Ngày',
  description: 'Hệ thống quản lý lộ trình tự học JLPT N3 thông minh, tích hợp 880 từ vựng Mimikara Oboeru và 168 Kanji N3 trọng tâm.',
  keywords: 'JLPT N3, Mimikara Oboeru N3, Kanji N3, Lộ trình học N3, Học tiếng Nhật offline',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ProgressProvider>
            <LayoutClientWrapper>{children}</LayoutClientWrapper>
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
