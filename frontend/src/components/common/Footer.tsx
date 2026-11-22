import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-300">ChainProof</span>
          <span>&copy; {new Date().getFullYear()} — Academic DBMS Project.</span>
        </div>

        <p className="text-slate-400 text-center md:text-right max-w-xl text-[11px] leading-relaxed">
          Cryptographic file integrity and timestamped blockchain registration provide objective evidence of existence, but do not independently establish copyright ownership or legal rights.
        </p>
      </div>
    </footer>
  );
};
