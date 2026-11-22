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
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-mono font-medium text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Workspace Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Role: <span className="text-slate-200 font-mono font-medium">{user?.role}</span> &bull; Status:{' '}
            <span className="text-emerald-400 font-medium">Active</span>
          </p>
        </div>

        {isCreator && (
          <div className="flex gap-3">
            <Link
              to="/assets/new"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Register New Asset
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Registered</span>
            <FolderGit2 className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.total_assets ?? assets.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.total_confirmed_assets ?? 0} confirmed on-chain
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Verifications</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats?.total_verifications ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.exact_match_verifications ?? 0} exact matches
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Licenses</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats?.total_active_licenses ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.total_licenses_issued ?? 0} total granted
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Disputes Queue</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400">{stats?.open_disputes ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.total_disputes ?? 0} total filed
          </span>
        </div>
      </div>

      {/* Recent Assets & Blockchain Anchor Info */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Assets Table */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-blue-400" />
              Recent Digital Assets
            </h2>
            <Link to="/assets" className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium">
              View All <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {assets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No digital assets found in your registry yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="py-2.5 px-3">TITLE & CATEGORY</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3">FINGERPRINT</th>
                    <th className="py-2.5 px-3">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {assets.map((asset) => (
                    <tr key={asset.asset_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <Link to={`/assets/${asset.asset_id}`} className="font-semibold text-slate-200 hover:text-blue-400">
                          {asset.title}
                        </Link>
                        <p className="text-[11px] text-slate-400">{asset.category_name || 'Asset'}</p>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={asset.registration_status} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {asset.current_version?.file_hash ? `${asset.current_version.file_hash.slice(0, 10)}...` : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Blockchain Status Box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Blockchain Anchoring
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">Network Name</span>
              <p className="text-slate-200">{blockchain?.network_name || 'hardhat_local'}</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">Contract Address</span>
              <p className="text-slate-200 truncate select-all">{blockchain?.contract_address || '0x5FbDB231...80aa3'}</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">Current Block Number</span>
              <p className="text-blue-400 font-bold">#{blockchain?.current_block_number ?? 'Synced'}</p>
            </div>
          </div>

          <div className="pt-2">
            <LegalDisclaimer variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
};
