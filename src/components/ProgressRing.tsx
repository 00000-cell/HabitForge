import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number;
  color?: string;
  trackColor?: string;
}

export default function ProgressRing({
  radius,
  stroke,
  progress,
  color = '#8B5CF6', // primary
  trackColor = '#1F2937' // gray-800
}: ProgressRingProps) {
  const [offset, setOffset] = useState(0);
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  useEffect(() => {
    const progressOffset = circumference - (progress / 100) * circumference;
    setOffset(progressOffset);
  }, [progress, circumference]);

  return (
    <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
      <circle
        stroke={trackColor}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
}
