import { useRef, useEffect, useState } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

export default function AccordionSection({
  icon: Icon,
  title,
  isComplete,
  isOpen,
  onToggle,
  children,
  id,
}) {
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(isOpen ? contentRef.current.scrollHeight + 32 : 0);
    }
  }, [isOpen, children]);

  // Recalculate height when content changes (e.g. conditional fields)
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const observer = new MutationObserver(() => {
        setMaxHeight(contentRef.current.scrollHeight + 32);
      });
      observer.observe(contentRef.current, { childList: true, subtree: true, attributes: true });
      return () => observer.disconnect();
    }
  }, [isOpen]);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 transition-colors duration-200 ${
        isOpen ? 'border-navy-200 shadow-md' : 'border-transparent'
      }`}
      id={id}
    >
      {/* Header */}
      <button
        className="accordion-header gap-3"
        onClick={onToggle}
        aria-expanded={isOpen}
        id={`${id}-toggle`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
              isComplete
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-navy-100 text-navy-600'
            }`}
          >
            <Icon size={20} />
          </div>
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isComplete && (
            <CheckCircle2
              size={22}
              className="text-emerald-500 animate-check-pop"
            />
          )}
          <ChevronDown
            size={20}
            className={`text-gray-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Content */}
      <div
        className="accordion-content"
        style={{
          maxHeight: `${maxHeight}px`,
          opacity: isOpen ? 1 : 0,
          padding: isOpen ? '0 1rem 1rem' : '0 1rem 0',
        }}
      >
        <div ref={contentRef} className="space-y-4 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
