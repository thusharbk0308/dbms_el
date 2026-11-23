import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div
        className={`${sizeClasses} border-[#171717] border-t-[#E9786D] animate-spin`}
      />
      {text && (
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#171717]">
          {text}
        </p>
      )}
    </div>
  );
};
