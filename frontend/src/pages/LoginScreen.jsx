import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const emailRef = useRef();
  const passwordRef = useRef();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Failed to sign in');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, paddingTop: '100px', paddingBottom: '3rem', paddingLeft: 'var(--spacing-xl)', paddingRight: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Welcome back 🚘</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>Login to your account.</p>
          
          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Input label="Email" type="email" ref={emailRef} required placeholder="Enter your email" />
            <Input label="Password" type="password" ref={passwordRef} required placeholder="Enter your password" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', marginBottom: '1rem' }}>
              <span 
                onClick={() => navigate('/forgot-password')} 
                style={{ color: 'var(--primary-color)', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Forgot Password?
              </span>
            </div>

            <Button variant="primary" type="submit" fullWidth disabled={loading}>
              Sign In
            </Button>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Don't have an account? <span onClick={() => navigate('/signup')} style={{ color: 'var(--primary-color)', cursor: 'pointer' }}>Sign up</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
