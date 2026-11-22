import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FolderGit2,
  FileCheck,
  Award,
  AlertCircle,
  BarChart2,
  ShieldCheck,
  History,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isCreator, isAdmin } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
    }`;

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Creator / User Profile snippet */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800/80 rounded-2xl">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Account</p>
          <p className="text-sm font-semibold text-slate-100 truncate">{user?.full_name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-slate-400">{user?.role}</span>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Main Workspace
          </p>

          <NavLink to="/dashboard" className={navItemClass}>
            <LayoutDashboard className="w-4 h-4" />
            Overview Dashboard
          </NavLink>

          {isCreator && (
            <NavLink to="/assets/new" className={navItemClass}>
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Register New IP Asset
            </NavLink>
          )}

          <NavLink to="/assets" className={navItemClass}>
            <FolderGit2 className="w-4 h-4" />
            My Registered Assets
          </NavLink>

          <NavLink to="/verify" className={navItemClass}>
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Verify File / Fingerprint
          </NavLink>
        </div>

        {/* Rights, History & Legal */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Licensing & Claims
          </p>

          <NavLink to="/licenses" className={navItemClass}>
            <Award className="w-4 h-4 text-amber-400" />
            License Management
          </NavLink>

          <NavLink to="/disputes" className={navItemClass}>
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Dispute Tracking
          </NavLink>

          <NavLink to="/analytics" className={navItemClass}>
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Database Analytics
          </NavLink>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-amber-400 mb-2">
              Administrator Controls
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white font-semibold shadow-lg shadow-amber-600/20'
                    : 'text-amber-300 hover:bg-amber-950/40'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Admin Portal
            </NavLink>
          </div>
        )}
      </div>

      {/* Chain Integrity Footer */}
      <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
        <History className="w-4 h-4 text-blue-400 shrink-0" />
        <span>Hardhat Devnet (31337)</span>
      </div>
    </aside>
  );
};
