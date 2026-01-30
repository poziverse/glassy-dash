import React, { useState, useRef, useId, cloneElement } from 'react';

/**
 * Tooltip Component
 * Simple tooltip that appears on hover/focus
 * 
 * @param {Object} props - Component props
 * @param {React.ReactElement} props.children - The wrapped element that triggers the tooltip
 * @param {string} props.text - The tooltip text content
 * @param {'top'|'bottom'|'left'|'right'} [props.position='top'] - Tooltip position relative to children
 * @returns {React.ReactElement} The tooltip component with wrapped children
 */
export function Tooltip({ children, text, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);
  const id = useId();

  // Clone children to add accessibility and focus handlers
  const trigger = cloneElement(children, {
    'aria-describedby': isVisible ? id : undefined,
    onFocus: (e) => {
      setIsVisible(true);
      if (children.props.onFocus) children.props.onFocus(e);
    },
    onBlur: (e) => {
      setIsVisible(false);
      if (children.props.onBlur) children.props.onBlur(e);
    },
  });

  return (
    <div 
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {trigger}
      {isVisible && (
        <div
          id={id}
          ref={tooltipRef}
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap transition-opacity duration-200 ${
            position === 'top' ? 'bottom-full mb-2' : 
            position === 'bottom' ? 'top-full mt-2' : 
            position === 'left' ? 'right-full mr-2' : 
            'left-full ml-2'
          }`}
          role="tooltip"
        >
          {text}
          <div 
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : 
              position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : 
              position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : 
              '-left-1 top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
}

export default Tooltip;