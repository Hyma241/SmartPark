import React, { useState, useEffect } from 'react';
import { Car, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '../components/BackButton/BackButton';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // We have removed hardcoded weeklyData as requested.
  const [realHistory, setRealHistory] = useState([]);

  useEffect(() => {
    const fetchFromAPI = async () => {
      try {
        const [resStats, resVehicles] = await Promise.all([
          fetch(currentUser ? `/api/parking/statistics?user_id=${currentUser.uid}` : '/api/parking/statistics'),
          fetch(currentUser ? `/api/vehicles/count?user_id=${currentUser.uid}` : '/api/vehicles/count'),
        ]);
        if (resStats.ok) {
          const data = await resStats.json();
          // ALWAYS update state, even if null. We do not fallback to old demo firestore data.
          setStats(data);
        } else {
          setStats(null);
        }
        if (resVehicles.ok) {
          const vData = await resVehicles.json();
          setVehicles(vData);
        } else {
          setVehicles(null);
        }
        setLoaded(true);
      } catch (e) {
        // Backend not available
        setStats(null);
        setVehicles(null);
        setLoaded(true);
      }
    };

    fetchFromAPI();
    const interval = setInterval(fetchFromAPI, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const displayVal = (v) => (loaded ? v : '--');
  
  const isEstimated = stats && stats.Mode === 'Estimated Capacity Mode';

  // For zero-state
  const safeStats = stats || {
    'Total Slots': 0,
    Occupied: 0,
    Available: 0,
    'Occupancy Rate': '0%',
  };
  
  const safeVehicles = vehicles || { total: 0, cars: 0, motorcycles: 0 };

  return (
    <div>
      <BackButton />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Overview Dashboard</h1>
          {isEstimated && (
             <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' }}>
               Estimated Capacity Mode
             </span>
          )}
        </div>
      </div>

      {!stats && loaded && (
        <div style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', color: '#ef4444' }}>
          <AlertCircle size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>No camera connected</h3>
            <p style={{ margin: '0.25rem 0 0 0', opacity: 0.9 }}>Add a camera in CCTV Integration to start monitoring.</p>
          </div>
        </div>
      )}

      {/* Live Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem' }}>
            {isEstimated ? 'Estimated Capacity' : 'Total Slots'}
          </h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{displayVal(safeStats['Total Slots'])}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem' }}>Occupied</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{displayVal(safeStats.Occupied)}</div>
          <div style={{ fontSize: '0.9rem', color: '#ef4444', marginTop: '0.5rem' }}>Rate: {displayVal(safeStats['Occupancy Rate'])}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem' }}>Available</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e' }}>{displayVal(safeStats.Available)}</div>
          <div style={{ fontSize: '0.9rem', color: '#22c55e', marginTop: '0.5rem' }}>Live updates active</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Car size={16}/> Total Vehicles</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{displayVal(safeVehicles.total)}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Cars: {safeVehicles.cars} | Moto: {safeVehicles.motorcycles}</div>
        </div>
      </div>

      {/* Charts area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '2rem' }}>Weekly Occupancy</h3>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {realHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="uv" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                  </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No Data Available Yet</div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '2rem' }}>Peak Hours</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No Data Available Yet</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
