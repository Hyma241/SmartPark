import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import BackButton from '../components/BackButton/BackButton';
import styles from './DemoResultsScreen.module.css';

const DemoResultsScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const detectionResult = location.state?.result;
  const fileType = location.state?.type || (detectionResult?.results ? 'video' : 'image');

  useEffect(() => {
    if (!detectionResult) {
      navigate('/demo-upload');
    }
  }, [detectionResult, navigate]);

  // Always go to Demo Dashboard — no login required
  const handleViewDashboard = () => {
    navigate('/demo-dashboard', { state: { result: detectionResult, type: fileType } });
  };

  const handleDownloadVideo = () => {
      if (detectionResult?.results?.['Output Video URL']) {
          window.location.href = detectionResult.results['Output Video URL'];
      }
  };

  if (!detectionResult) return null;

  // Unified stats from detectionResult.statistics for BOTH image and video
  const stats = detectionResult.statistics || {};
  const vehicles = detectionResult.vehicles || {};
  const total = parseInt(stats['Total Slots']) || 0;
  const available = parseInt(stats['Available']) || 0;
  const occupied = parseInt(stats['Occupied']) || 0;
  const occRate = stats['Occupancy Rate'] || '0%';
  const totalVehicles = vehicles.total || 0;

  // Video-specific stats from detectionResult.results
  const videoResults = detectionResult.results || {};

  return (
    <div className={styles.container}>
      <Navbar />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <BackButton />
          <h1 className={styles.title}>Detection Results</h1>
        </div>

        {/* Unified stats grid for both image and video */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Slots</div>
            <div className={styles.statValue}>{total}</div>
            {stats['Mode'] && <div className={styles.statSubtext}>{stats['Mode']}</div>}
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Occupied</div>
            <div className={`${styles.statValue} ${styles.danger}`}>{occupied}</div>
            <div className={styles.statSubtext}>{occRate}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Available</div>
            <div className={`${styles.statValue} ${styles.success}`}>{available}</div>
            <div className={styles.statSubtext}>
              {total > 0 ? ((available / total) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Vehicles Detected</div>
            <div className={`${styles.statValue} ${styles.primary}`}>{totalVehicles}</div>
            <div className={styles.statSubtext}>Cars: {vehicles.cars ?? 0} | Bikes: {vehicles.motorcycles ?? 0}</div>
          </div>
        </div>

        {/* Video-specific stats row */}
        {fileType === 'video' && (
          <div className={styles.statsGrid} style={{ marginTop: '1rem' }}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Peak Occupancy</div>
              <div className={`${styles.statValue} ${styles.danger}`}>{videoResults['Peak Occupancy'] || 0}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Average Occupancy</div>
              <div className={`${styles.statValue} ${styles.primary}`}>{videoResults['Average Occupancy'] || 0}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Frames</div>
              <div className={styles.statValue}>{videoResults['Total Frames Processed'] || 0}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Vehicles Detected</div>
              <div className={styles.statValue}>{videoResults['Total Vehicles Detected'] || 0}</div>
            </div>
          </div>
        )}

        {fileType === 'image' && detectionResult.image_data && (
          <div className={styles.imageContainer}>
            <img src={detectionResult.image_data} alt="AI Detection Result" className={styles.resultImage} />
          </div>
        )}

        {fileType === 'video' && detectionResult.results?.['Output Video URL'] && (
          <div className={styles.imageContainer} style={{ textAlign: 'center', padding: '2rem' }}>
            <video src={detectionResult.results['Output Video URL']} controls className={styles.resultImage} style={{ width: '100%', maxHeight: '500px', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
          </div>
        )}

        {/* CTA to dashboard */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => navigate('/demo-upload')}>Upload Another</Button>
          {fileType === 'video' && (
              <Button variant="secondary" onClick={handleDownloadVideo}>Download Processed Video</Button>
          )}
          <Button variant="primary" onClick={handleViewDashboard}>Continue to Demo Dashboard →</Button>
        </div>
      </div>
    </div>
  );
};

export default DemoResultsScreen;
