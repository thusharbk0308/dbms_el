import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { BlockchainStatus } from '@/types';
import {
  Shield,
  FileCheck,
  BarChart3,
  LogOut,
  LogIn,
  UserPlus,
  Cpu,
  Layers,
  Menu,
  X,
  User as UserIcon,
  ShieldAlert,
  FolderGit2,
  Award,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin, isCreator } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<BlockchainStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const s = await api.blockchain.getStatus();
        setNodeStatus(s);
      } catch {
        setNodeStatus(null);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkStyle = (path: string) =>
    `px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border-2 ${
      isActive(path)
        ? 'bg-[#191B20] text-white border-[#171717] shadow-[2px_2px_0px_#171717]'
        : 'bg-transparent text-[#171717] border-transparent hover:border-[#171717] hover:bg-white hover:shadow-[2px_2px_0px_#171717]'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#171717] bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#191B20] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-white group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[1px_1px_0px_#171717] transition-all">
            <Shield className="w-4 h-4 text-[#E9786D]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-[#171717] uppercase flex items-center">
              ChainProof
              <span className="inline-block w-2 h-2 bg-[#E9786D] ml-1"></span>
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-[#55AAA7] text-[#171717] border border-[#171717]">
              EVM IP Registry
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          <Link to="/" className={navLinkStyle('/')}>
            Home
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className={navLinkStyle('/dashboard')}>
              Dashboard
            </Link>
          )}
          {isAuthenticated && isCreator && (
            <Link to="/assets/new" className={navLinkStyle('/assets/new')}>
              + Register IP
            </Link>
          )}
          <Link to="/verify" className={navLinkStyle('/verify')}>
            Verify
          </Link>
          {isAuthenticated && (
            <Link to="/assets" className={navLinkStyle('/assets')}>
              My Assets
            </Link>
          )}
          <Link to="/analytics" className={navLinkStyle('/analytics')}>
            Analytics
          </Link>
          {isAuthenticated && isAdmin && (
            <Link to="/admin" className={navLinkStyle('/admin')}>
              Admin
            </Link>
          )}
        </nav>

        {/* Right side: Blockchain status & Profile */}
        <div className="flex items-center gap-3">
          {/* Node Status Pill */}
          <div
            className="hidden md:flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono font-bold bg-[#F8F6F2] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]"
            title={nodeStatus?.contract_address ? `Contract: ${nodeStatus.contract_address}` : 'Connecting...'}
          >
            <span
              className={`w-2 h-2 rounded-full border border-[#171717] ${
                nodeStatus?.connected ? 'bg-[#55AAA7]' : 'bg-[#E9786D]'
              }`}
            />
            <span className="text-[#171717]">
              {nodeStatus?.connected
                ? `Block #${nodeStatus.current_block_number ?? 0}`
                : 'Offline'}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-[#171717] truncate max-w-[120px]">
                  {user?.full_name}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase text-[#55AAA7] bg-[#191B20] px-1 py-0.2 border border-[#171717] self-end">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 bg-[#FFFFFF] hover:bg-[#E9786D] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#191B20] hover:bg-[#171717] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#E9786D]" />
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-[#171717] bg-[#F8F6F2] p-4 space-y-3">
          <nav className="flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkStyle('/')}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle('/dashboard')}
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated && isCreator && (
              <Link
                to="/assets/new"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle('/assets/new')}
              >
                + Register New IP Asset
              </Link>
            )}
            <Link
              to="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkStyle('/verify')}
            >
              Verify Digital Asset
            </Link>
            {isAuthenticated && (
              <Link
                to="/assets"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle('/assets')}
              >
                My Assets
              </Link>
            )}
            <Link
              to="/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkStyle('/analytics')}
            >
              Analytics
            </Link>
            {isAuthenticated && (
              <Link
                to="/licenses"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle('/licenses')}
              >
                Licenses
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/disputes"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle('/disputes')}
              >
                Disputes
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyle('/admin')}
              >
                Admin Control Center
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
