import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-slate-400">
        <ShieldAlert className="w-8 h-8 text-rose-400" />
      </div>
      <h1 className="text-4xl font-extrabold text-white">404 — Page Not Found</h1>
      <p className="text-xs text-slate-400 max-w-md">
        The cryptographic registry route you requested does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
      >
        Return to Home
      </Link>
    </div>
  );
};
