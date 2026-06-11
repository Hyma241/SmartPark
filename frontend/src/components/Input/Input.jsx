import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';

const Input = forwardRef(({ label, error, className = '', type = 'text', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`${styles.inputWrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputInner}>
        <input 
          ref={ref}
          type={inputType}
          className={`${styles.input} ${error ? styles.error : ''} ${isPassword ? styles.inputWithIcon : ''}`} 
          {...props} 
        />
        {isPassword && (
          <button 
            type="button" 
            className={styles.eyeButton} 
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
