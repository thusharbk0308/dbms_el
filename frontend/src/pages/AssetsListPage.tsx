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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#171717] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
            Registered Intellectual Property
            <span className="inline-block w-2.5 h-2.5 bg-[#E9786D] ml-1"></span>
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Browse and manage personal cryptographic registrations, version trees, and smart contract proofs.
          </p>
        </div>

        <Link
          to="/assets/new"
          className="px-4 py-2.5 bg-[#191B20] hover:bg-[#171717] text-white font-extrabold text-xs uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4 text-[#55AAA7]" />
          Register New Asset
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, filename, or UUID..."
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] pl-9 pr-3 py-2 text-xs font-bold text-[#171717] placeholder-[#666666] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
            className="bg-[#F8F6F2] border-2 border-[#171717] px-3 py-2 font-bold text-[#171717] focus:outline-none focus:bg-[#FFFFFF] shadow-[2px_2px_0px_#171717]"
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
            className="bg-[#F8F6F2] border-2 border-[#171717] px-3 py-2 font-bold text-[#171717] focus:outline-none focus:bg-[#FFFFFF] shadow-[2px_2px_0px_#171717]"
          >
            <option value="ALL">All Statuses</option>
            <option value="REGISTERED">REGISTERED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="FAILED">FAILED</option>
          </select>

          <button
            onClick={fetchAssets}
            className="p-2 bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            title="Refresh assets list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Assets Table */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No registered assets match your search"
          description="Adjust your search filters or register a new intellectual property file to anchor it to the blockchain."
          actionText="Register New Asset"
          onAction={() => window.location.assign('/assets/new')}
        />
      ) : (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#171717] bg-[#F8F6F2] text-[#171717] font-mono uppercase text-[10px]">
                  <th className="py-3 px-4 font-bold">Asset Identifier & Title</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Version</th>
                  <th className="py-3 px-4 font-bold">SHA-256 Fingerprint</th>
                  <th className="py-3 px-4 font-bold">Blockchain Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#171717]">
                {filteredAssets.map((asset) => {
                  const hash = asset.current_version?.file_hash || asset.versions?.[0]?.file_hash;
                  const versionNum = asset.current_version?.version_number || asset.versions?.[0]?.version_number || 1;
                  return (
                    <tr key={asset.asset_id} className="hover:bg-[#F8F6F2] transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/assets/${asset.asset_id}`}
                          className="font-extrabold text-[#171717] hover:text-[#E9786D] text-sm block"
                        >
                          {asset.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[#666666]">
                          <span className="font-bold text-[#171717]">{asset.asset_id}</span>
                          <span>&bull;</span>
                          <span>{asset.original_filename}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold uppercase text-[10px]">
                        <span className="px-2 py-0.5 bg-[#82A9D4]/25 border border-[#171717]">
                          {categories.find((c) => c.category_id === asset.category_id)?.category_name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs">
                        v{versionNum}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {hash ? (
                          <span className="bg-[#F8F6F2] px-2 py-1 border border-[#171717] block w-fit" title={hash}>
                            {hash.slice(0, 10)}...{hash.slice(-6)}
                          </span>
                        ) : (
                          <span className="text-[#666666]">Pending Hash</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={asset.registration_status} size="sm" />
                          {asset.registration_status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryBlockchain(asset.asset_id)}
                              disabled={retryingId === asset.asset_id}
                              className="px-2 py-0.5 bg-[#E9786D] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] text-[10px] font-bold uppercase flex items-center gap-1"
                              title="Retry Blockchain Submission"
                            >
                              <RotateCw className={`w-3 h-3 ${retryingId === asset.asset_id ? 'animate-spin' : ''}`} />
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/assets/${asset.asset_id}`}
                            className="px-3 py-1 bg-[#191B20] hover:bg-[#171717] text-white font-extrabold uppercase text-[10px] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
