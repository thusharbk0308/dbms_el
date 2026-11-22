import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Asset, Category } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import {
  FolderGit2,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

export const AssetsListPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string | 'ALL'>('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const [assetsData, catsData] = await Promise.all([
        api.assets.list({ limit: 100 }),
        api.categories.list(),
      ]);
      setAssets(assetsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleRetryBlockchain = async (assetId: string) => {
    setRetryingId(assetId);
    try {
      await api.blockchain.retry(assetId);
      await fetchAssets();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetryingId(null);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || asset.category_id === selectedCategory;
    const matchesStatus =
      selectedStatus === 'ALL' || asset.registration_status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading registered digital assets..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-blue-400" />
            Registered Digital Assets
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and manage personal cryptographic registrations, version trees, and smart contract proofs.
          </p>
        </div>

        <Link
          to="/assets/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 self-start active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          Register New Asset
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, filename, or asset ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>

          <button
            onClick={fetchAssets}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Refresh assets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Assets Table */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          title="No digital assets found"
          description={searchQuery ? 'Try adjusting your search query or filter options.' : 'You have not registered any digital assets yet.'}
          actionText="Register New Asset"
          onAction={() => window.location.href = '/assets/new'}
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/40">
                  <th className="py-3 px-4">ASSET DETAILS</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">VERSION</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">FINGERPRINT</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAssets.map((asset) => (
                  <tr key={asset.asset_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/assets/${asset.asset_id}`}
                        className="font-bold text-white hover:text-blue-400 transition-colors block text-sm"
                      >
                        {asset.title}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-400">
                        {asset.original_filename} &bull; {(asset.file_size / 1024).toFixed(1)} KB
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {asset.category_name || 'Uncategorized'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-400">
                      v{asset.current_version?.version_number ?? 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={asset.registration_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 select-all">
                      {asset.current_version?.file_hash
                        ? `${asset.current_version.file_hash.slice(0, 8)}...${asset.current_version.file_hash.slice(-6)}`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {asset.registration_status !== 'CONFIRMED' && (
                        <button
                          onClick={() => handleRetryBlockchain(asset.asset_id)}
                          disabled={retryingId === asset.asset_id}
                          className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 rounded-lg text-amber-300 text-[11px] font-medium transition-colors"
                          title="Retry on-chain submission"
                        >
                          {retryingId === asset.asset_id ? 'Retrying...' : 'Retry Anchor'}
                        </button>
                      )}
                      <Link
                        to={`/assets/${asset.asset_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition-colors"
                      >
                        Details <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
