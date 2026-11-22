import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (normalized === 'CONFIRMED' || normalized === 'ACTIVE' || normalized === 'RESOLVED' || normalized === 'EXACT_MATCH') {
    colorClasses = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
  } else if (normalized === 'PENDING' || normalized === 'UNDER_REVIEW') {
    colorClasses = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
  } else if (normalized === 'FAILED' || normalized === 'REJECTED' || normalized === 'REVOKED' || normalized === 'BLOCKCHAIN_VERIFICATION_FAILED') {
    colorClasses = 'bg-rose-950/70 text-rose-300 border-rose-800/80';
  } else if (normalized === 'EXPIRED' || normalized === 'NOT_REGISTERED') {
    colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700';
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${colorClasses} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
