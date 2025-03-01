import React from 'react';

interface WindowsLogoProps {
  className?: string;
}

export const WindowsLogo: React.FC<WindowsLogoProps> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 5.1L10.5 4v7H3V5.1z" />
      <path d="M10.5 13H3v6.9l7.5-1.1V13z" />
      <path d="M21 3l-9 1.3v6.7h9V3z" />
      <path d="M12 13v6.9l9 1.3V13H12z" />
    </svg>
  );
}; 