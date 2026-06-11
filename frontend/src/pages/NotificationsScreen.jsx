import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, VideoOff, Video, Car, Trash2, Wifi, WifiOff } from 'lucide-react';
import Button from '../components/Button/Button';
import { db } from '../firebase/config';
import { collection, onSnapshot, orderBy, query, limit, addDoc, serverTimestamp, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const NotificationsScreen = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Listen to Firestore notifications collection (real-time)
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = [];
      snapshot.forEach(d => notifs.push({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setLoading(false);
    }, (err) => {
      console.warn('Firestore notifications error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  // Seed initial notifications if collection is empty (first run)
  useEffect(() => {
    if (!loading && notifications.length === 0) {
      seedInitialNotifications();
    }
  }, [loading, notifications.length]);

  const seedInitialNotifications = async () => {
    const seeds = [
      {
        userId: currentUser?.uid || 'demo',
        title: 'System Ready',
        message: 'SmartPark AI is online and monitoring parking spaces.',
        type: 'info',
        icon: 'check',
        read: false,
        createdAt: serverTimestamp(),
        time: new Date().toLocaleString(),
      },
      {
        userId: currentUser?.uid || 'demo',
        title: 'Camera Online',
        message: 'CAM1 is active and streaming live footage.',
        type: 'success',
        icon: 'check',
        read: false,
        createdAt: serverTimestamp(),
        time: new Date().toLocaleString(),
        action: '/admin/cameras',
      },
    ];
    for (const seed of seeds) {
      try {
        await addDoc(collection(db, 'notifications'), seed);
      } catch (e) {
        console.warn('Could not seed notification:', e);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length && notifications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} notifications?`)) {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'notifications', id));
      });
      await batch.commit().catch(e => console.warn("Failed to delete batch", e));
      setSelectedIds([]);
    }
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;
    if (window.confirm("Are you sure you want to delete ALL notifications?")) {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit().catch(e => console.warn("Failed to clear all", e));
      setSelectedIds([]);
    }
  };

  const getIcon = (iconType) => {
    const iconMap = {
      video: <VideoOff size={20} color="#ef4444" />,
      'video-on': <Video size={20} color="#22c55e" />,
      warning: <AlertTriangle size={20} color="#f59e0b" />,
      check: <CheckCircle size={20} color="#22c55e" />,
      info: <Info size={20} color="#3b82f6" />,
      car: <Car size={20} color="var(--primary-color)" />,
      trash: <Trash2 size={20} color="#ef4444" />,
      wifi: <Wifi size={20} color="#22c55e" />,
      'wifi-off': <WifiOff size={20} color="#ef4444" />,
    };
    return iconMap[iconType] || <Bell size={20} color="var(--primary-color)" />;
  };

  const getIconBg = (type) => {
    const bgMap = {
      success: 'rgba(34,197,94,0.1)',
      error: 'rgba(239,68,68,0.1)',
      warning: 'rgba(245,158,11,0.1)',
      info: 'rgba(59,130,246,0.1)',
    };
    return bgMap[type] || 'var(--bg-tertiary)';
  };

  const formatTime = (notif) => {
    if (notif.time) return notif.time;
    if (notif.createdAt?.seconds) {
      return new Date(notif.createdAt.seconds * 1000).toLocaleString();
    }
    return 'Just now';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ marginLeft: '0.75rem', background: 'var(--primary-color)', color: 'white', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                {unreadCount} new
              </span>
            )}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>System alerts and updates</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {notifications.length > 0 && (
            <>
              <button 
                onClick={toggleSelectAll} 
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
              >
                {selectedIds.length === notifications.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedIds.length > 0 && (
                <button 
                  onClick={deleteSelected} 
                  style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Trash2 size={16} /> Delete Selected
                </button>
              )}
            </>
          )}
          <Button variant="outline" onClick={clearAll} disabled={notifications.length === 0} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            Clear All
          </Button>
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark All as Read
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <Bell size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No notifications yet.</h2>
            <p style={{ color: 'var(--text-secondary)' }}>System events will appear here automatically.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid',
                borderColor: notif.read ? 'var(--border-color)' : 'rgba(124, 58, 237, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
                position: 'relative',
                transition: 'background 0.2s',
                opacity: notif.read ? 0.75 : 1,
              }}
            >
              {!notif.read && (
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
              )}
              <input 
                type="checkbox" 
                checked={selectedIds.includes(notif.id)}
                onChange={() => toggleSelect(notif.id)}
                style={{ width: '18px', height: '18px', marginTop: '0.65rem', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
              />
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: getIconBg(notif.type),
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {getIcon(notif.icon)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>{notif.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{notif.message}</p>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{formatTime(notif)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;
