import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import { Activity, Target } from 'lucide-react';

const AICalibrationScreen = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 5;
      });
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '100px var(--spacing-xl)', textAlign: 'center' }}>
      <Navbar />
      <div className="container" style={{ maxWidth: '800px', marginTop: '60px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>AI Calibration & Test</h1>
        
        <div className="glass-panel" style={{ padding: '3rem', borderRadius: '20px' }}>
          {progress < 100 ? (
            <div>
              <Activity size={48} color="var(--primary-color)" style={{ marginBottom: '2rem', animation: 'pulse 2s infinite' }} />
              <h3>Running Test Detection...</h3>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginTop: '2rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient-primary)', transition: 'width 0.2s' }}></div>
              </div>
            </div>
          ) : (
            <div>
              <Target size={48} color="#22c55e" style={{ marginBottom: '2rem' }} />
              <h3 style={{ marginBottom: '2rem' }}>Calibration Complete</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>14</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Detected Vehicles</div>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>96%</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Detection Accuracy</div>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>98%</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Slot Mapping Accuracy</div>
                </div>
              </div>

              <Button variant="primary" onClick={() => navigate('/qr-generation')} style={{ padding: '1rem 3rem' }}>
                Deploy System
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICalibrationScreen;
