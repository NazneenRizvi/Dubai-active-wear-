import React, { useRef, useEffect } from 'react';
import { X, ShieldCheck, Zap, HeartHandshake, CheckCircle } from 'lucide-react';

interface BrandStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandStoryModal: React.FC<BrandStoryModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the modal content area
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-2xl rounded-none shadow-2xl border border-neutral-200 p-6 sm:p-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
              ABOUT FITNESS JUNKIES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-neutral-900 uppercase mt-1">
              ENGINEERED FOR THE COMMITTED.
            </h2>
          </div>

          <div className="text-xs sm:text-sm text-neutral-600 space-y-3 leading-relaxed">
            <p>
              Founded by athletes who grew exhausted of overpriced activewear that sheared when squatting, rolled down at the waist, and pilled after three washes.
            </p>
            <p>
              We re-engineered athletic wear from fiber level using Italian circular knitting machines. By eliminating side seams and incorporating graduated compression zones, our garments offer zero friction, absolute squat-proof coverage, and supreme breathability.
            </p>
          </div>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <Zap className="w-5 h-5 text-neutral-900 mb-2" />
              <h4 className="text-xs font-bold uppercase text-neutral-900">Zero-Seam Tech</h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Continuous tubular circular knit prevents skin chaffing during multi-hour training.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <ShieldCheck className="w-5 h-5 text-neutral-900 mb-2" />
              <h4 className="text-xs font-bold uppercase text-neutral-900">Squat-Proof Lab Tested</h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                High-density 280 GSM yarn ensures zero transparency under high-intensity gym lighting.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <HeartHandshake className="w-5 h-5 text-neutral-900 mb-2" />
              <h4 className="text-xs font-bold uppercase text-neutral-900">30-Day Guarantee</h4>
              <p className="text-[11px] text-neutral-500 mt-1">
                Train in it, wash it, test it. If you are not in love, return for a 100% refund.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase transition-colors"
          >
            BACK TO STORE
          </button>
        </div>
      </div>
    </div>
  );
};
