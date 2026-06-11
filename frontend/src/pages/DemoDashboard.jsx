import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Car, MapPin, TrendingUp, ArrowLeft, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../components/Button/Button';
import Navbar from '../components/Navbar/Navbar';
import BackButton from '../components/BackButton/BackButton';

// Zones are now dynamically loaded

const DemoDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const detectionResult = location.state?.result;
  const fileType = location.state?.type || (detectionResult?.results ? 'video' : 'image');
  const [showQR, setShowQR] = useState(false);

  React.useEffect(() => {
    if (!detectionResult) {
      navigate('/demo-upload');
    }
  }, [detectionResult, navigate]);

  if (!detectionResult) return null;

  // Unified stats from detectionResult.statistics for BOTH image and video
  const stats = detectionResult.statistics || {};
  const total = parseInt(stats['Total Slots']) || 0;
  const occupied = parseInt(stats['Occupied']) || 0;
  const available = parseInt(stats['Available']) || total;
  const rate = stats['Occupancy Rate'] || '0%';
  const totalVehicles = detectionResult.vehicles?.total || 0;

  // Dynamic zones if available from backend, otherwise empty
  const zoneData = stats.zones || [];

  const pieData = [
    { name: 'Occupied', value: occupied, color: '#ef4444' },
    { name: 'Available', value: available, color: '#22c55e' },
  ];

  const qrData = JSON.stringify({
    type: 'demo',
    location: stats?.location || 'SmartPark Demo Facility',
    total, occupied, available,
    zones: zoneData.map(z => ({ name: z.name, available: z.available })),
    timestamp: new Date().toISOString(),
  });

  const openPreview = () => {
    window.open('/parking/demo', '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ padding: '100px 2rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-color)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>DEMO MODE</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>Demo Parking Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Live AI detection results — no login required</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <BackButton style={{ marginBottom: 0 }} />
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Slots', value: total, color: 'var(--text-primary)', sub: stats['Mode'] || 'In this facility' },
            { label: 'Occupied', value: occupied, color: '#ef4444', sub: `Rate: ${rate}` },
            { label: 'Available', value: available, color: '#22c55e', sub: 'Ready now' },
            { label: 'Vehicles Detected', value: totalVehicles, color: 'var(--primary-color)', sub: `Cars: ${detectionResult.vehicles?.cars ?? 0} | Bikes: ${detectionResult.vehicles?.motorcycles ?? 0}` },
          ].map((card) => (
            <div key={card.label} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{card.label}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Zone Breakdown + Pie */}
        <div style={{ display: 'grid', gridTemplateColumns: zoneData.length > 0 ? '1fr 1fr' : '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Zone Availability */}
          {zoneData.length > 0 && (
          <div className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={18} color="var(--primary-color)" /> Zone Availability</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {zoneData.map((zone) => (
                <div key={zone.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: zone.available > 0 ? '#22c55e' : '#ef4444' }}></div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{zone.name}</span>
                  </div>
                  <span style={{ fontWeight: '700', color: zone.available > 0 ? '#22c55e' : '#ef4444', fontSize: '0.95rem' }}>
                    {zone.available > 0 ? `${zone.available} Available` : 'Full'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Pie Chart */}
          <div className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} color="var(--primary-color)" /> Occupancy Breakdown</h3>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}: <strong style={{ color: 'var(--text-primary)' }}>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detection Image + QR */}
        <div style={{ display: 'grid', gridTemplateColumns: (fileType === 'image' && detectionResult?.image_data) || (fileType === 'video' && detectionResult?.results?.['Output Video URL']) ? '2fr 1fr' : '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {fileType === 'image' && detectionResult?.image_data && (
            <div className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>AI Detection Result</h3>
              <img src={detectionResult.image_data} alt="Detection" style={{ width: '100%', borderRadius: '12px', maxHeight: '400px', objectFit: 'contain' }} />
            </div>
          )}

          {fileType === 'video' && detectionResult?.results?.['Output Video URL'] && (
            <div className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1rem' }}>Processed Video Result</h3>
              <video src={detectionResult.results['Output Video URL']} controls style={{ width: '100%', borderRadius: '12px', maxHeight: '400px' }} />
            </div>
          )}

          <div className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><QrCode size={18} color="var(--primary-color)" /> Share Demo QR</h3>
            {!showQR ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Generate a QR code customers can scan to view live parking availability.</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button variant="primary" onClick={() => setShowQR(true)}>Generate QR Code</Button>
                  <Button variant="outline" onClick={openPreview}>View Preview</Button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'inline-block', background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                  <QRCodeSVG value={qrData} size={160} level="H" includeMargin={false} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Scan to see live parking info</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {zoneData.map(z => (
                    <div key={z.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                      <span>{z.name}</span>
                      <span style={{ color: z.available > 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>{z.available > 0 ? `${z.available} free` : 'Full'}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={openPreview}>View Preview</Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DemoDashboard;
