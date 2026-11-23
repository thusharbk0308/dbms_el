import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { Asset, AnalyticsOverview, BlockchainStatus } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LegalDisclaimer } from '@/components/common/LegalDisclaimer';
import {
  FolderGit2,
  PlusCircle,
  FileCheck,
  Award,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Cpu,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, isCreator } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [blockchain, setBlockchain] = useState<BlockchainStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [assetsRes, statsRes, bcRes] = await Promise.allSettled([
          api.assets.list({ limit: 5 }),
          api.analytics.getOverview(),
          api.blockchain.getStatus(),
        ]);
        if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (bcRes.status === 'fulfilled') setBlockchain(bcRes.value);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading workspace overview..." />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Editorial Welcome Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F8F6F2] border border-[#171717] text-[10px] font-mono font-bold uppercase tracking-wider text-[#171717] mb-2">
            <span className="w-1.5 h-1.5 bg-[#55AAA7]" />
            Workspace &bull; {user?.role} Mode
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717]">
            Welcome, {user?.full_name}
            <span className="inline-block w-2.5 h-2.5 bg-[#E9786D] ml-1.5 align-baseline"></span>
          </h1>
          <p className="text-xs text-[#666666] mt-1 font-medium">
            Personal Registry Account: <span className="font-mono font-bold text-[#171717]">{user?.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isCreator && (
            <Link
              to="/assets/new"
              className="px-4 py-2.5 bg-[#191B20] hover:bg-[#171717] text-white text-xs font-extrabold uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#55AAA7]" />
              Register New IP
            </Link>
          )}
          <Link
            to="/verify"
            className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#171717] text-xs font-extrabold uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4 text-[#55AAA7]" />
            Verify File
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-5 shadow-[4px_4px_0px_#171717]">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Registered</span>
            <FolderGit2 className="w-4 h-4 text-[#E9786D]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#171717]">{stats?.total_assets ?? assets.length}</p>
          <span className="text-[10px] font-mono font-bold text-[#55AAA7] mt-1 block">
            {stats?.total_confirmed_assets ?? 0} confirmed on-chain
          </span>
        </div>

        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-5 shadow-[4px_4px_0px_#171717]">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Verifications</span>
            <FileCheck className="w-4 h-4 text-[#55AAA7]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#171717]">{stats?.total_verifications ?? 0}</p>
          <span className="text-[10px] font-mono text-[#666666] mt-1 block">
            Cryptographic integrity queries
          </span>
        </div>

        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-5 shadow-[4px_4px_0px_#171717]">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Licenses</span>
            <Award className="w-4 h-4 text-[#82A9D4]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#171717]">{stats?.total_active_licenses ?? 0}</p>
          <span className="text-[10px] font-mono text-[#666666] mt-1 block">
            Commercial & educational
          </span>
        </div>

        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-5 shadow-[4px_4px_0px_#171717]">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Disputes Logged</span>
            <AlertCircle className="w-4 h-4 text-[#E9786D]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#171717]">{stats?.total_disputes ?? 0}</p>
          <span className="text-[10px] font-mono text-[#666666] mt-1 block">
            Competing claims registered
          </span>
        </div>
      </div>

      {/* Main Content Split: Recent Assets & Blockchain Anchor Info */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Assets List */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
            <h2 className="text-base font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-[#E9786D]" />
              Recent Digital Asset Registrations
            </h2>
            <Link
              to="/assets"
              className="text-xs font-bold uppercase tracking-wider text-[#171717] hover:text-[#E9786D] underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {assets.length === 0 ? (
            <div className="p-8 text-center bg-[#F8F6F2] border-2 border-dashed border-[#171717]">
              <p className="text-xs font-bold uppercase text-[#666666]">No assets registered yet</p>
              {isCreator && (
                <Link
                  to="/assets/new"
                  className="mt-3 inline-block px-3 py-1.5 bg-[#191B20] text-white text-xs font-bold uppercase border-2 border-[#171717] shadow-[2px_2px_0px_#171717]"
                >
                  Register First Asset
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#171717] bg-[#F8F6F2] text-[#171717] font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3 font-bold">Asset Title</th>
                    <th className="py-2.5 px-3 font-bold">Version</th>
                    <th className="py-2.5 px-3 font-bold">Fingerprint</th>
                    <th className="py-2.5 px-3 font-bold">Status</th>
                    <th className="py-2.5 px-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#171717]">
                  {assets.map((asset) => {
                    const hash = asset.current_version?.file_hash || asset.versions?.[0]?.file_hash;
                    const versionNum = asset.current_version?.version_number || asset.versions?.[0]?.version_number || 1;
                    return (
                      <tr key={asset.asset_id} className="hover:bg-[#F8F6F2] transition-colors">
                        <td className="py-3 px-3">
                          <Link
                            to={`/assets/${asset.asset_id}`}
                            className="font-bold text-[#171717] hover:text-[#E9786D] transition-colors block truncate max-w-[180px]"
                          >
                            {asset.title}
                          </Link>
                          <span className="text-[10px] text-[#666666] font-mono">{asset.original_filename}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[11px]">
                          v{versionNum}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#666666]">
                          {hash ? `${hash.slice(0, 8)}...` : 'Pending'}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={asset.registration_status} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/assets/${asset.asset_id}`}
                            className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#191B20] hover:text-white text-[#171717] font-bold uppercase text-[10px] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] inline-block transition-all"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Blockchain Node Status Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#55AAA7]" />
                Node Integrity
              </h2>
              <span
                className={`w-2.5 h-2.5 border border-[#171717] ${
                  blockchain?.connected ? 'bg-[#55AAA7]' : 'bg-[#E9786D]'
                }`}
              />
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#F8F6F2] p-3 border-2 border-[#171717]">
                <span className="text-[10px] text-[#666666] uppercase font-bold block">Smart Contract</span>
                <p className="text-[11px] font-bold text-[#171717] truncate mt-0.5" title={blockchain?.contract_address}>
                  {blockchain?.contract_address || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[#F8F6F2] p-2.5 border-2 border-[#171717]">
                  <span className="text-[10px] text-[#666666] uppercase font-bold block">Chain ID</span>
                  <p className="font-bold text-[#171717]">{blockchain?.chain_id ?? 31337}</p>
                </div>
                <div className="bg-[#F8F6F2] p-2.5 border-2 border-[#171717]">
                  <span className="text-[10px] text-[#666666] uppercase font-bold block">Mined Blocks</span>
                  <p className="font-bold text-[#171717]">#{blockchain?.current_block_number ?? 0}</p>
                </div>
              </div>

              <div className="p-3 bg-[#55AAA7]/15 border-2 border-[#171717] text-[11px] text-[#171717] font-medium leading-relaxed">
                Deterministic SHA-256 digests are anchored via Web3.py to Solidity smart contract <span className="font-bold">IPRegistry.sol</span> on Hardhat.
              </div>
            </div>
          </div>

          <LegalDisclaimer variant="card" />
        </div>
      </div>
    </div>
  );
};
