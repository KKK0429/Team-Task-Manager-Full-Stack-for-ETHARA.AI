// src/components/UI.js
// Small reusable UI components used throughout the app
import React from 'react';

// ==================== BUTTON ====================
export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, style, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    border: 'none', borderRadius: '8px', fontFamily: 'var(--font)',
    fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '14px 28px' : '10px 18px',
    fontSize: size === 'sm' ? '0.82rem' : '0.92rem',
  };

  const variants = {
    primary: { background: 'var(--primary)', color: 'white' },
    ghost: { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' },
    danger: { background: 'rgba(248,113,113,0.12)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.25)' },
    success: { background: 'rgba(74,222,128,0.12)', color: 'var(--success)', border: '1px solid rgba(74,222,128,0.25)' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.target.style.filter = 'brightness(1.1)'; }}
      onMouseLeave={e => { e.target.style.filter = 'none'; }}
    >
      {children}
    </button>
  );
}

// ==================== INPUT ====================
export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>}
      <input
        style={{
          background: 'var(--surface2)', border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: '8px', padding: '11px 14px', color: 'var(--text)', fontSize: '0.92rem', outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'}
        {...props}
      />
      {error && <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

// ==================== SELECT ====================
export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>}
      <select
        style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '11px 14px', color: 'var(--text)', fontSize: '0.92rem',
          outline: 'none', cursor: 'pointer',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ==================== TEXTAREA ====================
export function Textarea({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>}
      <textarea
        style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '11px 14px', color: 'var(--text)', fontSize: '0.92rem',
          outline: 'none', resize: 'vertical', minHeight: '80px', fontFamily: 'var(--font)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
        {...props}
      />
    </div>
  );
}

// ==================== CARD ====================
export function Card({ children, style, onClick, hoverable }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)', border: `1px solid ${hovered && hoverable ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)', padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        transform: hovered && hoverable ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && hoverable ? '0 8px 32px #00000050' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ==================== MODAL ====================
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div className="scale-in" style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px',
        display: 'flex', flexDirection: 'column', gap: '18px',
        animation: 'scaleIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ==================== BADGE ====================
export function Badge({ children, color = 'primary' }) {
  const colors = {
    primary: { bg: 'var(--primary-dim)', text: 'var(--primary)' },
    success: { bg: 'rgba(74,222,128,0.12)', text: 'var(--success)' },
    warning: { bg: 'rgba(251,191,36,0.12)', text: 'var(--warning)' },
    danger: { bg: 'rgba(248,113,113,0.12)', text: 'var(--danger)' },
    blue: { bg: 'rgba(96,165,250,0.12)', text: 'var(--todo)' },
  };
  const c = colors[color] || colors.primary;
  return (
    <span style={{
      background: c.bg, color: c.text, padding: '3px 10px',
      borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
      letterSpacing: '0.02em', display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

// ==================== SPINNER ====================
export function Spinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid var(--border)',
      borderTopColor: 'var(--primary)',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// ==================== EMPTY STATE ====================
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '6px' }}>{title}</div>
      {subtitle && <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{subtitle}</div>}
    </div>
  );
}

// Add spin keyframe globally
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
