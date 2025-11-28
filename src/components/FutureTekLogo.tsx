  // components/FuturetekLogo.tsx
import React from 'react';

interface FuturetekLogoProps {
  width?: number;
  height?: number;
  showTagline?: boolean;
  className?: string;
}

export const FuturetekLogo: React.FC<FuturetekLogoProps> = ({ 
  width = 200, 
  height = 60,
  showTagline = true,
  className = ""
}) => {
  return (
    <svg 
      viewBox="0 0 200 60" 
      width={width} 
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Icon - Stylized Star/Celestial Symbol */}
      <g transform="translate(10, 10)">
        {/* Outer circle */}
        <circle cx="20" cy="20" r="18" fill="url(#logoGrad)" opacity="0.1"/>
        
        {/* Star points */}
        <path 
          d="M 20 5 L 22 15 L 32 12 L 25 20 L 35 25 L 25 28 L 28 38 L 20 30 L 12 38 L 15 28 L 5 25 L 15 20 L 8 12 L 18 15 Z" 
          fill="url(#logoGrad)" 
          opacity="0.9"
        />
        
        {/* Center circle */}
        <circle cx="20" cy="20" r="4" fill="#1E40AF"/>
        
        {/* Small accent dots (representing planets/stars) */}
        <circle cx="20" cy="11" r="1.5" fill="#3B82F6"/>
        <circle cx="29" cy="20" r="1.5" fill="#3B82F6"/>
        <circle cx="20" cy="29" r="1.5" fill="#3B82F6"/>
        <circle cx="11" cy="20" r="1.5" fill="#3B82F6"/>
      </g>
      
      {/* Company Name */}
      <text 
        x="55" 
        y="28" 
        fontFamily="Arial, sans-serif" 
        fontSize="20" 
        fontWeight="700" 
        fill="#1E293B"
      >
        Futuretek
      </text>
      
      {/* Tagline - Conditional */}
      {showTagline && (
        <text 
          x="55" 
          y="42" 
          fontFamily="Arial, sans-serif" 
          fontSize="8" 
          fontWeight="400" 
          fill="#64748B" 
          letterSpacing="0.5"
        >
          INSTITUTE OF ASTROLOGICAL SCIENCES
        </text>
      )}
    </svg>
  );
};