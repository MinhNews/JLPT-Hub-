'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Key, 
  Lock,
  Camera, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Crown
} from 'lucide-react';
import Link from 'next/link';

export default function UserProfile() {
  const { user, isVip, updateUserData } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  // Profile fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & loading states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Initialize fields
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  // Handle personal info & password save
  const handleSaveChanges = async (e) => {
    e.preventDefault();

    // Validation for password change
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        showMessage('error', 'Vui lòng nhập mật khẩu hiện tại để thay đổi mật khẩu');
        return;
      }
      if (newPassword !== confirmPassword) {
        showMessage('error', 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp');
        return;
      }
      if (newPassword.length < 6) {
        showMessage('error', 'Mật khẩu mới phải chứa ít nhất 6 ký tự');
        return;
      }
    }

    setLoadingProfile(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword ? newPassword : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Cập nhật thất bại');
      }

      // Sync updated data to global AuthContext
      updateUserData(data.user);
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      showMessage('success', 'Đã cập nhật thông tin tài khoản thành công!');
    } catch (err) {
      showMessage('error', err.message || 'Lỗi hệ thống khi cập nhật hồ sơ');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle avatar selection and converting to base64
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit to 3MB
    if (file.size > 3 * 1024 * 1024) {
      showMessage('error', 'Dung lượng ảnh đại diện không được vượt quá 3MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      uploadAvatarImage(reader.result);
    };
  };

  // Upload avatar base64 data to backend
  const uploadAvatarImage = async (base64String) => {
    setLoadingAvatar(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/users/profile/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ avatarDataUri: base64String })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tải ảnh lên');
      }

      // Sync to global context
      updateUserData(data.user);
      showMessage('success', 'Đã thay đổi ảnh đại diện thành công!');
    } catch (err) {
      showMessage('error', err.message || 'Lỗi khi tải ảnh đại diện lên Cloudinary');
    } finally {
      setLoadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-loading-screen">
        <Loader2 className="animate-spin" size={32} />
        <p>Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-container fade-in">
      <div className="profile-header">
        <Link href="/" className="back-to-home-link">
          <ArrowLeft size={16} />
          <span>Quay lại Dashboard</span>
        </Link>
        <h1 className="profile-title-text">Hồ sơ cá nhân</h1>
        <p className="profile-desc-text">Cập nhật thông tin tài khoản, đổi mật khẩu và ảnh đại diện của bạn.</p>
      </div>

      {message.text && (
        <div className={`profile-alert-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="profile-layout-grid">
        {/* Left Side: Avatar Card */}
        <div className="profile-left-card">
          <div className="profile-avatar-editor">
            <div className="profile-avatar-preview-wrapper">
              <div className="profile-avatar-main">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="profile-avatar-img" />
                ) : (
                  <span className="profile-avatar-placeholder">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label htmlFor="avatar-file-input" className="profile-avatar-upload-overlay" title="Thay ảnh đại diện">
                {loadingAvatar ? (
                  <Loader2 className="animate-spin" size={24} style={{ color: 'white' }} />
                ) : (
                  <>
                    <Camera size={20} />
                    <span>Tải ảnh</span>
                  </>
                )}
              </label>
              <input 
                type="file" 
                id="avatar-file-input" 
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={loadingAvatar}
                style={{ display: 'none' }} 
              />
            </div>
            
            <h3 className="profile-name-display">{user.name}</h3>
            <span className={`profile-role-badge ${user.role}`}>
              {user.role === 'admin' ? 'Quản trị viên 👑' : (isVip ? 'Học viên VIP 👑' : 'Học viên Thường')}
            </span>
            <p className="profile-email-display">{user.email}</p>

            {isVip && (
              <div className="vip-badge-glow">
                <Crown size={16} style={{ color: '#f59e0b', marginRight: '6px' }} />
                <span>Quyền VIP đang kích hoạt</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Account Forms */}
        <div className="profile-right-card">
          <form onSubmit={handleSaveChanges} className="profile-form">
            {/* Personal Details Section */}
            <div className="form-section">
              <h2 className="section-title">
                <User size={18} />
                <span>Thông tin tài khoản</span>
              </h2>

              <div className="form-group">
                <label className="form-label">Email tài khoản</label>
                <div className="input-wrapper disabled">
                  <Mail size={16} className="input-icon" />
                  <input 
                    type="email" 
                    value={email}
                    disabled 
                    className="form-input"
                  />
                </div>
                <span className="input-helper">Email dùng để đăng nhập và không thể thay đổi.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Họ và Tên</label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nhập họ tên đầy đủ"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="form-section">
              <h2 className="section-title">
                <Key size={18} />
                <span>Đổi mật khẩu</span>
              </h2>

              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu mới</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer Action */}
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={loadingProfile}
                className="btn-save-profile"
              >
                {loadingProfile ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Đang lưu thay đổi...</span>
                  </>
                ) : (
                  <span>Lưu thay đổi hồ sơ</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .profile-page-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .profile-header {
          margin-bottom: 24px;
        }
        .back-to-home-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          margin-bottom: 16px;
          transition: var(--transition);
        }
        .back-to-home-link:hover {
          color: var(--primary);
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
        }
        .profile-title-text {
          font-size: 26px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .profile-desc-text {
          color: var(--text-secondary);
          font-size: 14.5px;
        }
        .profile-alert-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .profile-alert-banner.success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .profile-alert-banner.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .profile-layout-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .profile-layout-grid {
            grid-template-columns: 1fr;
          }
        }
        .profile-left-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 32px 24px;
          box-shadow: var(--shadow-md);
          height: fit-content;
        }
        .profile-avatar-editor {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .profile-avatar-preview-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 3px solid var(--border-color);
          margin-bottom: 16px;
          overflow: hidden;
        }
        .profile-avatar-main {
          width: 100%;
          height: 100%;
          background: var(--primary-gradient);
          color: white;
          font-size: 40px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .profile-avatar-upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.65);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: white;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          opacity: 0;
          transition: var(--transition);
        }
        .profile-avatar-preview-wrapper:hover .profile-avatar-upload-overlay {
          opacity: 1;
        }
        .profile-name-display {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .profile-email-display {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 6px;
        }
        .profile-role-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }
        .profile-role-badge.admin {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .profile-role-badge.student {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
        .vip-badge-glow {
          margin-top: 16px;
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          font-size: 12.5px;
          font-weight: 700;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.1);
        }
        .profile-right-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: var(--shadow-md);
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 800;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }
        .form-input {
          width: 100%;
          padding: 11px 12px 11px 36px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: var(--transition);
        }
        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--primary-glow);
        }
        .input-wrapper.disabled .form-input {
          opacity: 0.6;
          cursor: not-allowed;
          background: rgba(30, 41, 59, 0.2);
        }
        .input-helper {
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 576px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }
        .btn-save-profile {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 24px;
          background: var(--primary-gradient);
          color: white;
          font-weight: 700;
          font-size: 14px;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
        .btn-save-profile:hover:not(:disabled) {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .btn-save-profile:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .profile-loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 80vh;
          gap: 12px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
