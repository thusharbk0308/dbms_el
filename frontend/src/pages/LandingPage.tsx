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
  Database,
  Search,
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
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* Editorial Hero Section */}
      <section className="space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFFFFF] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-[11px] font-mono font-bold uppercase tracking-wider text-[#171717]">
          <span className="w-2 h-2 bg-[#E9786D] border border-[#171717]" />
          Solidity (v0.8.20) &bull; SHA-256 &bull; 3NF PostgreSQL
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#171717] uppercase leading-[1.08]">
            Cryptographic Proof for <br className="hidden sm:inline" />
            <span className="bg-[#E9786D] text-[#171717] px-2 py-0.5 border-2 border-[#171717] shadow-[3px_3px_0px_#171717] inline-block mt-1">
              Digital Intellectual Property
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#666666] max-w-3xl leading-relaxed font-medium">
            ChainProof provides creators with deterministic SHA-256 cryptographic fingerprints, immutable timestamped Ethereum smart contract anchoring, tamper-evident verification, and verifiable rights management.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            to="/verify"
            className="px-6 py-3 bg-[#55AAA7] hover:bg-[#489b98] text-[#171717] font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] shadow-[4px_4px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4 text-[#171717]" />
            Verify a File Now
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 bg-[#191B20] hover:bg-[#171717] text-white font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] shadow-[4px_4px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
          >
            Register as Creator
            <ArrowRight className="w-4 h-4 text-[#E9786D]" />
          </Link>
          <Link
            to="/analytics"
            className="px-6 py-3 bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#171717] font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] shadow-[4px_4px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
          >
            <Database className="w-4 h-4 text-[#82A9D4]" />
            View Analytics
          </Link>
        </div>

        {/* Legal Distinction Banner */}
        <div className="pt-2">
          <LegalDisclaimer variant="card" />
        </div>
      </section>

      {/* Live Blockchain Network Card */}
      <section className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-[#171717]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#666666] mb-1">
              <Cpu className="w-4 h-4 text-[#55AAA7]" />
              Live Blockchain Environment
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#171717]">
              Smart Contract Proof Engine
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#F8F6F2] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-xs font-mono font-bold">
            <span className={`w-2.5 h-2.5 border border-[#171717] ${blockchain?.connected ? 'bg-[#55AAA7]' : 'bg-[#E9786D]'}`} />
            <span className="text-[#171717]">
              {blockchain?.connected ? `NETWORK ACTIVE &bull; CHAIN ID ${blockchain.chain_id}` : 'HARDHAT LOCALHOST (PORT 8545)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-[10px] text-[#666666] uppercase font-bold font-mono tracking-wider block">Contract Address</span>
            <p className="text-xs font-mono font-bold text-[#171717] truncate mt-1.5" title={blockchain?.contract_address}>
              {blockchain?.contract_address ? `${blockchain.contract_address.slice(0, 10)}...${blockchain.contract_address.slice(-6)}` : '0x5FbDB231...80aa3'}
            </p>
          </div>
          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-[10px] text-[#666666] uppercase font-bold font-mono tracking-wider block">Current Block</span>
            <p className="text-xl font-mono font-extrabold text-[#171717] mt-1">
              #{blockchain?.current_block_number ?? 12}
            </p>
          </div>
          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-[10px] text-[#666666] uppercase font-bold font-mono tracking-wider block">Total Registered Assets</span>
            <p className="text-xl font-mono font-extrabold text-[#171717] mt-1">
              {stats?.total_assets ?? 0}
            </p>
          </div>
          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-[10px] text-[#666666] uppercase font-bold font-mono tracking-wider block">Verifications Executed</span>
            <p className="text-xl font-mono font-extrabold text-[#55AAA7] mt-1">
              {stats?.total_verifications ?? 0}
            </p>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="space-y-6">
        <div className="border-b-2 border-[#171717] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-extrabold uppercase tracking-tight text-[#171717]">
              System Architecture & Methodology
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Dual-layer hybrid design: PostgreSQL 3NF relational metadata coupled with EVM timestamp anchoring.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#E9786D] uppercase border-2 border-[#171717] bg-[#FFFFFF] px-2 py-0.5 shadow-[2px_2px_0px_#171717]">
            01 / SPECIFICATION
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#FFFFFF] border-2 border-[#171717] p-6 shadow-[4px_4px_0px_#171717] space-y-3">
            <div className="w-10 h-10 bg-[#82A9D4] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold uppercase tracking-tight text-[#171717]">
              SHA-256 Fingerprinting
            </h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              Files are processed in 64KB binary streams to generate 64-character lowercase hex digests. A 1-bit alteration completely changes the output due to the avalanche effect.
            </p>
          </div>

          <div className="bg-[#FFFFFF] border-2 border-[#171717] p-6 shadow-[4px_4px_0px_#171717] space-y-3">
            <div className="w-10 h-10 bg-[#55AAA7] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
              <GitCommit className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold uppercase tracking-tight text-[#171717]">
              EVM Smart Contract
            </h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              Solidity contract IPRegistry.sol anchors the SHA-256 fingerprint alongside block number and timestamp. On-chain states cannot be overwritten, modified, or silently deleted.
            </p>
          </div>

          <div className="bg-[#FFFFFF] border-2 border-[#171717] p-6 shadow-[4px_4px_0px_#171717] space-y-3">
            <div className="w-10 h-10 bg-[#E9786D] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold uppercase tracking-tight text-[#171717]">
              Objective Verification
            </h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              Anyone can upload a file or paste a hash to query both the PostgreSQL database and the EVM smart contract independently, establishing prior possession without friction.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Step-by-Step */}
      <section className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 sm:p-8 space-y-6">
        <div className="border-b-2 border-[#171717] pb-3">
          <h3 className="text-xl font-extrabold uppercase tracking-tight text-[#171717]">
            How It Works — Step by Step
          </h3>
          <p className="text-xs text-[#666666]">
            From file upload to blockchain registration and public verification.
          </p>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] space-y-2">
            <span className="font-mono font-bold text-sm text-[#E9786D]">STEP 01</span>
            <p className="font-extrabold uppercase text-[#171717]">Asset Upload</p>
            <p className="text-[#666666] leading-relaxed">Creator uploads file with metadata and classification category.</p>
          </div>
          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] space-y-2">
            <span className="font-mono font-bold text-sm text-[#55AAA7]">STEP 02</span>
            <p className="font-extrabold uppercase text-[#171717]">SHA-256 Hashing</p>
            <p className="text-[#666666] leading-relaxed">Server generates deterministic 64-char cryptographic digest.</p>
          </div>
          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] space-y-2">
            <span className="font-mono font-bold text-sm text-[#82A9D4]">STEP 03</span>
            <p className="font-extrabold uppercase text-[#171717]">EVM Anchoring</p>
            <p className="text-[#666666] leading-relaxed">Fingerprint is submitted to IPRegistry.sol and mined into a block.</p>
          </div>
          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] space-y-2">
            <span className="font-mono font-bold text-sm text-[#191B20]">STEP 04</span>
            <p className="font-extrabold uppercase text-[#171717]">Verification</p>
            <p className="text-[#666666] leading-relaxed">Public auditors test file authenticity against both DB and on-chain records.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
