import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { AnalyticsOverview, BlockchainStatus } from '@/types';
import { LegalDisclaimer } from '@/components/common/LegalDisclaimer';
import {
  Shield,
  FileCheck,
  Cpu,
  Layers,
  ArrowRight,
  Fingerprint,
  Lock,
  GitCommit,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [blockchain, setBlockchain] = useState<BlockchainStatus | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [st, bc] = await Promise.allSettled([
          api.analytics.getOverview(),
          api.blockchain.getStatus(),
        ]);
        if (st.status === 'fulfilled') setStats(st.value);
        if (bc.status === 'fulfilled') setBlockchain(bc.value);
      } catch (e) {
        console.error('Landing stats load error:', e);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/80 text-blue-400 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Solidity Smart Contract (v0.8.20) + SHA-256 Fingerprinting
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Cryptographic Proof for <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            Digital Intellectual Property
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          ChainProof enables creators to register digital works, generate deterministic SHA-256 cryptographic fingerprints, anchor immutable block records, verify integrity, and track licensing transparently.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/verify"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-95 flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4" />
            Verify a File Now
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-95 flex items-center gap-2"
          >
            Register as Creator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Legal Distinction Banner */}
        <div className="max-w-3xl mx-auto text-left pt-6">
          <LegalDisclaimer variant="card" />
        </div>
      </section>

      {/* Live Blockchain Network Card */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Live Blockchain Environment
            </div>
            <h2 className="text-xl font-bold text-white">Smart Contract Anchoring Engine</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-medium">
              {blockchain?.connected ? `Network Active (Chain ID: ${blockchain.chain_id})` : 'Hardhat Localhost (Port 8545)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Contract Address</span>
            <p className="text-xs font-mono text-slate-200 truncate mt-1" title={blockchain?.contract_address}>
              {blockchain?.contract_address ? `${blockchain.contract_address.slice(0, 10)}...${blockchain.contract_address.slice(-6)}` : '0x5FbDB231...80aa3'}
            </p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Current Block</span>
            <p className="text-base font-bold font-mono text-blue-400 mt-1">
              #{blockchain?.current_block_number ?? 12}
            </p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Total Assets</span>
            <p className="text-base font-bold text-white mt-1">
              {stats?.total_assets ?? 0}
            </p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Verifications Done</span>
            <p className="text-base font-bold text-emerald-400 mt-1">
              {stats?.total_verifications ?? 0}
            </p>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white">How ChainProof Operates</h3>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            A 3NF relational PostgreSQL database handles platform state, while Solidity anchors tamper-proof SHA-256 digests.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white">SHA-256 Fingerprinting</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are streamed in 64KB chunks to generate deterministic cryptographic digests. Even a single bit alteration changes the hash completely.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <GitCommit className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white">Immutable On-Chain State</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Solidity smart contract IPRegistry.sol records fingerprints with block numbers and timestamps. Records cannot be deleted or manipulated.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white">Public Verification</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Anyone can upload a file or paste a fingerprint to verify authenticity and inspect competing claims without needing an account.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
