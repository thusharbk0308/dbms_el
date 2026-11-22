import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
  size = 'md',
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
      <div
        className={`${sizeClasses} border-slate-700 border-t-blue-500 rounded-full animate-spin`}
      />
      {text && <p className="text-xs font-medium text-slate-400">{text}</p>}
    </div>
  );
};
