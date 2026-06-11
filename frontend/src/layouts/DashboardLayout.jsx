import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, BarChart3, QrCode, Users, Settings, Bell, LogOut, Car, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './DashboardLayout.module.css';

const PROFILE_STORAGE_KEY = 'smartpark_profile';

const getLocalProfile = (currentUser) => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { name: currentUser?.displayName || 'Admin User', org: 'Central Mall', avatarUrl: currentUser?.photoURL || null };
};

const DashboardLayout = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState(() => getLocalProfile(currentUser));
  const menuRef = useRef(null);

  // Re-read profile from localStorage whenever the layout renders (catches Settings saves)
  useEffect(() => {
    const sync = () => setProfile(getLocalProfile(currentUser));
    sync();
    window.addEventListener('storage', sync);
    // Also poll every 2s in case same-tab updates
    const interval = setInterval(sync, 2000);
    return () => { window.removeEventListener('storage', sync); clearInterval(interval); };
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (error) { console.error('Logout failed', error); }
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'Cameras', icon: <Video size={20} />, path: '/admin/cameras' },
    { name: 'Analytics', icon: <BarChart3 size={20} />, path: '/admin/analytics' },
    { name: 'QR Codes', icon: <QrCode size={20} />, path: '/admin/qr' },
    { name: 'Users', icon: <Users size={20} />, path: '/admin/users' },
    { name: 'Notifications', icon: <Bell size={20} />, path: '/admin/notifications' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  const displayName = profile.name || currentUser?.displayName || 'Admin User';
  const displayOrg = profile.org || 'Central Mall';
  const avatarUrl = profile.avatarUrl || currentUser?.photoURL || null;
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer} onClick={() => navigate('/')}>
          <div className={styles.logoIcon}><Car size={20} /></div>
          <span className={styles.logoText}>SmartPark</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}></div>
          <div className={styles.headerRight}>
            {/* Clickable user profile with dropdown */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '10px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarUrl ? 'transparent' : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(99,102,241,0.3)' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administrator</div>
                </div>
                <ChevronDown size={14} color="var(--text-secondary)" style={{ transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }} />
              </button>

              {showUserMenu && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 200, minWidth: '220px', padding: '0.75rem', overflow: 'hidden' }}>
                  {/* Profile summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: avatarUrl ? 'transparent' : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 }}>
                      {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '500' }}>Owner</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{displayOrg}</div>
                    </div>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/admin/settings'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.65rem 0.75rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Settings size={15} /> Profile Settings
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); setShowLogoutModal(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.65rem 0.75rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Confirm Logout</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
              Are you sure you want to log out of your account?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutModal(false)}
                style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                style={{ padding: '0.6rem 1.25rem', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
