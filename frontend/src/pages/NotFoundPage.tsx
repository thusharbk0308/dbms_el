import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 bg-[#FFFFFF] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex items-center justify-center text-[#171717]">
        <ShieldAlert className="w-8 h-8 text-[#E9786D]" />
      </div>
      <h1 className="text-4xl font-extrabold uppercase tracking-tight text-[#171717]">
        404 &bull; Page Not Found
      </h1>
      <p className="text-xs text-[#666666] max-w-md font-medium">
        The cryptographic registry route or asset resource you requested does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-[#191B20] hover:bg-[#171717] text-white text-xs font-extrabold uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
      >
        Return to Home
      </Link>
    </div>
  );
};
