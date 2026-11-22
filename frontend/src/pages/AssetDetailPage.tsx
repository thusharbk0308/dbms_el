import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '@/services/api';
import type { Asset, OwnershipHistoryRecord } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BlockchainBadge } from '@/components/common/BlockchainBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { LegalDisclaimer } from '@/components/common/LegalDisclaimer';
import {
  FolderGit2,
  FileCode,
  Calendar,
  Layers,
  History,
  ShieldAlert,
  Award,
  Upload,
  UserCheck,
  Copy,
  Check,
  Plus,
  GitBranch,
} from 'lucide-react';

export const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<OwnershipHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // New version form
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [changelog, setChangelog] = useState('');
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);

  // Transfer claim form
  const [newCreatorId, setNewCreatorId] = useState<number>(2);
  const [transferReason, setTransferReason] = useState('');
  const [docRef, setDocRef] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const fetchAssetDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [assetData, historyData] = await Promise.all([
        api.assets.getById(id),
        api.assets.getHistory(id),
      ]);
      setAsset(assetData);
      setHistory(historyData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !versionFile) return;
    setIsSubmittingVersion(true);
    try {
      const formData = new FormData();
      formData.append('file', versionFile);
      if (changelog) formData.append('changelog', changelog);
      await api.assets.createVersion(id, formData);
      setIsVersionModalOpen(false);
      setVersionFile(null);
      setChangelog('');
      await fetchAssetDetails();
    } catch (err) {
      alert(`Version creation failed: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmittingVersion(false);
    }
  };

  const handleTransferClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmittingTransfer(true);
    try {
      await api.assets.transferClaim(id, {
        new_creator_id: Number(newCreatorId),
        transfer_reason: transferReason,
        document_reference: docRef || undefined,
      });
      setIsTransferModalOpen(false);
      setTransferReason('');
      setDocRef('');
      await fetchAssetDetails();
    } catch (err) {
      alert(`Claim transfer failed: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading asset metadata and versions..." />;
  if (error || !asset) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-xl mx-auto space-y-4">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Asset Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'The requested asset could not be loaded.'}</p>
        <Link to="/assets" className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl inline-block">
          Return to Asset List
        </Link>
      </div>
    );
  }

  const latestBcRecord = asset.blockchain_records?.[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Top Banner with Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 sm:p-8 rounded-3xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={asset.registration_status} />
            <span className="text-xs font-mono text-slate-400">ID: {asset.asset_id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{asset.title}</h1>
          <p className="text-xs text-slate-400">
            Category: <span className="text-slate-200 font-medium">{asset.category_name}</span> &bull; Creator:{' '}
            <span className="text-blue-400 font-semibold">{asset.creator_name || `User #${asset.creator_id}`}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsVersionModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Version
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            Transfer Claim
          </button>
          <Link
            to={`/disputes?asset_id=${asset.asset_id}`}
            className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Report Dispute
          </Link>
        </div>
      </div>

      <LegalDisclaimer variant="banner" />

      {/* Main Grid: Details + Blockchain Verification */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Technical Metadata */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              Cryptographic Digest & File Specs
            </h2>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase">Current Version SHA-256 Fingerprint:</span>
                <button
                  onClick={() => handleCopy(asset.current_version?.file_hash || '')}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Copy Hash"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-emerald-400 text-xs break-all select-all font-semibold">
                {asset.current_version?.file_hash || 'Pending generation'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase">Original File</span>
                <p className="font-semibold text-white truncate mt-0.5">{asset.original_filename}</p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase">File Size</span>
                <p className="font-semibold text-white mt-0.5">{(asset.file_size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase">MIME Type</span>
                <p className="font-mono text-slate-300 text-[11px] truncate mt-0.5">{asset.mime_type}</p>
              </div>
            </div>

            {asset.description && (
              <div className="pt-2 text-xs">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Description</span>
                <p className="text-slate-300 mt-1 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  {asset.description}
                </p>
              </div>
            )}
          </div>

          {/* Versions Timeline */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                Immutable Version History ({asset.versions?.length ?? 1})
              </h2>
            </div>

            <div className="space-y-3">
              {asset.versions?.map((v) => (
                <div
                  key={v.version_id}
                  className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-mono font-bold text-[11px]">
                        v{v.version_number}
                      </span>
                      {v.changelog && <span className="text-slate-300 font-medium">{v.changelog}</span>}
                    </div>
                    <p className="font-mono text-[11px] text-slate-400 break-all select-all">
                      Hash: {v.file_hash}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(v.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ownership History Log */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              Registered Ownership Claim Trail
            </h2>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No ownership claim transfers recorded for this asset.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.history_id} className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        {h.previous_claimant_id ? `Claimant #${h.previous_claimant_id} → Claimant #${h.new_claimant_id}` : `Initial Registration by Claimant #${h.new_claimant_id}`}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(h.transfer_timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Reason: {h.transfer_reason}</p>
                    {h.document_reference && (
                      <p className="font-mono text-[10px] text-blue-400">Ref: {h.document_reference}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Smart Contract Proof & Actions */}
        <div className="space-y-6">
          <BlockchainBadge
            txHash={latestBcRecord?.transaction_hash}
            blockNumber={latestBcRecord?.block_number}
            contractAddress={latestBcRecord?.contract_address}
            timestamp={latestBcRecord?.blockchain_timestamp}
            status={latestBcRecord?.transaction_status}
          />

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Actions</h3>
            <Link
              to={`/licenses?asset_id=${asset.asset_id}`}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Issue License for Asset
              </span>
              <span>&rarr;</span>
            </Link>
            <Link
              to={`/verify`}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Verify Integrity
              </span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal: New Version Upload */}
      <Modal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} title="Upload Incremental Asset Version">
        <form onSubmit={handleCreateVersion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Updated File *</label>
            <input
              type="file"
              required
              onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Changelog / Release Notes</label>
            <input
              type="text"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="e.g. Patched re-entrancy edge condition in contract"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingVersion || !versionFile}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl"
          >
            {isSubmittingVersion ? 'Anchoring New Version to Blockchain...' : 'Register Version & Anchor'}
          </button>
        </form>
      </Modal>

      {/* Modal: Transfer Registered Claim */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transfer Registered Ownership Claim">
        <form onSubmit={handleTransferClaim} className="space-y-4">
          <p className="text-xs text-slate-400">
            Transferring records an immutable transaction in <span className="font-mono">ownership_history</span>. This transfers platform rights claims; legal ownership depends on real-world assignment contracts.
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">New Claimant User ID *</label>
            <input
              type="number"
              required
              value={newCreatorId}
              onChange={(e) => setNewCreatorId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Transfer Reason / Contract Description *</label>
            <textarea
              required
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Asset sale agreement executed Nov 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Document Reference (Optional)</label>
            <input
              type="text"
              value={docRef}
              onChange={(e) => setDocRef(e.target.value)}
              placeholder="e.g. DOC-REF-2026-X1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingTransfer}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl"
          >
            {isSubmittingTransfer ? 'Recording Transfer in Ledger...' : 'Execute Ownership Claim Transfer'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
