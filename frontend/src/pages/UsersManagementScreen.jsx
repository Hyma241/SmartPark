import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, MoreVertical, ShieldCheck, ShieldOff, UserX, UserCheck, RefreshCw, Unlock } from 'lucide-react';
import Button from '../components/Button/Button';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const ROLES = ['Owner', 'Manager', 'Viewer'];

const roleBadge = (role) => ({
  Owner: { bg: 'rgba(124,58,237,0.1)', color: 'var(--primary-color)' },
  Manager: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  Viewer: { bg: 'rgba(107,114,128,0.1)', color: '#9ca3af' },
}[role] || { bg: 'rgba(107,114,128,0.1)', color: '#9ca3af' });

const UsersManagementScreen = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const [roleInput, setRoleInput] = useState('');
  const menuRef = useRef(null);
  const currentUserRole = 'Owner';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-create Firestore record for current admin if missing
  useEffect(() => {
    if (!currentUser) return;
    const ensureAdminDoc = async () => {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin',
          email: currentUser.email || '',
          role: 'Owner',
          status: 'active',
          date: new Date().toLocaleDateString(),
        }, { merge: true }); // merge: true = only writes missing fields
      } catch (err) {
        console.warn('Could not ensure admin doc:', err);
      }
    };
    ensureAdminDoc();
  }, [currentUser]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uList = [];
      snapshot.forEach(d => uList.push({ id: d.id, ...d.data() }));

      // If current user not in list (e.g. Firestore rules blocked write), inject them manually
      if (currentUser && !uList.find(u => u.id === currentUser.uid)) {
        uList.unshift({
          id: currentUser.uid,
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin',
          email: currentUser.email || '',
          role: 'Owner',
          status: 'active',
          date: new Date().toLocaleDateString(),
        });
      }

      setUsers(uList);
    }, (err) => {
      console.error('Failed to fetch users', err);
      // Even if Firestore fails, show the current logged-in user
      if (currentUser) {
        setUsers([{
          id: currentUser.uid,
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin',
          email: currentUser.email || '',
          role: 'Owner',
          status: 'active',
          date: new Date().toLocaleDateString(),
        }]);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const canModify = (targetUser) => {
    if (currentUserRole !== 'Owner') return false;
    if (targetUser.role === 'Owner' && targetUser.id === currentUser?.uid) return false;
    return true;
  };

  const updateUserStatus = async (userId, updateData) => {
    try {
      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (err) {
      console.error(err);
      showToast('Failed to update user in Firebase', 'error');
    }
  };

  const handleAction = (action, user) => {
    setOpenMenuId(null);
    if (!canModify(user)) { showToast('You cannot modify this user.', 'error'); return; }
    switch (action) {
      case 'grant':
        updateUserStatus(user.id, { status: 'active' });
        showToast(`Access granted to ${user.name || user.email}`);
        break;
      case 'revoke':
        updateUserStatus(user.id, { status: 'revoked' });
        showToast(`Access revoked for ${user.name || user.email}`, 'warning');
        break;
      case 'unblock':
        updateUserStatus(user.id, { status: 'active' });
        showToast(`${user.name || user.email} has been unblocked.`);
        break;
      case 'block':
        setConfirmDialog({ action: 'block', user });
        break;
      case 'remove':
        setConfirmDialog({ action: 'remove', user });
        break;
      case 'role':
        setRoleInput(user.role);
        setConfirmDialog({ action: 'role', user });
        break;
    }
  };

  const executeConfirm = async (newRole) => {
    const { action, user } = confirmDialog;
    if (action === 'block') {
      await updateUserStatus(user.id, { status: 'blocked' });
      showToast(`${user.name || user.email} has been blocked.`, 'warning');
    } else if (action === 'remove') {
      try {
        await deleteDoc(doc(db, 'users', user.id));
        showToast(`${user.name || user.email} removed from system.`);
      } catch (err) { showToast('Error removing user', 'error'); }
    } else if (action === 'role') {
      const role = newRole || roleInput.trim();
      if (!role) { showToast('Please enter or select a role', 'error'); return; }
      await updateUserStatus(user.id, { role });
      showToast(`${user.name || user.email}'s role changed to ${role}`);
    }
    setConfirmDialog(null);
    setRoleInput('');
  };

  const statusColor = { active: '#22c55e', revoked: '#f59e0b', blocked: '#ef4444', pending: '#3b82f6' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : '#22c55e', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', zIndex: 9999, fontWeight: '500', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '2rem', maxWidth: '440px', width: '90%', border: '1px solid var(--border-color)' }}>
            {confirmDialog.action === 'role' ? (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Change Role for {confirmDialog.user.name || confirmDialog.user.email}</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Type a role:</label>
                  <input
                    value={roleInput}
                    onChange={e => setRoleInput(e.target.value)}
                    placeholder="e.g. Manager, Viewer, Owner..."
                    style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Or pick a preset:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ROLES.filter(r => r !== confirmDialog.user.role).map(r => (
                      <button key={r} onClick={() => executeConfirm(r)} style={{ padding: '0.65rem 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500' }}>
                        Set as {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button variant="outline" onClick={() => { setConfirmDialog(null); setRoleInput(''); }}>Cancel</Button>
                  <Button variant="primary" onClick={() => executeConfirm()}>Apply Role</Button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: '0.75rem' }}>{confirmDialog.action === 'block' ? 'Block User' : 'Remove User'}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {confirmDialog.action === 'block'
                    ? `Block ${confirmDialog.user.name || confirmDialog.user.email}? They won't be able to access the dashboard.`
                    : `Remove ${confirmDialog.user.name || confirmDialog.user.email} from the system? This cannot be undone.`}
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
                  <button onClick={() => executeConfirm()} style={{ padding: '0.5rem 1.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    {confirmDialog.action === 'block' ? 'Block' : 'Remove'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>User Management</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Manage access and roles for your team</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>Role</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600' }}>Added On</th>
              <th style={{ padding: '1.25rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading users...
                </td>
              </tr>
            ) : (
            users.map(user => {
              const rb = roleBadge(user.role || 'Viewer');
              const isCurrentUser = user.id === currentUser?.uid;
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', position: openMenuId === user.id ? 'relative' : 'static', zIndex: openMenuId === user.id ? 50 : 1 }}>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {user.name || 'Unknown'}
                    {isCurrentUser && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'rgba(124,58,237,0.15)', color: 'var(--primary-color)', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>You</span>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{user.email || 'N/A'}</td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', background: rb.bg, color: rb.color }}>
                      {user.role || 'Owner'}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: statusColor[user.status || 'active'] || '#9ca3af', fontWeight: '500' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusColor[user.status || 'active'] || '#9ca3af', display: 'inline-block' }}></span>
                      {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{user.date || 'N/A'}</td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', position: 'relative', zIndex: openMenuId === user.id ? 100 : 1 }}>
                    <div style={{ position: 'relative', display: 'inline-block' }} ref={openMenuId === user.id ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === user.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 100, minWidth: '190px', overflow: 'hidden' }}>
                          {(() => {
                            const items = [
                              { label: 'Grant Access', icon: <UserCheck size={15} />, action: 'grant', color: '#22c55e', show: user.status !== 'active' },
                              { label: 'Revoke Access', icon: <ShieldOff size={15} />, action: 'revoke', color: '#f59e0b', show: user.status === 'active' && !isCurrentUser },
                              { label: 'Unblock', icon: <Unlock size={15} />, action: 'unblock', color: '#22c55e', show: user.status === 'blocked' },
                              { label: 'Block User', icon: <ShieldCheck size={15} />, action: 'block', color: '#ef4444', show: user.status !== 'blocked' && !isCurrentUser },
                              { label: 'Change Role', icon: <RefreshCw size={15} />, action: 'role', color: 'var(--primary-color)', show: !isCurrentUser },
                              { label: 'Remove User', icon: <UserX size={15} />, action: 'remove', color: '#ef4444', show: !isCurrentUser },
                            ].filter(i => i.show);
                            
                            if (items.length === 0) {
                              return <div style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No actions available for your own account.</div>;
                            }
                            
                            return items.map(item => (
                              <button
                                key={item.action}
                                onClick={() => handleAction(item.action, user)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.7rem 1rem', background: 'transparent', border: 'none', color: item.color, cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                {item.icon} {item.label}
                              </button>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Role Legend */}
      <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Role Permissions</h4>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div><strong style={{ color: 'var(--primary-color)' }}>Owner</strong> — Full access, add/remove users, manage cameras</div>
          <div><strong style={{ color: '#3b82f6' }}>Manager</strong> — View dashboard and analytics, no user management</div>
          <div><strong style={{ color: '#9ca3af' }}>Viewer</strong> — Read-only access, no editing permissions</div>
        </div>
      </div>
    </div>
  );
};

export default UsersManagementScreen;
