'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Key, Mail, User, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthPage() {
  const { user, login, register, googleLoginAuth, loading } = useAuth();
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg('Email không đúng định dạng.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (!isLogin) {
      if (!name) {
        setErrorMsg('Vui lòng điền họ và tên.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu nhập lại không khớp.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      router.push('/');
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-loading-container">
        <Loader2 className="spinner animate-spin" size={36} />
        <p>Đang kiểm tra trạng thái...</p>
      </div>
    );
  }

  return (
    <div className="auth-wrapper fade-in">
      <div className="auth-card">
        <Link href="/" className="back-home-btn">
          <ArrowLeft size={16} />
          <span>Quay lại</span>
        </Link>
        <div className="auth-header">
          <div className="brand-logo">👑</div>
          <h1>JLPT Hub N3</h1>
          <p className="subtitle">
            {isLogin ? 'Đăng nhập để đồng bộ tiến trình học tập' : 'Tạo tài khoản học viên mới miễn phí'}
          </p>
        </div>

        {errorMsg && (
          <div className="auth-error-card">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name-input">Họ và tên</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="name-input"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email-input">Địa chỉ Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email-input"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password-input">Mật khẩu</label>
            <div className="input-wrapper">
              <Key size={18} className="input-icon" />
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirm-password-input">Nhập lại mật khẩu</label>
              <div className="input-wrapper">
                <Key size={18} className="input-icon" />
                <input
                  id="confirm-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <button type="submit" className="submit-auth-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                <span>{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>HOẶC</span>
        </div>

        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                setIsSubmitting(true);
                setErrorMsg('');
                await googleLoginAuth(credentialResponse.credential);
                router.push('/');
              } catch (err) {
                setErrorMsg(err.message || 'Đăng nhập Google thất bại');
                setIsSubmitting(false);
              }
            }}
            onError={() => {
              setErrorMsg('Đăng nhập Google thất bại');
            }}
            useOneTap
            theme="outline"
            text="signin_with"
            shape="pill"
            width="100%"
          />
        </div>

        <div className="auth-footer">
          <p>
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              type="button"
              className="toggle-auth-mode-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              disabled={isSubmitting}
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: var(--text-secondary);
          gap: 12px;
        }
        .spinner {
          color: var(--primary);
        }
        .auth-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
          background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.08) 0%, transparent 40%), var(--bg-color);
          position: relative;
        }
        .back-home-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
          background: var(--bg-color);
          transition: var(--transition);
          margin-bottom: 20px;
        }
        .back-home-btn:hover {
          color: var(--primary);
          background: rgba(99, 102, 241, 0.1);
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 40px 32px;
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(8px);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .brand-logo {
          font-size: 40px;
          margin-bottom: 12px;
        }
        .auth-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .subtitle {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .auth-error-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--danger);
          padding: 12px;
          border-radius: var(--radius-md);
          font-size: 13px;
          margin-bottom: 20px;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }
        .input-wrapper input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 14px;
          transition: var(--transition);
        }
        .input-wrapper input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .submit-auth-btn {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          background: var(--primary-gradient);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }
        .submit-auth-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .submit-auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .auth-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .toggle-auth-mode-btn {
          background: none;
          border: none;
          color: var(--primary-light);
          font-weight: 700;
          margin-left: 6px;
          cursor: pointer;
          transition: var(--transition);
        }
        .toggle-auth-mode-btn:hover {
          text-decoration: underline;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 24px 0;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }
        .auth-divider span {
          padding: 0 16px;
        }
        .google-login-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          width: 100%;
        }
        .google-login-wrapper > div {
          width: 100%;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
