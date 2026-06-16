'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Crown, 
  ShieldAlert, 
  Search, 
  Lock, 
  Unlock, 
  UserCheck, 
  UserX, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores user ID currently being modified

  const API_BASE_URL = 'http://localhost:5000/api/admin';

  // Fetch Stats
  const fetchStats = async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users?page=${page}&search=${search}&limit=8`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.pages);
        setTotalUsers(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, page, search]);

  // Handle VIP Toggle
  const handleToggleVip = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn cấp / hủy VIP cho người dùng này không?")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/vip`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchUsers();
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to toggle VIP status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Ban / Unban
  const handleToggleStatus = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn thay đổi trạng thái Khóa / Mở Khóa tài khoản này không?")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchUsers();
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Role Toggle (Student <=> Admin)
  const handleToggleRole = async (userId, currentRole) => {
    const actionName = currentRole === 'admin' ? 'hạ cấp xuống Học viên' : 'nâng cấp lên Admin';
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn ${actionName} cho người dùng này không?`)) return;
    
    setActionLoading(userId);
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        await fetchUsers();
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to toggle user role:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Hệ thống Quản trị JLPT Hub</h1>
          <p className="page-description">Theo dõi số liệu, phân quyền tài khoản, cấp VIP và quản lý học viên.</p>
        </div>
        <div className="admin-badge-top">
          <ShieldCheck size={16} />
          <span>Chế độ: Super Admin</span>
        </div>
      </div>

      {/* Stats Cards */}
      {loadingStats ? (
        <div className="stats-loading-placeholder">
          <Loader2 className="animate-spin" size={28} />
          <p>Đang tải số liệu thống kê...</p>
        </div>
      ) : (
        stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon-wrapper blue">
                <Users size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Tổng học viên</span>
                <span className="stat-value">{stats.totalUsers}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper gold">
                <Crown size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Học viên VIP</span>
                <span className="stat-value">{stats.totalVipUsers}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper red">
                <ShieldXIcon size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Tài khoản bị khóa</span>
                <span className="stat-value">{stats.bannedUsers}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper green">
                <TrendingUp size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Doanh thu hệ thống</span>
                <span className="stat-value">{(stats.totalRevenue || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        )
      )}

      {/* User Management Section */}
      <div className="users-management-card">
        <div className="users-card-header">
          <h2>Danh sách người dùng ({totalUsers})</h2>
          <div className="search-bar-wrapper">
            <Search size={16} className="search-bar-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, email..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // reset to first page on search
              }}
            />
          </div>
        </div>

        {loadingUsers ? (
          <div className="table-loading-placeholder">
            <Loader2 className="animate-spin" size={32} />
            <p>Đang nạp danh sách học viên...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên & Email</th>
                    <th>Vai trò</th>
                    <th>Quyền hạn VIP</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-table-cell">
                        Không tìm thấy người dùng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isCurrentUser = actionLoading === u._id;
                      return (
                        <tr key={u._id}>
                          <td>
                            <div className="user-info-cell">
                              <div className="user-avatar-small" style={{ overflow: 'hidden' }}>
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                ) : (
                                  u.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="user-details">
                                <span className="user-name">{u.name}</span>
                                <span className="user-email">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${u.role}`}>
                              {u.role === 'admin' ? 'Admin 👑' : 'Học viên'}
                            </span>
                          </td>
                          <td>
                            <span className={`vip-badge ${u.isVip ? 'active' : 'inactive'}`}>
                              {u.isVip ? 'VIP Active ⚡' : 'Thường'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${u.status}`}>
                              {u.status === 'banned' ? 'Bị khóa 🔒' : 'Hoạt động ✅'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons-group">
                              {/* Toggle VIP */}
                              {u.role !== 'admin' && (
                                <button
                                  className={`admin-action-btn vip ${u.isVip ? 'revoke' : 'grant'}`}
                                  onClick={() => handleToggleVip(u._id)}
                                  disabled={isCurrentUser}
                                  title={u.isVip ? 'Hủy VIP' : 'Cấp VIP'}
                                >
                                  <Crown size={14} />
                                  <span>{u.isVip ? 'Hủy VIP' : 'Cấp VIP'}</span>
                                </button>
                              )}

                              {/* Toggle Status (Ban/Unban) */}
                              {u.role !== 'admin' && (
                                <button
                                  className={`admin-action-btn status ${u.status === 'banned' ? 'unban' : 'ban'}`}
                                  onClick={() => handleToggleStatus(u._id)}
                                  disabled={isCurrentUser}
                                  title={u.status === 'banned' ? 'Mở khóa' : 'Khóa'}
                                >
                                  {u.status === 'banned' ? <Unlock size={14} /> : <Lock size={14} />}
                                  <span>{u.status === 'banned' ? 'Mở' : 'Khóa'}</span>
                                </button>
                              )}

                              {/* Toggle Role */}
                              <button
                                className="admin-action-btn role"
                                onClick={() => handleToggleRole(u._id, u.role)}
                                disabled={isCurrentUser || u._id === user?.id || u.email === user?.email}
                                title={
                                  u._id === user?.id || u.email === user?.email
                                    ? 'Bạn không thể tự hạ cấp vai trò của chính mình'
                                    : (u.role === 'admin' ? 'Hạ xuống Student' : 'Nâng lên Admin')
                                }
                              >
                                {u.role === 'admin' ? <UserX size={14} /> : <UserCheck size={14} />}
                                <span>{u.role === 'admin' ? 'Hạ Student' : 'Lên Admin'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} />
                  <span>Trước</span>
                </button>
                <span className="pagination-info">
                  Trang {page} / {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <span>Sau</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .admin-container {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .admin-badge-top {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }
        .stats-loading-placeholder, .table-loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-secondary);
          gap: 12px;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
          color: var(--primary);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .admin-stat-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }
        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon-wrapper.blue { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
        .stat-icon-wrapper.gold { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .stat-icon-wrapper.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .stat-icon-wrapper.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .users-management-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-md);
        }
        .users-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }
        .users-card-header h2 {
          font-size: 18px;
          font-weight: 800;
        }
        .search-bar-wrapper {
          position: relative;
          width: 100%;
          max-width: 320px;
        }
        .search-bar-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .search-bar-wrapper input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13.5px;
          outline: none;
          transition: var(--transition);
        }
        .search-bar-wrapper input:focus {
          border-color: var(--primary);
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }
        .admin-table th {
          padding: 12px 16px;
          border-bottom: 2px solid var(--border-color);
          color: var(--text-secondary);
          font-weight: 700;
        }
        .admin-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .empty-table-cell {
          text-align: center;
          padding: 30px;
          color: var(--text-muted);
        }
        .user-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-avatar-small {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-gradient);
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .user-details {
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-weight: 700;
          color: var(--text-primary);
        }
        .user-email {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .role-badge, .vip-badge, .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }
        .role-badge.admin {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        .role-badge.student {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }
        .vip-badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        .vip-badge.inactive {
          background: var(--border-color);
          color: var(--text-secondary);
        }
        .status-badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        .status-badge.banned {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .action-buttons-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .admin-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 700;
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          color: var(--text-primary);
          transition: var(--transition);
        }
        .admin-action-btn:hover:not(:disabled) {
          border-color: var(--primary);
          background: var(--card-bg-hover);
        }
        .admin-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .admin-action-btn.vip.grant {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.05);
        }
        .admin-action-btn.vip.revoke {
          color: var(--text-secondary);
          background: var(--border-color);
        }
        .admin-action-btn.status.ban {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
        .admin-action-btn.status.unban {
          color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }
        .admin-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          font-size: 13px;
        }
        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: var(--primary);
          background: var(--card-bg-hover);
        }
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination-info {
          font-weight: 700;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

// Simple Helper Component to represent ShieldAlert icon replacement to avoid missing icon crashing
function ShieldXIcon({ size }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m14.5 9.5-5 5" />
      <path d="m9.5 9.5 5 5" />
    </svg>
  );
}
