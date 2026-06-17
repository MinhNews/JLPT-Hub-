import { AuthProvider } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import LayoutClientWrapper from '@/components/LayoutClientWrapper';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';

export const metadata = {
  title: 'JLPT Hub - Nền Tảng Luyện Thi Tiếng Nhật Toàn Diện',
  description: 'Hệ thống quản lý lộ trình tự học JLPT thông minh, tích hợp từ vựng và Kanji trọng tâm.',
  keywords: 'JLPT, Lộ trình học, Học tiếng Nhật offline',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <GoogleOAuthProvider clientId="1061656991815-05nll45ijshstr1l3t4nj1phm6o04vih.apps.googleusercontent.com">
          <AuthProvider>
            <ProgressProvider>
              <LayoutClientWrapper>{children}</LayoutClientWrapper>
            </ProgressProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
