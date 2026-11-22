import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
      <div className="p-4 bg-slate-800/60 rounded-2xl mb-4 text-slate-400">
        {icon || <FolderOpen className="w-8 h-8 text-slate-400" />}
      </div>
      <h4 className="text-base font-semibold text-slate-200 mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
