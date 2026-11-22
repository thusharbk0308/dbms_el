import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface LegalDisclaimerProps {
  variant?: 'banner' | 'card' | 'inline';
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ variant = 'banner' }) => {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span>Cryptographic verification anchors SHA-256 integrity and on-chain timestamp, not legal ownership.</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3.5 text-xs text-amber-200/90">
      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-semibold text-amber-300 uppercase tracking-wider text-[11px]">
          Legal Distinction & Intellectual Property Disclaimer
        </p>
        <p className="leading-relaxed text-slate-300">
          ChainProof provides cryptographic file integrity verification and immutable timestamped blockchain registration records.
          <strong> Blockchain registration does not independently constitute or prove legal copyright, patent rights, or original authorship.</strong> It establishes objective cryptographic evidence of asset possession at a specific block timestamp.
        </p>
      </div>
    </div>
  );
};
