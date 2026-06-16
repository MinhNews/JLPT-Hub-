'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--text-secondary)'
      }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)' }} />
        <p>Đang kiểm tra quyền quản trị...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <ShieldAlert size={40} style={{ color: 'var(--danger)' }} />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Không Có Quyền Truy Cập</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', marginBottom: '28px', fontSize: '15px' }}>
          Trang này chỉ dành riêng cho Quản trị viên hệ thống. Vui lòng quay lại Trang chủ hoặc đăng nhập bằng tài khoản Admin để tiếp tục.
        </p>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          textDecoration: 'none',
          fontWeight: 600,
          transition: 'var(--transition)'
        }} className="back-btn-hover">
          <ArrowLeft size={16} />
          <span>Quay lại Trang chủ</span>
        </Link>
        <style jsx>{`
          .back-btn-hover:hover {
            border-color: var(--primary);
            background: var(--card-bg-hover);
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
