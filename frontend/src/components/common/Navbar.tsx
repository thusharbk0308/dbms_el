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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              ChainProof
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                IP Registry
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
          <Link
            to="/verify"
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              isActive('/verify') ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-400" />
            File Verification
          </Link>
          <Link
            to="/analytics"
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              isActive('/analytics') ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Analytics
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard') ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                Dashboard
              </Link>
              <Link
                to="/assets"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/assets') ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-900'
                }`}
              >
                My Assets
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                isActive('/admin') ? 'text-white bg-amber-950/60 border border-amber-800/60' : 'text-amber-300 hover:bg-amber-950/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Admin
            </Link>
          )}
        </nav>

        {/* Blockchain Status & User Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Node Health Pill */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all ${
              nodeStatus?.connected
                ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/50 border-rose-800/60 text-rose-300'
            }`}
            title={nodeStatus?.connected ? `Hardhat Node Connected (#${nodeStatus.current_block_number})` : 'Blockchain Node Offline'}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span>{nodeStatus?.connected ? `Block #${nodeStatus.current_block_number}` : 'Node Offline'}</span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-slate-200">{user.full_name}</span>
                <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-300 hover:bg-slate-900 rounded-xl transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-4 space-y-2 text-sm">
          <Link
            to="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            File Verification
          </Link>
          <Link
            to="/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            Analytics Dashboard
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-300 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                to="/assets"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-300 hover:text-white"
              >
                My Assets
              </Link>
              <Link
                to="/licenses"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-300 hover:text-white"
              >
                Licenses
              </Link>
              <Link
                to="/disputes"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-300 hover:text-white"
              >
                Disputes
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-amber-400 font-medium"
            >
              Admin Dashboard
            </Link>
          )}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-rose-400 text-xs font-medium flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user?.full_name})
              </button>
            ) : (
              <div className="flex gap-2 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-1/2 text-center py-2 bg-blue-600 rounded-lg text-xs text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
