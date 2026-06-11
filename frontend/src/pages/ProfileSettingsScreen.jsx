import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Building, Lock, Bell, Shield, Save, Camera, Eye, EyeOff } from 'lucide-react';
import Button from '../components/Button/Button';

import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const PROFILE_STORAGE_KEY = 'smartpark_profile';

const loadLocalProfile = (currentUser) => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    name: currentUser?.displayName || 'Admin User',
    org: 'Central Mall',
    avatarUrl: currentUser?.photoURL || null,
    notifPrefs: { cameraDisconnect: true, dailyReport: true, highOccupancy: false },
  };
};

const ProfileSettingsScreen = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState(null);
  const avatarInputRef = useRef(null);

  const localProfile = loadLocalProfile(currentUser);

  const [profileName, setProfileName] = useState(localProfile.name);
  const [profileOrg, setProfileOrg] = useState(localProfile.org);
  const [avatarUrl, setAvatarUrl] = useState(localProfile.avatarUrl);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState(localProfile.notifPrefs);
  const [savingNotif, setSavingNotif] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const persistLocal = (updates) => {
    try {
      const current = loadLocalProfile(currentUser);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...current, ...updates }));
      window.dispatchEvent(new Event('storage')); // trigger update across app
    } catch (e) {
      console.error('Local storage save failed', e);
      showToast('Failed to save to local storage (image too large?)', 'error');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        // Cover sizing
        const scale = Math.max(150 / img.width, 150 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (150 - w) / 2, (150 - h) / 2, w, h);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!profileName.trim()) { showToast('Name cannot be empty', 'error'); return; }
    setSavingProfile(true);
    try {
      // Save to Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: profileName.trim(),
        ...(avatarUrl ? { photoURL: avatarUrl } : {}),
      });
      // Save to Firestore
      if (currentUser?.uid && db) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          name: profileName.trim(),
          organization: profileOrg,
          ...(avatarUrl ? { photoURL: avatarUrl } : {}),
        });
      }
      // Persist locally so it survives refresh
      persistLocal({ name: profileName.trim(), org: profileOrg, avatarUrl });
      showToast('Profile saved successfully!');
    } catch (err) {
      // Even if Firebase fails, save locally
      persistLocal({ name: profileName.trim(), org: profileOrg, avatarUrl });
      showToast('Profile saved locally!');
    }
    setSavingProfile(false);
  };

  const savePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { showToast('All password fields are required', 'error'); return; }
    if (newPwd !== confirmPwd) { showToast('New passwords do not match', 'error'); return; }
    if (newPwd.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setSavingPwd(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      showToast('Password updated successfully!');
    } catch (err) {
      if (err.code === 'auth/wrong-password') showToast('Current password is incorrect', 'error');
      else showToast('Failed to update password: ' + err.message, 'error');
    }
    setSavingPwd(false);
  };

  const saveNotifPrefs = async () => {
    setSavingNotif(true);
    try {
      if (currentUser?.uid && db) {
        await updateDoc(doc(db, 'users', currentUser.uid), { notifPrefs });
      }
      persistLocal({ notifPrefs });
      showToast('Notification preferences saved!');
    } catch (err) {
      persistLocal({ notifPrefs });
      showToast('Preferences saved locally!');
    }
    setSavingNotif(false);
  };

  const tabStyle = (tab) => ({
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: activeTab === tab ? 'var(--bg-secondary)' : 'transparent',
    border: '1px solid', borderColor: activeTab === tab ? 'var(--border-color)' : 'transparent',
    borderRadius: '8px',
    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s',
    width: '100%',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem',
          background: toast.type === 'error' ? '#ef4444' : '#22c55e',
          color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px',
          zIndex: 9999, fontWeight: '500', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.type === 'error' ? '✗' : '✓'} {toast.msg}
        </div>
      )}

      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>Settings</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Manage your account settings and preferences</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('profile')} style={tabStyle('profile')}><User size={18} /> Profile Information</button>
          <button onClick={() => setActiveTab('security')} style={tabStyle('security')}><Lock size={18} /> Security</button>
          <button onClick={() => setActiveTab('notifications')} style={tabStyle('notifications')}><Bell size={18} /> Notifications</button>
        </div>

        <div style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem' }}>

          {activeTab === 'profile' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600' }}>Profile Information</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: avatarUrl ? 'transparent' : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', overflow: 'hidden' }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (profileName?.charAt(0)?.toUpperCase() || 'A')}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current.click()}
                    style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-color)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Camera size={13} />
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </div>
                <div>
                  <Button variant="outline" onClick={() => avatarInputRef.current.click()}>Change Avatar</Button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>JPG, PNG — max 2MB</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 0.75rem' }}>
                    <User size={16} color="var(--text-secondary)" />
                    <input value={profileName} onChange={e => setProfileName(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.75rem 0', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 0.75rem', opacity: 0.6 }}>
                    <Mail size={16} color="var(--text-secondary)" />
                    <input value={currentUser?.email || 'admin@smartpark.com'} disabled style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.75rem 0', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Organization</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 0.75rem' }}>
                    <Building size={16} color="var(--text-secondary)" />
                    <input value={profileOrg} onChange={e => setProfileOrg(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.75rem 0', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Role</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 0.75rem', opacity: 0.6 }}>
                    <Shield size={16} color="var(--text-secondary)" />
                    <input value="Owner" disabled style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.75rem 0', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }} />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" icon={<Save size={18} />} onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600' }}>Change Password</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '400px' }}>
                {[
                  { label: 'Current Password', value: currentPwd, setter: setCurrentPwd, show: showCurrentPwd, toggle: setShowCurrentPwd },
                  { label: 'New Password', value: newPwd, setter: setNewPwd, show: showNewPwd, toggle: setShowNewPwd },
                  { label: 'Confirm New Password', value: confirmPwd, setter: setConfirmPwd, show: showNewPwd, toggle: null },
                ].map(({ label, value, setter, show, toggle }) => (
                  <div key={label}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>{label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 0.75rem' }}>
                      <Lock size={16} color="var(--text-secondary)" />
                      <input
                        type={show ? 'text' : 'password'}
                        value={value}
                        onChange={e => setter(e.target.value)}
                        placeholder="••••••••"
                        style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.75rem 0', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
                      />
                      {toggle && (
                        <button onClick={() => toggle(!show)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                          {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '2rem' }}>
                <Button variant="primary" onClick={savePassword} disabled={savingPwd}>
                  {savingPwd ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600' }}>Notification Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[
                  { key: 'cameraDisconnect', title: 'Email Alerts for Camera Disconnects', desc: 'Receive an email when a CCTV camera goes offline.' },
                  { key: 'dailyReport', title: 'Daily Occupancy Report', desc: 'Receive a daily summary of parking statistics.' },
                  { key: 'highOccupancy', title: 'High Occupancy Alerts', desc: 'Alert when occupancy exceeds 90%.' },
                ].map(({ key, title, desc }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notifPrefs[key]}
                      onChange={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                    />
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '2rem' }}>
                <Button variant="primary" onClick={saveNotifPrefs} disabled={savingNotif}>
                  {savingNotif ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsScreen;
