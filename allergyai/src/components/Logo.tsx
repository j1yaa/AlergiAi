import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface LogoProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function Logo({ width = 40, height = 100, color = '#D32F2F' }: LogoProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 500" fill="none">
      <Path 
        d="M40 80V220C40 250 60 270 85 275V430H115V275C140 270 160 250 160 220V80" 
        stroke={color} 
        strokeWidth="20" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Line x1="80" y1="80" x2="80" y2="230" stroke={color} strokeWidth="20" strokeLinecap="round"/>
      <Line x1="120" y1="80" x2="120" y2="230" stroke={color} strokeWidth="20" strokeLinecap="round"/>
      <Circle cx="100" cy="470" r="18" fill={color}/>
      <Path 
        d="M85 270C60 265 40 245 40 220V80H60V220C60 235 75 250 100 250C125 250 140 235 140 220V80H160V220C160 245 140 265 115 270V435H85V270Z" 
        fill={color}
      />
    </Svg>
  );
}
