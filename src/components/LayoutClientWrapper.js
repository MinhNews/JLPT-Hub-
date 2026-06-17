'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { Home, BookOpen, Grid, MapPin, Edit3, Compass, Sun, Moon, Book, Headphones, Map } from 'lucide-react';

export default function LayoutClientWrapper({ children }) {
  const pathname = usePathname();
  const { user, isVip, logout } = useAuth();
  const {
    vocabMastered,
    kanjiMastered,
    grammarMastered,
    readingMastered,
    listeningMastered,
    completedDays,
    theme,
    isLoaded,
    toggleTheme,
    currentLevel,
    minnaMastered,
    changeLevel,
  } = useProgress();

  // ── N3 Progress ──────────────────────────────────────────────────────────
  const totalVocab = 880;
  const totalKanji = 168;
  const totalGrammar = 110;
  const totalReading = 72;
  const totalListening = 28;
  const totalDays = 20;

  const vocabCount    = vocabMastered?.length || 0;
  const kanjiCount    = kanjiMastered?.length || 0;
  const grammarCount  = grammarMastered?.length || 0;
  const readingCount  = readingMastered?.length || 0;
  const listeningCount = listeningMastered?.length || 0;
  const daysCount     = completedDays?.length || 0;

  const vocabPercent    = Math.round((vocabCount / totalVocab) * 100) || 0;
  const kanjiPercent    = Math.round((kanjiCount / totalKanji) * 100) || 0;
  const grammarPercent  = Math.round((grammarCount / totalGrammar) * 100) || 0;
  const readingPercent  = Math.round((readingCount / totalReading) * 100) || 0;
  const listeningPercent = Math.round((listeningCount / totalListening) * 100) || 0;

  const n3OverallPercent = Math.round(
    (vocabPercent * 0.25) +
    (grammarPercent * 0.2) +
    (readingPercent * 0.2) +
    (listeningPercent * 0.15) +
    (kanjiPercent * 0.12) +
    ((daysCount / totalDays) * 8)
  ) || 0;

  // ── N5 / N4 Progress ─────────────────────────────────────────────────────
  const n5Mastered = (minnaMastered || []).filter(n => n >= 1 && n <= 25).length;
  const n4Mastered = (minnaMastered || []).filter(n => n >= 26 && n <= 50).length;
  const n5Percent  = Math.round((n5Mastered / 25) * 100);
  const n4Percent  = Math.round((n4Mastered / 25) * 100);

  const sharedNavItems = [
    { name: 'Sổ tay cá nhân',    path: '/notebook',  icon: Edit3 },
    { name: 'Tài liệu & Phòng thi', path: '/resources', icon: MapPin },
    { name: 'Cấu trúc & Mẹo thi', path: '/tips',      icon: Compass },
  ];

  const n3NavItems = [
    { name: 'Bản đồ bài học N3', path: '/', icon: Map },
    { name: 'Kanji Look & Learn', path: '/kanjill', icon: BookOpen },
    { name: 'Luyện đề N3', path: '/exams/n3', icon: Edit3 },
  ];

  const n5NavItems = [
    { name: 'Bản đồ bài học N5', path: '/',          icon: Map },
    { name: 'Kanji Look & Learn', path: '/kanjill', icon: BookOpen },
    { name: 'Luyện đề N5', path: '/exams/n5', icon: Edit3 },
  ];

  const n4NavItems = [
    { name: 'Bản đồ bài học N4', path: '/',          icon: Map },
    { name: 'Kanji Look & Learn', path: '/kanjill', icon: BookOpen },
    { name: 'Luyện đề N4', path: '/exams/n4', icon: Edit3 },
  ];

  const levelNavMap = { N3: n3NavItems, N5: n5NavItems, N4: n4NavItems };
  const levelNavItems = levelNavMap[currentLevel] || n3NavItems;

  // ── Level colors ─────────────────────────────────────────────────────────
  const levelColors = {
    N5: { primary: '#22c55e', glow: 'rgba(34,197,94,0.35)',  bg: 'rgba(34,197,94,0.08)',  label: 'N5 · Sơ cấp I' },
    N4: { primary: '#0ea5e9', glow: 'rgba(14,165,233,0.35)', bg: 'rgba(14,165,233,0.08)', label: 'N4 · Sơ cấp II' },
    N3: { primary: '#8b5cf6', glow: 'rgba(139,92,246,0.35)', bg: 'rgba(139,92,246,0.08)', label: 'N3 · Trung cấp' },
    N2: { primary: '#f59e0b', glow: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)', label: 'N2 · Sắp có' },
    N1: { primary: '#ef4444', glow: 'rgba(239,68,68,0.35)', bg: 'rgba(239,68,68,0.08)', label: 'N1 · Sắp có' },
  };
  const lc = levelColors[currentLevel];
  const levels = [
    { id: 'N5', disabled: false },
    { id: 'N4', disabled: false },
    { id: 'N3', disabled: false },
    { id: 'N2', disabled: true },
    { id: 'N1', disabled: true },
  ];

  // ── Sidebar progress block ────────────────────────────────────────────────
  const progressBlock = currentLevel === 'N3' ? (
    <div className="sidebar-progress">
      <div className="progress-container">
        <div className="progress-label">
          <span>Tiến độ N3 tổng hợp</span>
          <span style={{ color: '#8b5cf6' }}>{n3OverallPercent}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${n3OverallPercent}%`, background: 'linear-gradient(90deg,#8b5cf6,#6d28d9)' }} />
        </div>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
        Từ vựng, Ngữ pháp, Đọc, Nghe, Kanji
      </p>
    </div>
  ) : currentLevel === 'N5' ? (
    <div className="sidebar-progress">
      <div className="progress-container">
        <div className="progress-label">
          <span>Hoàn thành N5</span>
          <span style={{ color: '#22c55e' }}>{n5Mastered}/25 bài</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${n5Percent}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
        </div>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
        Bài 1–25 · Minna no Nihongo
      </p>
    </div>
  ) : (
    <div className="sidebar-progress">
      <div className="progress-container">
        <div className="progress-label">
          <span>Hoàn thành N4</span>
          <span style={{ color: '#0ea5e9' }}>{n4Mastered}/25 bài</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${n4Percent}%`, background: 'linear-gradient(90deg,#0ea5e9,#0284c7)' }} />
        </div>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
        Bài 26–50 · Minna no Nihongo
      </p>
    </div>
  );

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex', height: '100vh', width: '100vw',
        justifyContent: 'center', alignItems: 'center',
        background: '#0b0f19', color: '#f8fafc', fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid #243049', borderTopColor: '#6366f1',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontWeight: 600, fontSize: '14px', color: '#94a3b8' }}>Đang nạp ứng dụng học tập...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        {/* ── Profile Card ── */}
        <div className="profile-card">
          <div className="avatar-ring" style={{ background: (isVip || user?.role === 'admin') ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--primary-gradient)' }}>
            <div className="avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                (isVip || user?.role === 'admin') ? '👑' : '🎓'
              )}
            </div>
          </div>

          {user ? (
            <>
              <h2 className="profile-title" style={{
                background: (isVip || user?.role === 'admin') ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--primary-gradient)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800
              }}>
                {user.name}
              </h2>
              <p className="profile-subtitle">{user?.role === 'admin' ? 'Quản trị viên 👑' : (isVip ? 'Học viên VIP 👑' : 'Học viên Thường')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <Link href="/profile" className="profile-sidebar-btn">Trang cá nhân 👤</Link>
                {!isVip && user?.role !== 'admin' && (
                  <Link href="/pricing" className="upgrade-sidebar-btn">Nâng cấp VIP ⚡</Link>
                )}
                <button onClick={logout} className="logout-sidebar-btn">Đăng xuất</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="profile-title">Khách hàng</h2>
              <p className="profile-subtitle">Đăng nhập để đồng bộ tiến trình</p>
              <div style={{ marginBottom: '16px' }}>
                <Link href="/auth" className="login-sidebar-btn">Đăng nhập / Đăng ký</Link>
              </div>
            </>
          )}

          {/* ── Level Switcher ── */}
          <div className="level-switcher-wrap">
            <p className="level-switcher-label">CẤP ĐỘ</p>
            <div className="level-switcher">
              {levels.map(({ id: lvl, disabled }) => (
                <button
                  key={lvl}
                  id={`level-btn-${lvl}`}
                  className={`level-btn ${currentLevel === lvl ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => !disabled && changeLevel(lvl)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={disabled ? `${lvl} sắp có` : `Chuyển sang ${lvl}`}
                  style={currentLevel === lvl ? {
                    background: levelColors[lvl].primary,
                    boxShadow: `0 2px 10px ${levelColors[lvl].glow}`,
                    color: '#fff',
                  } : {}}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="level-subtitle">{lc.label}</p>
          </div>

          {/* ── Progress Block ── */}
          {progressBlock}
        </div>

        {/* ── Nav Menu ── */}
        <nav className="nav-menu">
          {levelNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={`${currentLevel}-${item.path}-${item.name}`}
                href={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={isActive ? { borderLeftColor: lc.primary, color: lc.primary, background: lc.bg } : {}}
              >
                <Icon size={18} style={isActive ? { color: lc.primary } : {}} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

          {/* Shared items (always visible) */}
          {sharedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Admin link */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}
              style={{
                borderLeft: '3px solid #f59e0b',
                background: pathname === '/admin' ? 'rgba(245,158,11,0.05)' : 'transparent',
                color: pathname === '/admin' ? '#f59e0b' : 'var(--text-secondary)'
              }}
            >
              <Grid size={18} style={{ color: '#f59e0b' }} />
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>Trang quản trị 👑</span>
            </Link>
          )}
        </nav>

        {/* ── Theme Toggle ── */}
        <div className="theme-toggle-container">
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? (
              <><Sun size={16} /><span>Giao diện sáng (Light)</span></>
            ) : (
              <><Moon size={16} /><span>Giao diện tối (Dark)</span></>
            )}
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      <style jsx global>{`
        /* ─── Level Switcher ─── */
        .level-switcher-wrap {
          margin-bottom: 16px;
        }
        .level-switcher-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          margin-bottom: 6px;
          text-align: center;
        }
        .level-switcher {
          display: flex;
          background: var(--bg-tertiary);
          border-radius: 10px;
          padding: 3px;
          gap: 3px;
          border: 1px solid var(--border-color);
        }
        .level-btn {
          flex: 1;
          min-width: 0;
          padding: 7px 2px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.05em;
        }
        .level-btn:hover:not(.active) {
          background: var(--border-color);
          color: var(--text-primary);
        }
        .level-btn.disabled {
          color: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.45;
          background: repeating-linear-gradient(
            135deg,
            transparent,
            transparent 5px,
            rgba(148, 163, 184, 0.1) 5px,
            rgba(148, 163, 184, 0.1) 10px
          );
        }
        .level-subtitle {
          font-size: 10px;
          color: var(--text-muted);
          text-align: center;
          margin-top: 5px;
        }

        /* ─── Sidebar Buttons (unchanged) ─── */
        .profile-sidebar-btn {
          display: block; width: 100%; padding: 6px;
          background: transparent; border: 1px solid var(--border-color);
          color: var(--text-primary) !important; font-size: 12px; font-weight: 600;
          border-radius: var(--radius-sm); text-align: center; text-decoration: none;
          transition: var(--transition);
        }
        .profile-sidebar-btn:hover {
          background: rgba(99,102,241,0.05); border-color: rgba(99,102,241,0.2);
          color: var(--primary) !important;
        }
        .upgrade-sidebar-btn {
          display: block; width: 100%; padding: 8px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white !important; text-decoration: none; font-size: 13px; font-weight: 700;
          border-radius: var(--radius-sm); text-align: center; transition: var(--transition);
          box-shadow: 0 4px 10px rgba(245,158,11,0.2); border: none;
        }
        .upgrade-sidebar-btn:hover { opacity: 0.95; transform: translateY(-1px); }
        .logout-sidebar-btn {
          width: 100%; padding: 6px; background: transparent;
          border: 1px solid var(--border-color); color: var(--text-secondary);
          font-size: 12px; font-weight: 600; border-radius: var(--radius-sm);
          cursor: pointer; transition: var(--transition);
        }
        .logout-sidebar-btn:hover {
          background: rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.2);
          color: var(--danger);
        }
        .login-sidebar-btn {
          display: block; width: 100%; padding: 8px;
          background: var(--primary-gradient); color: white !important;
          text-decoration: none; font-size: 13px; font-weight: 700;
          border-radius: var(--radius-sm); text-align: center;
          transition: var(--transition); box-shadow: 0 4px 10px rgba(99,102,241,0.2); border: none;
        }
        .login-sidebar-btn:hover { opacity: 0.95; transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
