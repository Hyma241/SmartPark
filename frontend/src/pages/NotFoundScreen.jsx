import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';

const NotFoundScreen = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '1rem', lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Oops! The page you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Go Back Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundScreen;
