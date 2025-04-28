import React from 'react';

function LoadingSpinner({ size = 'medium', color = 'primary' }) {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4 border-2';
      case 'medium':
        return 'w-8 h-8 border-3';
      case 'large':
        return 'w-12 h-12 border-4';
      default:
        return 'w-8 h-8 border-3';
    }
  };
  
  const getColor = () => {
    switch (color) {
      case 'primary':
        return 'border-primary';
      case 'white':
        return 'border-white';
      case 'gray':
        return 'border-gray-300';
      default:
        return 'border-primary';
    }
  };
  
  return (
    <div className="flex items-center justify-center">
      <div 
        className={`spinner ${getSize()} ${getColor()}`}
        aria-label="Loading"
      ></div>
    </div>
  );
}

export default LoadingSpinner;