import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Shield, LogIn, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] border-2 border-[#171717] shadow-[8px_8px_0px_#171717] p-8">
        <div className="space-y-2">
          <div className="w-10 h-10 bg-[#191B20] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-white mb-3">
            <Shield className="w-5 h-5 text-[#E9786D]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717]">
            Sign In
            <span className="inline-block w-2.5 h-2.5 bg-[#E9786D] ml-1.5 align-baseline"></span>
          </h2>
          <p className="text-xs text-[#666666]">
            Authenticate to access your creator dashboard, registered digital assets, and smart contract licenses.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#E9786D]/20 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-[#171717] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#171717] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@chainproof.io"
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] placeholder-[#666666] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] placeholder-[#666666] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#191B20] hover:bg-[#171717] disabled:opacity-50 text-white font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] shadow-[4px_4px_0px_#171717] hover:shadow-[2px_2px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 text-[#E9786D]" />
                Authenticate
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-4 border-t-2 border-[#171717] space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-[#55AAA7]" /> Quick Demo Accounts (Click to fill)
          </p>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <button
              type="button"
              onClick={() => fillDemo('alice@chainproof.io', 'SecurePassword123!')}
              className="px-2 py-1.5 bg-[#F8F6F2] hover:bg-[#E9786D] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-bold uppercase text-center transition-all truncate"
            >
              Alice (Creator)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('bob@chainproof.io', 'SecurePassword123!')}
              className="px-2 py-1.5 bg-[#F8F6F2] hover:bg-[#82A9D4] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-bold uppercase text-center transition-all truncate"
            >
              Bob (Creator)
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@chainproof.io', 'SecurePassword123!')}
              className="px-2 py-1.5 bg-[#F8F6F2] hover:bg-[#55AAA7] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-bold uppercase text-center transition-all truncate"
            >
              Admin (Root)
            </button>
          </div>
          <p className="text-[10px] font-mono text-[#666666] text-center pt-1">
            Default Password: <span className="font-bold text-[#171717]">SecurePassword123!</span>
          </p>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-[#666666]">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-extrabold text-[#171717] underline hover:text-[#E9786D]">
              Register as Creator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
