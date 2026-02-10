import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ toast, onClose, durationMs = 2500 }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onClose?.(), durationMs);
    return () => clearTimeout(t);
  }, [toast, onClose, durationMs]);

  if (!toast) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className={`toast toast-${toast.type || 'info'}`}>
        <div className="toast-content">
          <div className="toast-title">{toast.title || (toast.type === 'error' ? 'Action failed' : 'Done')}</div>
          <div className="toast-message">{toast.message}</div>
        </div>
        <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">×</button>
      </div>
    </div>
  );
}

