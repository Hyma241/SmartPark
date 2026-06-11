import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download, ExternalLink, Copy, MapPin } from 'lucide-react';
import Button from '../components/Button/Button';
import { useAuth } from '../contexts/AuthContext';
import styles from './QRCodeGenerationScreen.module.css';

const QRCodeGenerationScreen = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const publicMallId = currentUser ? currentUser.uid : 'demo-mall';
  const publicUrl = `${window.location.origin}/parking/${publicMallId}`;

  const getFriendlyFilename = () => {
    const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'SmartPark';
    const safe = name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safe}_qr.png`;
  };

  const handleDownload = () => {
    const wrapper = document.getElementById('qr-code-wrapper');
    const svg = wrapper ? wrapper.querySelector('svg') : null;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = getFriendlyFilename();
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => alert('Link copied to clipboard!'));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customer QR Code</h1>
          <p className={styles.subtitle}>Generate and share your public parking availability page</p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.qrSection}>
          <div className={styles.qrCard}>
            <div className={styles.qrWrapper} id="qr-code-wrapper">
              <QRCodeSVG
                value={publicUrl}
                size={250}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>
            <h3 className={styles.mallName}>{currentUser?.displayName || 'Your Parking Facility'}</h3>
            <p className={styles.scanText}>Scan to check live parking availability</p>
          </div>
          <div className={styles.actions}>
            <Button variant="primary" icon={<Download size={18} />} onClick={handleDownload} fullWidth>
              Download QR Code (PNG)
            </Button>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Public Link</h3>
            <p className={styles.infoDesc}>Share this link directly with your customers.</p>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>{publicUrl}</span>
              <button className={styles.iconBtn} onClick={handleCopyLink} title="Copy Link">
                <Copy size={18} />
              </button>
            </div>
            <Button variant="outline" icon={<ExternalLink size={18} />} onClick={() => window.open(publicUrl, '_blank')} fullWidth>
              Preview Public Page
            </Button>
          </div>

          {/* What customers see */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="var(--primary-color)" /> What Customers See After Scanning
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.75rem' }}>
              {[
                { icon: '📊', text: 'Overall occupancy percentage' },
                { icon: '🟢', text: 'Total available & occupied slots' },
                { icon: '📍', text: 'Live updates tailored to your layout' }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>{item.icon}</span><span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>How it works</h3>
            <ul className={styles.stepsList}>
              <li><div className={styles.stepNum}>1</div><div>Download and print the QR code</div></li>
              <li><div className={styles.stepNum}>2</div><div>Place it at the entrance of your parking facility</div></li>
              <li><div className={styles.stepNum}>3</div><div>Customers scan it to see live parking availability</div></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerationScreen;
