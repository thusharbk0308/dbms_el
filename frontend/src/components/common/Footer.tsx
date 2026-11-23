import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t-2 border-[#171717] bg-[#FFFFFF] text-[#171717] py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#191B20] border-2 border-[#171717] flex items-center justify-center text-white">
            <Shield className="w-3.5 h-3.5 text-[#E9786D]" />
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wider text-sm text-[#171717]">ChainProof</span>
            <span className="text-[#666666] ml-2 font-mono">&copy; {new Date().getFullYear()} — Academic DBMS System</span>
          </div>
        </div>

        <div className="bg-[#F8F6F2] border-2 border-[#171717] p-3 max-w-xl text-[11px] text-[#666666] leading-relaxed shadow-[2px_2px_0px_#171717]">
          <strong className="text-[#171717]">Notice:</strong> Cryptographic file verification and timestamped blockchain registration provide mathematical proof of prior possession and file integrity, but do not independently establish statutory copyright ownership or intellectual property rights.
        </div>
      </div>
    </footer>
  );
};
