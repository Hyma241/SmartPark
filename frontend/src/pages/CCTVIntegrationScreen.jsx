import React, { useState, useEffect } from 'react';
import { Camera, Plus, CheckCircle, XCircle, Play, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import styles from './CCTVIntegrationScreen.module.css';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getYouTubeEmbedId = (url) => {
  // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID, youtube.com/embed/ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const isYouTubeUrl = (url) => /youtube\.com|youtu\.be/i.test(url);
const isMjpegUrl = (url) => /mjpeg|\.mjpg/i.test(url);

// Render the live stream inside a camera card
const StreamRenderer = ({ cam }) => {
  const url = cam.url;
  if (!url) return <Play size={32} color="rgba(255,255,255,0.3)" />;

  if (isYouTubeUrl(url)) {
    const videoId = getYouTubeEmbedId(url);
    if (!videoId) {
      return (
        <div style={{ color: '#f59e0b', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>
          ⚠️ Could not parse YouTube URL
        </div>
      );
    }
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1`}
        title="Live Camera"
        allow="autoplay; encrypted-media"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
      />
    );
  }

  if (isMjpegUrl(url)) {
    return (
      <img
        src={url}
        alt="Live MJPEG"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }

  // Generic HTTP/RTSP video stream
  return (
    <video
      src={url}
      autoPlay
      muted
      controls
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentElement.innerHTML =
          '<div style="color:#f59e0b;font-size:0.8rem;text-align:center;padding:0.5rem">⚠️ Stream unavailable — RTSP requires a relay server</div>';
      }}
    />
  );
};

// ─────────────────────────────────────────────
// Delete Confirmation Modal
// ─────────────────────────────────────────────
const DeleteModal = ({ cam, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
  }}>
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: '16px', padding: '2rem',
      maxWidth: '420px', width: '90%', border: '1px solid var(--border-color)',
      boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={20} color="#ef4444" />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Delete Camera</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{cam.name}</strong> ({cam.location})?
        This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{ padding: '0.6rem 1.25rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{ padding: '0.6rem 1.25rem', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: '600' }}
        >
          Delete Camera
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const CCTVIntegrationScreen = () => {
  const { currentUser } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', location: '' });
  const [testStatus, setTestStatus] = useState('idle');
  const [testDetail, setTestDetail] = useState(null);
  const [testPreview, setTestPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCamIds, setActiveCamIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // camera object to delete

  const fetchCameras = async () => {
    try {
      const ts = Date.now();
      const url = currentUser ? `/api/cameras/status?user_id=${currentUser.uid}&t=${ts}` : `/api/cameras/status?t=${ts}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const cams = Object.entries(data).map(([id, info]) => ({
          id,
          name: info.name || 'Camera',
          url: info.original_url || info.url || '',
          location: info.location || 'Unknown',
        }));
        setCameras(cams);
      }
    } catch (e) {
      console.error('Failed to fetch cameras from backend', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCameras();
  }, [currentUser]);

  const handleTestConnection = async () => {
    if (!formData.url) return alert('Please enter a stream URL');
    setTestStatus('testing');
    setTestDetail(null);
    setTestPreview(null);

    try {
      const res = await fetch('/api/cameras/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.url }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestDetail(data.message || 'Connected');
        setTestPreview(data.frame_preview || null);
      } else {
        setTestStatus('error');
        setTestDetail(data.error || data.message || 'Connection failed');
      }
    } catch (e) {
      setTestStatus('error');
      setTestDetail('Network error — is the backend running?');
    }
  };

  const handleSaveCamera = async () => {
    if (testStatus !== 'success') return toast.error('Please test the connection first!');
    if (!formData.name || !formData.location) return toast.error('Please fill all fields');

    setSaving(true);
    const docId = `cam_${Date.now()}`;

    // Save to Firestore (non-blocking)
    if (currentUser) {
      setDoc(doc(db, `users/${currentUser.uid}/cameras`, docId), {
        ...formData,
        status: 'active',
        createdAt: new Date(),
      }).catch((fbErr) => console.warn('Firebase save failed', fbErr));
    }

    try {
      const res = await fetch('/api/cameras/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cam_id: docId,
          url: formData.url,
          name: formData.name,
          location: formData.location,
          user_id: currentUser ? currentUser.uid : ""
        }),
      });

      if (!res.ok) throw new Error('Backend rejected camera save');

      setFormData({ name: '', url: '', location: '' });
      setShowAddForm(false);
      setTestStatus('idle');
      setTestPreview(null);
      setSaving(false);
      await fetchCameras();
      // Write notification to Firestore
      addDoc(collection(db, 'notifications'), {
        userId: currentUser ? currentUser.uid : 'demo',
        title: 'Camera Added',
        message: `"${formData.name}" at ${formData.location} was integrated successfully.`,
        type: 'success',
        icon: 'check',
        read: false,
        createdAt: serverTimestamp(),
        time: new Date().toLocaleString(),
        action: '/admin/cameras',
      }).catch(() => {});
      toast.success('🎉 Camera integrated successfully!', { autoClose: 3000 });
    } catch (e) {
      console.error('Failed to save camera to backend', e);
      setSaving(false);
      toast.error('Failed to save camera — ' + e.message);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const cam = deleteTarget;
    setDeleteTarget(null);
    try {
      if (currentUser) {
        // Fire and forget Firestore deletion to prevent UI hanging
        deleteDoc(doc(db, `users/${currentUser.uid}/cameras`, cam.id)).catch(() => {});
      }
      const res = await fetch(`/api/cameras/${cam.id}?user_id=${currentUser?.uid || ''}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Backend delete failed");
      
      toast.success(`Camera "${cam.name}" deleted`);
      // Write notification to Firestore
      addDoc(collection(db, 'notifications'), {
        userId: currentUser ? currentUser.uid : 'demo',
        title: 'Camera Deleted',
        message: `"${cam.name}" at ${cam.location} was removed from the system.`,
        type: 'error',
        icon: 'trash',
        read: false,
        createdAt: serverTimestamp(),
        time: new Date().toLocaleString(),
      }).catch(() => {});
      fetchCameras();
    } catch (e) {
      console.error('Failed to delete', e);
      toast.error('Failed to delete camera');
    }
  };

  return (
    <div className={styles.container}>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          cam={deleteTarget}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cameras</h1>
          <p className={styles.subtitle}>Manage your CCTV camera feeds</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowAddForm(true)}>
          Add New Camera
        </Button>
      </div>

      {showAddForm && (
        <div className={styles.formCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Add New Camera</h3>
            <button className={styles.closeBtn} onClick={() => { setShowAddForm(false); setTestPreview(null); setTestStatus('idle'); }}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formCol}>
              <Input
                label="Camera Name"
                placeholder="e.g. Parking Entrance Camera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Location"
                placeholder="e.g. Level 1"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Input
                label="Stream URL (RTSP / HTTP / MJPEG / YouTube Live)"
                placeholder="https://youtube.com/live/... OR rtsp://..."
                value={formData.url}
                onChange={(e) => { setFormData({ ...formData, url: e.target.value }); setTestStatus('idle'); setTestDetail(null); setTestPreview(null); }}
              />
            </div>
            <div className={styles.testCol}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Connection Test</h4>

              <div className={styles.testBox}>
                {testStatus === 'idle' && (
                  <Button variant="outline" onClick={handleTestConnection}>Test Connection</Button>
                )}
                {testStatus === 'testing' && (
                  <div className={styles.statusText}>Testing connection...</div>
                )}
                {testStatus === 'success' && (
                  <>
                    <div className={`${styles.statusText} ${styles.success}`}>
                      <CheckCircle size={20} /> {testDetail || 'Connection Successful'}
                    </div>
                    {testPreview && (
                      <img src={testPreview} alt="Stream preview" style={{ width: '100%', borderRadius: '8px', marginTop: '0.75rem', border: '1px solid var(--border-color)' }} />
                    )}
                  </>
                )}
                {testStatus === 'error' && (
                  <div className={`${styles.statusText} ${styles.error}`}>
                    <XCircle size={20} /> {testDetail || 'Connection Failed'}
                  </div>
                )}
              </div>

              {testStatus === 'success' && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSaveCamera}
                  disabled={saving}
                  style={{ marginTop: '1.5rem', opacity: saving ? 0.7 : 1 }}
                >
                  {saving
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Loader2 size={18} className="spin" /> Saving...</span>
                    : 'Save Camera'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.camerasGrid}>
        {loading ? (
          <div>Loading cameras...</div>
        ) : cameras.length === 0 ? (
          <div className={styles.emptyState}>
            <Camera size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            <h3>No cameras connected</h3>
            <p>Add a new camera to start monitoring</p>
          </div>
        ) : (
          cameras.map(cam => (
            <div key={cam.id} className={styles.cameraCard}>
              <div className={styles.camHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className={styles.statusDot}></div>
                  <h3 className={styles.camName}>{cam.name}</h3>
                </div>
                <div className={styles.camActions}>
                  <button
                    className={styles.iconBtn}
                    title={activeCamIds.includes(cam.id) ? 'Stop stream' : 'Play stream'}
                    onClick={() => setActiveCamIds(prev => prev.includes(cam.id) ? prev.filter(id => id !== cam.id) : [...prev, cam.id])}
                  >
                    {activeCamIds.includes(cam.id) ? <XCircle size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.danger}`}
                    title="Delete camera"
                    onClick={() => setDeleteTarget(cam)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className={styles.camBody}>
                <div className={styles.camPreview} style={{ background: activeCamIds.includes(cam.id) ? '#000' : undefined }}>
                  {activeCamIds.includes(cam.id)
                    ? <StreamRenderer cam={cam} />
                    : <Play size={32} color="rgba(255,255,255,0.3)" />
                  }
                </div>
                <div className={styles.camDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Location</span>
                    <span className={styles.detailValue}>{cam.location}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>URL</span>
                    <span className={styles.detailValue} style={{ wordBreak: 'break-all', fontSize: '0.78rem' }}>{cam.url}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CCTVIntegrationScreen;
