import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { Shield, UserPlus, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CREATOR');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ full_name: fullName, email, password, role });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full space-y-6 bg-[#FFFFFF] border-2 border-[#171717] shadow-[8px_8px_0px_#171717] p-8">
        <div className="space-y-2">
          <div className="w-10 h-10 bg-[#191B20] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-white mb-3">
            <Shield className="w-5 h-5 text-[#55AAA7]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717]">
            Register Account
            <span className="inline-block w-2.5 h-2.5 bg-[#55AAA7] ml-1.5 align-baseline"></span>
          </h2>
          <p className="text-xs text-[#666666]">
            Create a creator or auditor profile to establish cryptographic intellectual property proofs.
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
              Full Legal Name / Creator Handle
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alice Chen"
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] placeholder-[#666666] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
            />
          </div>

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
              Password (min. 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] placeholder-[#666666] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Platform Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
            >
              <option value="CREATOR">CREATOR (Upload & Register Digital IP)</option>
              <option value="VERIFIER">VERIFIER (Audit & Verify Authenticity)</option>
            </select>
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
                <UserPlus className="w-4 h-4 text-[#55AAA7]" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-[#666666]">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-[#171717] underline hover:text-[#E9786D]">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
