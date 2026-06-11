import React, { useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      return toast.error("Please fill all fields.");
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      toast.success("Message sent successfully!");
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, paddingTop: '100px', paddingBottom: '4rem', paddingLeft: 'var(--spacing-xl)', paddingRight: 'var(--spacing-xl)' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>Contact Us</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '4rem' }}>Have questions? We'd love to hear from you.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
            
            {/* Contact Details */}
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Get in touch</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', color: 'var(--primary-color)' }}>
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>Email</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>support@smartpark.com</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', color: 'var(--primary-color)' }}>
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>Phone</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>+1 (555) 123-4567</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '12px', color: 'var(--primary-color)' }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>Office Address</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>123 Innovation Drive<br/>Tech City, TC 90210<br/>United States</p>
                  </div>
                </div>
              </div>
              
              <h2 style={{ fontSize: '1.5rem', marginTop: '4rem', marginBottom: '1.5rem' }}>FAQ</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <details style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <summary style={{ fontWeight: '600', cursor: 'pointer' }}>Do I need special cameras?</summary>
                  <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>No, our system integrates with existing RTSP or IP cameras.</p>
                </details>
                <details style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <summary style={{ fontWeight: '600', cursor: 'pointer' }}>How accurate is the detection?</summary>
                  <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Our AI models achieve over 98% accuracy in varied lighting conditions.</p>
                </details>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Send a Message</h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Input label="Name" placeholder="Your name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <Input label="Email" type="email" placeholder="Your email address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginBottom: '0' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Message</label>
                  <textarea 
                    rows={5} 
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem', resize: 'vertical' }}
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  ></textarea>
                </div>

                <Button variant="primary" type="submit" icon={<Send size={18} />} fullWidth style={{ marginTop: '1rem' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
