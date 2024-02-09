import React from 'react';

export function SkeletonLoading({ width, height, borderRadius, animationDuration, className, style }) {
  const skeletonStyle = {
    width: width || '100%',
    height: height || '16px',
    borderRadius: borderRadius || '4px',
    animationDuration: animationDuration || '1.5s',
  };

  return (
    <div
      className={`bg-slate-300 animate-pulse ${className}`}
      style={style ?? skeletonStyle}
    />
  );
};

