import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPasswordScreen = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const emailRef = useRef();

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(emailRef.current.value);
      setMessage('Check your inbox for further instructions.');
    } catch (err) {
      setError('Failed to reset password. Please check your email address.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, paddingTop: '100px', paddingBottom: '3rem', paddingLeft: 'var(--spacing-xl)', paddingRight: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Reset Password 🔑</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>
            Enter your email and we'll send you a link to reset your password.
          </p>

          {error && (
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ background: '#f0fdf4', color: '#22c55e', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <CheckCircle size={18} />
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Input label="Email" type="email" ref={emailRef} required placeholder="Enter your email" />
            <Button variant="primary" type="submit" fullWidth disabled={loading} style={{ marginTop: '1.5rem' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span
                onClick={() => navigate('/login')}
                style={{ color: 'var(--primary-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <ArrowLeft size={16} /> Back to Login
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
