import React from 'react';

export interface SoccerBallProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export const SoccerBall: React.FC<SoccerBallProps> = ({
  className = 'w-4 h-4',
  size,
  width,
  height,
  ...props
}) => {
  const w = size || width || undefined;
  const h = size || height || undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={w}
      height={h}
      {...props}
    >
      {/* Outer Ball Perimeter */}
      <circle cx="12" cy="12" r="10" />
      
      {/* Center Classic Pentagon Patch */}
      <polygon
        points="12 7.8, 16 10.7, 14.5 15.3, 9.5 15.3, 8 10.7"
        fill="currentColor"
        fillOpacity="0.25"
      />
      
      {/* Seam Connections from Pentagon to Outer Ring */}
      <line x1="12" y1="7.8" x2="12" y2="2" />
      <line x1="16" y1="10.7" x2="21.5" y2="8.9" />
      <line x1="14.5" y1="15.3" x2="17.9" y2="20.3" />
      <line x1="9.5" y1="15.3" x2="6.1" y2="20.3" />
      <line x1="8" y1="10.7" x2="2.5" y2="8.9" />
    </svg>
  );
};

export default SoccerBall;
