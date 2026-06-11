import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { useAuth } from '../contexts/AuthContext';

const RegistrationScreen = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(
        emailRef.current.value, 
        passwordRef.current.value,
        nameRef.current.value,
        "" // No organization initially
      );
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to create an account: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, paddingTop: '100px', paddingBottom: '3rem', paddingLeft: 'var(--spacing-xl)', paddingRight: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'left' }}>Create your account</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'left' }}>Start managing your parking easily and efficiently.</p>
          
          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Input label="Full Name" type="text" ref={nameRef} required placeholder="Enter your name" />
            <Input label="Email" type="email" ref={emailRef} required placeholder="Enter your email" />
            <Input label="Password" type="password" ref={passwordRef} required placeholder="••••••••" />
            <Input label="Confirm Password" type="password" ref={confirmPasswordRef} required placeholder="••••••••" />
            
            <Button variant="primary" type="submit" fullWidth style={{ marginTop: '1.5rem' }} disabled={loading}>
              Sign Up
            </Button>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--primary-color)', cursor: 'pointer' }}>Login</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationScreen;
