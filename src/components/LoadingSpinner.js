import React, { memo } from 'react';

// Size and color mapping for cleaner code
const SIZE_MAP = {
  small: 'w-4 h-4 border-2',
  medium: 'w-8 h-8 border-3',
  large: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
};

const COLOR_MAP = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  white: 'border-white',
  gray: 'border-gray-300',
  success: 'border-success',
  warning: 'border-warning',
  danger: 'border-danger',
};

// Using memo to prevent unnecessary re-renders
const LoadingSpinner = memo(({ 
  size = 'medium', 
  color = 'primary', 
  fullscreen = false,
  text = '',
  className = '',
}) => {
  // Get size and color classes, with fallbacks
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.medium;
  const colorClass = COLOR_MAP[color] || COLOR_MAP.primary;
  
  // For fullscreen overlay
  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <div className="flex flex-col items-center">
          <div 
            className={`spinner ${sizeClass} ${colorClass} ${className}`}
            aria-label="Loading"
          ></div>
          {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }
  
  // Standard spinner
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div 
          className={`spinner ${sizeClass} ${colorClass} ${className}`}
          aria-label="Loading"
          role="status"
        ></div>
        {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
      </div>
    </div>
  );
});

// Add displayName for debugging
LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;