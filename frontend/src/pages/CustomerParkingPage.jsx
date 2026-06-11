import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

const CustomerParkingPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-tertiary)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Central Mall Parking</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Live occupancy updates</p>
      </div>

      <div className="glass-panel" style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '3rem 2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Spaces</h2>
        <div style={{ fontSize: '6rem', fontWeight: '900', color: '#22c55e', lineHeight: 1, marginBottom: '2rem' }}>50</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '16px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Ground Floor</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>10 Spots</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '16px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Level 1</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>20 Spots</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '16px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Level 2</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>20 Spots</span>
          </div>
        </div>
      </div>

      {/* Optional Map Area */}
      <div className="glass-panel" style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '2rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} /> Live Map</h3>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%' }}></div> Available</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }}></div> Occupied</span>
          </div>
        </div>
        
        <div style={{ height: '200px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Map View Placeholder
        </div>
      </div>

    </div>
  );
};

export default CustomerParkingPage;
