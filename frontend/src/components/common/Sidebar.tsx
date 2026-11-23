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
    `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-2 ${
      isActive
        ? 'bg-[#191B20] text-white border-[#171717] shadow-[3px_3px_0px_#171717]'
        : 'bg-[#FFFFFF] text-[#171717] border-[#171717] shadow-[2px_2px_0px_#171717] hover:bg-[#F8F6F2] hover:translate-x-[1px] hover:translate-y-[1px]'
    }`;

  return (
    <aside className="w-64 border-r-2 border-[#171717] bg-[#FFFFFF] p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Creator / User Profile snippet */}
        <div className="p-3.5 bg-[#F8F6F2] border-2 border-[#171717] shadow-[3px_3px_0px_#171717]">
          <p className="text-[10px] text-[#666666] uppercase tracking-wider font-mono font-bold">Authenticated User</p>
          <p className="text-sm font-extrabold text-[#171717] truncate mt-0.5">{user?.full_name}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 border border-[#171717] bg-[#55AAA7]" />
            <span className="text-[10px] font-mono font-bold text-[#171717] uppercase bg-[#82A9D4]/30 px-1.5 py-0.5 border border-[#171717]">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-2">
          <p className="px-1 text-[10px] font-extrabold uppercase tracking-widest text-[#666666] flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-[#E9786D]"></span>
            Main Workspace
          </p>

          <NavLink to="/dashboard" className={navItemClass}>
            <LayoutDashboard className="w-4 h-4 text-[#82A9D4]" />
            Dashboard
          </NavLink>

          {isCreator && (
            <NavLink to="/assets/new" className={navItemClass}>
              <PlusCircle className="w-4 h-4 text-[#55AAA7]" />
              Register New IP
            </NavLink>
          )}

          <NavLink to="/assets" className={navItemClass}>
            <FolderGit2 className="w-4 h-4 text-[#E9786D]" />
            My Assets
          </NavLink>

          <NavLink to="/verify" className={navItemClass}>
            <FileCheck className="w-4 h-4 text-[#55AAA7]" />
            Verify File
          </NavLink>
        </div>

        {/* Rights, History & Legal */}
        <div className="space-y-2">
          <p className="px-1 text-[10px] font-extrabold uppercase tracking-widest text-[#666666] flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-[#55AAA7]"></span>
            Legal & Analytics
          </p>

          <NavLink to="/licenses" className={navItemClass}>
            <Award className="w-4 h-4 text-[#82A9D4]" />
            Licenses
          </NavLink>

          <NavLink to="/disputes" className={navItemClass}>
            <AlertCircle className="w-4 h-4 text-[#E9786D]" />
            Disputes
          </NavLink>

          <NavLink to="/analytics" className={navItemClass}>
            <BarChart2 className="w-4 h-4 text-[#55AAA7]" />
            Analytics
          </NavLink>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="space-y-2">
            <p className="px-1 text-[10px] font-extrabold uppercase tracking-widest text-[#E9786D] flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-[#171717]"></span>
              Admin
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-2 ${
                  isActive
                    ? 'bg-[#E9786D] text-[#171717] border-[#171717] shadow-[3px_3px_0px_#171717]'
                    : 'bg-[#FFFFFF] text-[#171717] border-[#171717] shadow-[2px_2px_0px_#171717] hover:bg-[#E9786D]/20'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-[#171717]" />
              Admin Controls
            </NavLink>
          </div>
        )}
      </div>

      {/* System Footer info */}
      <div className="pt-4 border-t-2 border-[#171717] text-[10px] font-mono text-[#666666]">
        <span>CHAINPROOF v1.0.0</span>
        <br />
        <span>DBMS + EVM SMART CONTRACT</span>
      </div>
    </aside>
  );
};
