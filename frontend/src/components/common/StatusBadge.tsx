import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-[#F8F6F2] text-[#171717]';

  if (normalized === 'CONFIRMED' || normalized === 'ACTIVE' || normalized === 'RESOLVED' || normalized === 'EXACT_MATCH') {
    // Teal tone for verified/confirmed
    colorClasses = 'bg-[#55AAA7] text-[#171717]';
  } else if (normalized === 'PENDING' || normalized === 'UNDER_REVIEW') {
    // Blue tone for in-flight/pending
    colorClasses = 'bg-[#82A9D4] text-[#171717]';
  } else if (normalized === 'FAILED' || normalized === 'REJECTED' || normalized === 'REVOKED' || normalized === 'BLOCKCHAIN_VERIFICATION_FAILED') {
    // Coral tone for rejected/failed/revoked
    colorClasses = 'bg-[#E9786D] text-[#171717]';
  } else if (normalized === 'EXPIRED' || normalized === 'NOT_REGISTERED') {
    colorClasses = 'bg-[#E5E0D8] text-[#171717]';
  }

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-wider uppercase border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] ${colorClasses} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 bg-[#171717]" />
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
