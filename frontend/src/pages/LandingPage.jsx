import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import styles from './LandingPage.module.css';

const features = [
  {
    title: "Accurate Detection",
    desc: "Advanced AI models ensure high accuracy in detecting vehicles in real-time.",
    iconBg: "featureIconPurplePink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={styles.featureIconSvg} stroke="url(#g1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path d="M4 8V6a2 2 0 0 1 2-2h2" />
        <path d="M16 4h2a2 2 0 0 1 2 2v2" />
        <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
        <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "Smart Analytics",
    desc: "Get real-time insights and analytics to make better data-driven decisions.",
    iconBg: "featureIconIndigoPurple",
    icon: (
      <svg viewBox="0 0 24 24" fill="url(#g2)" className={styles.featureIconSvg}>
        <defs>
          <linearGradient id="g2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect x="3" y="13" width="4" height="8" rx="1" />
        <rect x="10" y="8" width="4" height="13" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </svg>
    ),
  },
  {
    title: "Secure & Reliable",
    desc: "Enterprise-grade security to keep your data safe and systems reliable.",
    iconBg: "featureIconPurplePink2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="url(#g3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.featureIconSvg}>
        <defs>
          <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" fill="url(#g3)" fillOpacity="0.15" />
        <rect x="9" y="11" width="6" height="6" rx="1" />
        <path d="M10 11V9a2 2 0 1 1 4 0v2" />
      </svg>
    ),
  },
  {
    title: "Real-Time Monitoring",
    desc: "Monitor parking spaces in real-time and stay always in control.",
    iconBg: "featureIconBlueIndigo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="url(#g4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.featureIconSvg}>
        <defs>
          <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.landingPage}>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroImageWrapper}>
          <img
            src="/parking-hero.jpg"
            alt="Smart parking garage"
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay} />
        </div>

        {/* EXIT badges */}
        <div className={styles.exitBadgePrimary}>
          EXIT <span>→</span>
        </div>
        <div className={styles.exitBadgeSecondary}>
          EXIT <span>↑</span>
        </div>

        {/* Stand labels */}
        <div className={`${styles.standLabel} ${styles.standA}`}>
          <span className={styles.standText}>Stand</span>
          <span className={styles.standLetter}>A</span>
        </div>
        <div className={`${styles.standLabel} ${styles.standB}`}>
          <span className={styles.standTextSm}>Stand</span>
          <span className={styles.standLetterSm}>B</span>
        </div>
        <div className={`${styles.standLabel} ${styles.standC}`}>
          <span className={styles.standText}>Stand</span>
          <span className={styles.standLetter}>C</span>
        </div>

        {/* Dot pattern decoration */}
        <div className={styles.dotPattern}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => (
                <circle key={`${r}-${c}`} cx={c * 15 + 5} cy={r * 15 + 5} r={1.5} fill="#8b5cf6" />
              ))
            )}
          </svg>
        </div>

        {/* Hero Content */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Smart Parking
          </h1>
          <h1 className={`${styles.heroTitle} ${styles.heroTitleGradient}`}>
            Detection System
          </h1>
          <p className={styles.heroSubtitle}>
            Monitor parking spaces in real-time, detect occupancy instantly, and optimize parking management.
          </p>
          <div className={styles.heroActions}>
            <button
              className={styles.ctaButton}
              onClick={() => navigate('/signup')}
            >
              Get Started
              <span className={styles.ctaArrow}>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <div className={styles.featuresTitleWrapper}>
            <h2 className={styles.featuresTitle}>Why Choose Smart Parking?</h2>
            <div className={styles.featuresTitleBar} />
          </div>

          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={`${styles.featureIconWrap} ${styles[f.iconBg]}`}>
                  {f.icon}
                </div>
                <h3 className={styles.featureCardTitle}>{f.title}</h3>
                <div className={styles.featureCardBar} />
                <p className={styles.featureCardDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <div className={styles.footerLogoIcon}>P</div>
            <span className={styles.footerLogoText}>
              Smart<span className="text-gradient">Park</span>
            </span>
          </div>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} SmartPark. All rights reserved.</p>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Privacy</a>
            <a href="#" className={styles.footerLink}>Terms</a>
            <a href="/contact" className={styles.footerLink}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
