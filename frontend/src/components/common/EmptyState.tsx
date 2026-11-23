import React from 'react';
import { LucideIcon, FolderGit2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderGit2,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="bg-[#FFFFFF] border-2 border-dashed border-[#171717] p-8 sm:p-12 text-center shadow-[4px_4px_0px_#171717] my-4">
      <div className="w-14 h-14 bg-[#F8F6F2] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center justify-center mx-auto text-[#171717] mb-4">
        <Icon className="w-6 h-6 text-[#E9786D]" />
      </div>
      <h3 className="text-base font-extrabold uppercase tracking-wider text-[#171717] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#666666] max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[#191B20] hover:bg-[#171717] text-white border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-xs font-bold uppercase tracking-wider"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
