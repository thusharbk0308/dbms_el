import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface LegalDisclaimerProps {
  variant?: 'banner' | 'card' | 'inline';
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ variant = 'banner' }) => {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-xs text-[#171717] bg-[#FFFFFF] p-2.5 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
        <Info className="w-4 h-4 text-[#82A9D4] flex-shrink-0" />
        <span className="font-medium">Cryptographic verification anchors SHA-256 integrity and on-chain timestamp, not legal ownership.</span>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#171717] border-l-8 border-l-[#E9786D] shadow-[4px_4px_0px_#171717] p-5 flex items-start gap-3.5 text-xs text-[#171717]">
      <div className="w-8 h-8 bg-[#E9786D] border-2 border-[#171717] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#171717]">
        <AlertTriangle className="w-4 h-4 text-[#171717]" />
      </div>
      <div className="space-y-1">
        <p className="font-extrabold text-[#171717] uppercase tracking-wider text-xs flex items-center gap-1.5">
          Legal Distinction & Intellectual Property Disclaimer
        </p>
        <p className="leading-relaxed text-[#666666]">
          ChainProof provides cryptographic file integrity verification and immutable timestamped blockchain registration records.
          <strong className="text-[#171717]"> Blockchain registration does not independently constitute or prove legal copyright, patent rights, or original authorship.</strong> It establishes objective cryptographic evidence of asset possession at a specific block timestamp.
        </p>
      </div>
    </div>
  );
};
