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
  ArrowRight,
  User,
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
        transfer_reason: transferReason || 'Ownership claim transfer',
        document_reference: docRef || undefined,
      });
      setIsTransferModalOpen(false);
      setTransferReason('');
      setDocRef('');
      await fetchAssetDetails();
    } catch (err) {
      alert(`Transfer failed: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Retrieving cryptographic asset and on-chain proof..." />;
  }

  if (error || !asset) {
    return (
      <div className="p-8 bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-[#E9786D] mx-auto" />
        <h2 className="text-xl font-extrabold uppercase text-[#171717]">Asset Record Not Found</h2>
        <p className="text-xs text-[#666666]">{error || 'Unable to locate asset record.'}</p>
        <Link
          to="/assets"
          className="inline-block px-4 py-2 bg-[#191B20] text-white text-xs font-bold uppercase border-2 border-[#171717] shadow-[2px_2px_0px_#171717]"
        >
          Return to Assets List
        </Link>
      </div>
    );
  }

  const latestHash = asset.current_version?.file_hash || asset.versions?.[0]?.file_hash || '';
  const currentVersionNum = asset.current_version?.version_number || asset.versions?.[0]?.version_number || 1;
  const blockchainRec = asset.current_version?.blockchain_record || asset.blockchain_records?.[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#82A9D4]/30 border border-[#171717]">
              {asset.visibility}
            </span>
            <StatusBadge status={asset.registration_status} size="sm" />
            <span className="text-xs font-mono text-[#666666]">UUID: {asset.asset_id}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717]">
            {asset.title}
            <span className="inline-block w-2.5 h-2.5 bg-[#E9786D] ml-1.5 align-baseline"></span>
          </h1>

          <p className="text-xs text-[#666666] max-w-2xl font-medium">
            {asset.description || 'No supplementary legal description recorded.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsVersionModalOpen(true)}
            className="px-3.5 py-2 bg-[#55AAA7] hover:bg-[#489b98] text-[#171717] font-extrabold text-xs uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#171717]" />
            New Version
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2 bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#171717] font-extrabold text-xs uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#82A9D4]" />
            Transfer Claim
          </button>
          <Link
            to={`/licenses?asset_id=${asset.asset_id}`}
            className="px-3.5 py-2 bg-[#191B20] hover:bg-[#171717] text-white font-extrabold text-xs uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-[#E9786D]" />
            Issue License
          </Link>
        </div>
      </div>

      <LegalDisclaimer variant="card" />

      {/* Grid: Fingerprint & On-Chain Proof */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* SHA-256 Fingerprint Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#82A9D4]" />
              Deterministic Cryptographic Fingerprint
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#F8F6F2] border border-[#171717]">
              SHA-256
            </span>
          </div>

          <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] space-y-3 font-mono">
            <div className="flex items-center justify-between text-[10px] text-[#666666] font-bold uppercase">
              <span>Current Digest (v{currentVersionNum})</span>
              <button
                onClick={() => handleCopy(latestHash)}
                className="px-2 py-0.5 bg-[#FFFFFF] hover:bg-[#E9786D] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] flex items-center gap-1 transition-all"
              >
                {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedHash ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <p className="text-xs break-all font-bold text-[#171717] bg-[#FFFFFF] p-2.5 border border-[#171717] select-all">
              {latestHash || 'Fingerprint calculation pending'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-[#F8F6F2] p-3 border-2 border-[#171717]">
              <span className="text-[10px] text-[#666666] uppercase font-bold block">Filename</span>
              <span className="font-bold text-[#171717] truncate block">{asset.original_filename}</span>
            </div>
            <div className="bg-[#F8F6F2] p-3 border-2 border-[#171717]">
              <span className="text-[10px] text-[#666666] uppercase font-bold block">Registration Date</span>
              <span className="font-bold text-[#171717] block">
                {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Blockchain Record Badge */}
        <div className="space-y-4">
          <BlockchainBadge
            txHash={blockchainRec?.transaction_hash}
            blockNumber={blockchainRec?.block_number}
            contractAddress={blockchainRec?.contract_address}
            timestamp={blockchainRec?.blockchain_timestamp}
            status={blockchainRec?.transaction_status}
          />

          <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#666666] uppercase block">Independent Verification</span>
              <p className="text-xs font-bold text-[#171717]">Verify this file against the on-chain smart contract</p>
            </div>
            <Link
              to="/verify"
              className="px-3 py-1.5 bg-[#55AAA7] text-[#171717] font-bold text-xs uppercase border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Verify Now
            </Link>
          </div>
        </div>
      </div>

      {/* Version History Tree */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#55AAA7]" />
            Version Tree & Iterations
          </h2>
          <span className="text-xs font-mono font-bold text-[#666666]">
            {asset.versions?.length || 1} Version(s) Recorded
          </span>
        </div>

        <div className="space-y-3">
          {(asset.versions || []).map((ver, idx) => (
            <div
              key={ver.version_id || idx}
              className={`p-4 border-2 border-[#171717] transition-all ${
                idx === 0 ? 'bg-[#F8F6F2] shadow-[3px_3px_0px_#171717]' : 'bg-[#FFFFFF]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-[#171717]">
                    v{ver.version_number}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#55AAA7] text-[#171717] border border-[#171717]">
                      LATEST
                    </span>
                  )}
                  <span className="text-xs text-[#666666] font-mono">
                    Size: {(ver.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#666666]">
                  {ver.created_at ? new Date(ver.created_at).toLocaleString() : ''}
                </span>
              </div>

              <div className="bg-[#FFFFFF] p-2 border border-[#171717] font-mono text-xs text-[#171717] break-all">
                <span className="text-[#666666] text-[10px] block uppercase font-bold">SHA-256 Digest:</span>
                {ver.file_hash}
              </div>

              {ver.changelog && (
                <p className="text-xs text-[#666666] mt-2 italic">
                  Changelog: {ver.changelog}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ownership & Transfer History */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
            <History className="w-4 h-4 text-[#82A9D4]" />
            Ownership Claims & Transfer History
          </h2>
          <span className="text-xs font-mono font-bold text-[#666666]">
            {history.length} Event(s)
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-[#666666] font-mono">
            No transfer events recorded. Original registrant retains sole registered claim.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div
                key={h.history_id || i}
                className="p-3.5 bg-[#F8F6F2] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <span className="text-[#666666]">Previous Owner #{h.previous_claimant_id ?? 'None'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E9786D]" />
                    <span className="text-[#171717]">New Claimant #{h.new_claimant_id}</span>
                  </div>
                  {h.transfer_reason && (
                    <p className="text-[11px] text-[#666666] mt-1 font-medium">Reason: {h.transfer_reason}</p>
                  )}
                </div>
                <div className="text-right font-mono text-[11px] text-[#666666]">
                  <span>{h.transfer_timestamp ? new Date(h.transfer_timestamp).toLocaleString() : ''}</span>
                  {h.document_reference && (
                    <span className="block text-[10px] text-[#171717] truncate max-w-[140px]">
                      Ref: {h.document_reference}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create Version */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="Upload New Asset Iteration"
      >
        <form onSubmit={handleCreateVersion} className="space-y-4">
          <p className="text-xs text-[#666666] leading-relaxed">
            Uploading an update generates a separate SHA-256 fingerprint, increments the version tree, and anchors the update to the smart contract without modifying past releases.
          </p>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Updated File Binary *
            </label>
            <input
              type="file"
              required
              onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Changelog Notes
            </label>
            <textarea
              rows={3}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="e.g. Added cryptographic signature module, bugfixes..."
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsVersionModalOpen(false)}
              className="px-4 py-2 bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] font-bold text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingVersion || !versionFile}
              className="px-4 py-2 bg-[#191B20] text-white border-2 border-[#171717] font-bold text-xs uppercase shadow-[2px_2px_0px_#171717]"
            >
              {isSubmittingVersion ? 'Anchoring...' : 'Register Version'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Claim */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Registered Claim"
      >
        <form onSubmit={handleTransferClaim} className="space-y-4">
          <p className="text-xs text-[#666666] leading-relaxed">
            Transfers the registered ownership claim on this platform. The previous creator and historical versions remain permanently recorded in the immutable audit trail.
          </p>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Recipient User ID *
            </label>
            <input
              type="number"
              required
              value={newCreatorId}
              onChange={(e) => setNewCreatorId(Number(e.target.value))}
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Transfer Reason
            </label>
            <input
              type="text"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Asset sale, corporate assignment..."
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Document / Contract Reference
            </label>
            <input
              type="text"
              value={docRef}
              onChange={(e) => setDocRef(e.target.value)}
              placeholder="e.g. Contract agreement #AG-2026-09"
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] font-bold text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingTransfer}
              className="px-4 py-2 bg-[#191B20] text-white border-2 border-[#171717] font-bold text-xs uppercase shadow-[2px_2px_0px_#171717]"
            >
              {isSubmittingTransfer ? 'Recording...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
