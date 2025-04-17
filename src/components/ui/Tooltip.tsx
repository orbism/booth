// src/components/ui/Tooltip.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  width?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  width = '200px',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  // Position calculations
  const getPosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return {};
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = -tooltipRect.height - 8;
        left = (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'right':
        top = (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.width + 8;
        break;
      case 'bottom':
        top = triggerRect.height + 8;
        left = (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = (triggerRect.height - tooltipRect.height) / 2;
        left = -tooltipRect.width - 8;
        break;
    }
    
    return { top, left };
  };
  
  // Close tooltip on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current && 
        triggerRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div 
        className="cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-10 p-2 text-sm bg-gray-800 text-white rounded shadow-lg"
          style={{
            width,
            ...getPosition(),
          }}
        >
          {content}
          <div 
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              position === 'top' ? 'bottom-0 -mb-1 left-1/2 -translate-x-1/2' :
              position === 'right' ? 'left-0 -ml-1 top-1/2 -translate-y-1/2' :
              position === 'bottom' ? 'top-0 -mt-1 left-1/2 -translate-x-1/2' :
              'right-0 -mr-1 top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;