import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../Button/Button';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleFeaturesClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // Already on landing page — just scroll
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to landing page then scroll after a tick
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById('features');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        <div className={styles.logoIcon}>P</div>
        Smart<span className="text-gradient">Park</span>
      </Link>
      
      <div className={styles.navLinks}>
        <a href="#features" onClick={handleFeaturesClick}>Features</a>
        <Link to="/how-it-works">Working</Link>
        <Link to="/contact">Contact</Link>
      </div>

      <div className={styles.actions}>
        <Link to="/login" className={styles.loginBtn}>Login</Link>
        <Link to="/signup">
          <Button variant="primary">Sign Up</Button>
        </Link>
        
        <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle Theme">
          <span className={`${styles.toggleIcon} ${styles.sun} ${!isDarkMode ? styles.activeToggle : ''}`}>
            <Sun size={14} />
          </span>
          <span className={`${styles.toggleIcon} ${styles.moon} ${isDarkMode ? styles.activeToggle : ''}`}>
            <Moon size={14} />
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
