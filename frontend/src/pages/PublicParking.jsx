import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, MapPin, TrendingUp, RefreshCw, Camera } from 'lucide-react';
import Navbar from '../components/Navbar/Navbar';
import BackButton from '../components/BackButton/BackButton';

const PublicParking = () => {
  const { mallId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [facilityName, setFacilityName] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Fetch camera/facility info to get the real name
  const fetchFacilityInfo = async () => {
    if (mallId === 'demo') {
      setFacilityName('Demo Parking');
      return;
    }
    try {
      const ts = Date.now();
      const res = await fetch(`/api/cameras/status?user_id=${mallId}&t=${ts}`);
      if (res.ok) {
        const data = await res.json();
        const cameras = Object.values(data);
        if (cameras.length > 0) {
          // Use the first camera's location as facility name, or aggregate
          const firstCam = cameras[0];
          const locations = [...new Set(cameras.map(c => c.location).filter(Boolean))];
          if (locations.length === 1) {
            setFacilityName(locations[0]);
          } else if (locations.length > 1) {
            setFacilityName(locations.join(' / '));
          } else if (firstCam.name) {
            setFacilityName(firstCam.name);
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch facility info:', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    if (mallId === 'demo') {
      try {
        const stored = localStorage.getItem('latestDemoResult');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.statistics) {
            setStats({ ...data.statistics, zones: [data.statistics] });
          } else {
            setStats(null);
          }
        } else {
          setStats(null);
        }
        setLastUpdated(new Date());
      } catch (e) {
        console.error('Failed to parse demo data', e);
        setStats(null);
      }
      setLoading(false);
      return;
    }

    try {
      // mallId = the facility owner's Firebase UID, use it to fetch their cameras only
      const ts = Date.now();
      const res = await fetch(`/api/parking/statistics?user_id=${mallId}&t=${ts}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data !== null) {
          setStats(data);
        } else {
          setStats(null);
        }
        setLastUpdated(new Date());
      } else {
        setStats(null);
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
      setStats(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFacilityInfo();
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [mallId]);

  const total = parseInt(stats?.['Total Slots']) || 0;
  const occupied = parseInt(stats?.['Occupied']) || 0;
  const available = parseInt(stats?.['Available']) || 0;
  const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const mode = stats?.['Mode'] || 'Estimated Capacity Mode';

  const zoneData = stats?.zones || [];

  const statusColor = available > 2 ? '#22c55e' : available > 0 ? '#f59e0b' : '#ef4444';
  const statusLabel = available > 2 ? 'OPEN' : available > 0 ? 'LIMITED' : 'FULL';

  // Build a friendly display name: facility name > stats location > fallback
  const displayName = facilityName
    || stats?.location
    || (mallId === 'demo' ? 'Demo Parking' : 'Smart Parking Facility');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ padding: '100px 1.5rem 3rem', maxWidth: '640px', margin: '0 auto' }}>

        {/* Header */}
        <BackButton onClick={() => navigate('/')} />
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <MapPin size={20} color="var(--primary-color)" />
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
              {displayName.toUpperCase()} PARKING
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Live Parking Availability</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {!stats || zoneData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <Camera size={48} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>No occupancy data available.</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {mallId === 'demo'
                ? 'Please upload a demo image/video first.'
                : 'Live parking statistics are not currently available for this facility.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {zoneData.map((zone, idx) => {
              const zTotal = parseInt(zone['Total Slots'] || zone.total || 0);
              const zOccupied = parseInt(zone.Occupied || zone.occupied || 0);
              const zAvailable = Math.max(zTotal - zOccupied, 0);
              const zPct = zTotal > 0 ? Math.round((zOccupied / zTotal) * 100) : 0;
              const zStatusColor = zAvailable > 2 ? '#22c55e' : zAvailable > 0 ? '#f59e0b' : '#ef4444';
              const zStatusLabel = zAvailable > 2 ? 'OPEN' : zAvailable > 0 ? 'LIMITED' : 'FULL';
              const zMode = zone.Mode || 'Estimated Capacity Mode';
              const zName = zone.name || zMode || `Location ${idx + 1}`;
              const zLocation = zone.location || facilityName || 'Main Facility';

              return (
                <div key={idx} className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center', border: `2px solid ${zStatusColor}33` }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {zName}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} /> {zLocation}
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                    {zMode === 'Estimated Capacity Mode' || zMode === 'Estimated Capacity' ? 'Estimated Available' : 'Available Now'}
                  </div>
                  <div style={{ fontSize: '5rem', fontWeight: '900', color: zStatusColor, lineHeight: 1, marginBottom: '0.5rem' }}>{zAvailable}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    out of {zMode === 'Estimated Capacity Mode' || zMode === 'Estimated Capacity' ? 'estimated ' : ''}{zTotal} total spaces
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ef4444' }}>{zOccupied}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Occupied</div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: '700', color: zStatusColor }}>{zPct}%</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full</div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: '700', color: zStatusColor }}>{zStatusLabel}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</div>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div style={{ width: '100%', height: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${zPct}%`, height: '100%', background: zStatusColor, borderRadius: '6px', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicParking;
