import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="glass-overlay animate-fade-in"
      onClick={onClose}
      id="modal-overlay"
    >
      <div
        className="glass-card w-full max-w-md mx-4 sm:mx-auto rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up safe-bottom"
        onClick={(e) => e.stopPropagation()}
        id="modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            aria-label="Chiudi"
            id="btn-modal-close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
