import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  onClick, 
  type = 'button',
  className = '',
  icon,
  disabled = false,
  style
}) => {
  const baseClass = `${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''} ${className}`;
  
  return (
    <button type={type} className={baseClass} onClick={onClick} disabled={disabled} style={style}>
      {children}
      {icon && <span className={styles.icon}>{icon}</span>}
    </button>
  );
};

export default Button;
