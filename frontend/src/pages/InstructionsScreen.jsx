import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/Button/Button';
import { UploadCloud, Cpu, LayoutDashboard, QrCode } from 'lucide-react';
import styles from './InstructionsScreen.module.css';

const InstructionsScreen = () => {
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: "Upload / Connect",
      description: "Upload parking image or connect CCTV camera.",
      icon: <UploadCloud size={24} />
    },
    {
      id: 2,
      title: "AI Detection",
      description: "Our AI detects vehicles and identifies occupied slots in real-time.",
      icon: <Cpu size={24} />
    },
    {
      id: 3,
      title: "Live Dashboard",
      description: "View real-time occupancy and analytics.",
      icon: <LayoutDashboard size={24} />
    },
    {
      id: 4,
      title: "QR Code Sharing",
      description: "Share QR code with users to check live parking status.",
      icon: <QrCode size={24} />
    }
  ];

  return (
    <div className={styles.container}>
      <Navbar />
      
      <div className={styles.content}>
        <h1 className={styles.title}>How Smart Parking Works</h1>
        <p className={styles.subtitle}>Simple steps to smarter parking management</p>
        
        <div className={styles.timelineContainer}>
          <div className={styles.timelineLine}></div>
          
          <div className={styles.stepsWrapper}>
            {steps.map((step) => (
              <div key={step.id} className={styles.stepItem}>
                <div className={styles.iconBox}>{step.icon}</div>
                <div className={styles.stepNumber}>{step.id}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actionContainer}>
          <Button variant="primary" onClick={() => navigate('/demo-upload')}>
            Try Demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstructionsScreen;
