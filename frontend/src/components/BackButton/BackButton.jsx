import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ onClick, style = {} }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.75rem',
        height: '32px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: '600',
        transition: 'all 0.2s',
        marginBottom: '1rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        ...style
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
};

export default BackButton;
