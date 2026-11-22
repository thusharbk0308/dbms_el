import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '@/services/api';
import type { VerificationResponse } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LegalDisclaimer } from '@/components/common/LegalDisclaimer';
import {
  FileCheck,
  UploadCloud,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const [tab, setTab] = useState<'FILE' | 'HASH'>('FILE');
  const [file, setFile] = useState<File | null>(null);
  const [submittedHash, setSubmittedHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleVerifyFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setIsVerifying(true);
    setResult(null);

    try {
      const res = await api.verification.verifyExact(file);
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyHash = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHash = submittedHash.trim();
    if (cleanHash.length !== 64) {
      setError('Please provide a valid 64-character hexadecimal SHA-256 hash.');
      return;
    }
    setError(null);
    setIsVerifying(true);
    setResult(null);

    try {
      const res = await api.verification.verifyHash(cleanHash);
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl mx-auto flex items-center justify-center text-emerald-400 mb-2">
          <FileCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Cryptographic File Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Upload any file or provide a SHA-256 fingerprint to verify cryptographic authenticity, inspect timestamped blockchain registration proofs, and check competing claims.
        </p>
      </div>

      <LegalDisclaimer variant="banner" />

      {/* Verification Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex border-b border-slate-800 pb-4 gap-4">
          <button
            onClick={() => { setTab('FILE'); setResult(null); setError(null); }}
            className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              tab === 'FILE'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload File for Verification
          </button>
          <button
            onClick={() => { setTab('HASH'); setResult(null); setError(null); }}
            className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
              tab === 'HASH'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            Lookup by SHA-256 Hash
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: File Upload */}
        {tab === 'FILE' && (
          <form onSubmit={handleVerifyFile} className="space-y-4">
            <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/80 bg-slate-950/60 rounded-2xl p-8 text-center transition-all cursor-pointer relative">
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <UploadCloud className="w-8 h-8 text-emerald-400" />
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Click to choose a file or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      File will be hashed in streaming chunks to verify match.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !file}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/25 active:scale-95 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Hashing & Cross-Verifying with Smart Contract...
                </span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  Verify File Integrity & Smart Contract Record
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Hash Lookup */}
        {tab === 'HASH' && (
          <form onSubmit={handleVerifyHash} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Submitted 64-Hex SHA-256 Hash
              </label>
              <input
                type="text"
                required
                value={submittedHash}
                onChange={(e) => setSubmittedHash(e.target.value)}
                placeholder="e.g. a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || !submittedHash}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-95 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Searching Registry & Smart Contract...
                </span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Lookup Fingerprint
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Verification Results Panel */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
          {/* Outcome Banner */}
          {result.verification_result === 'EXACT_MATCH' && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Cryptographic Exact Match Verified</h3>
                <p className="text-xs text-emerald-300/80">
                  The submitted file matches an established registration and on-chain blockchain record.
                </p>
              </div>
            </div>
          )}

          {result.verification_result === 'NOT_REGISTERED' && (
            <div className="p-4 bg-amber-950/60 border border-amber-800/80 rounded-2xl flex items-center gap-3 text-amber-300">
              <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Fingerprint Not Found in Registry</h3>
                <p className="text-xs text-amber-300/80">
                  No matching registered digital asset was found for this fingerprint.
                </p>
              </div>
            </div>
          )}

          {result.verification_result === 'BLOCKCHAIN_VERIFICATION_FAILED' && (
            <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-center gap-3 text-rose-300">
              <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Blockchain Verification Mismatch</h3>
                <p className="text-xs text-rose-300/80">
                  The cryptographic fingerprint in the database does NOT match the immutable on-chain smart contract record!
                </p>
              </div>
            </div>
          )}

          {/* Fingerprint Digest Display */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl font-mono text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase">Computed SHA-256 Digest:</span>
              <button
                onClick={() => copyToClipboard(result.submitted_hash)}
                className="hover:text-white transition-colors"
                title="Copy hash"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-emerald-400 text-xs break-all select-all">{result.submitted_hash}</p>
          </div>

          {/* Matched Asset Details */}
          {result.matched_asset && (
            <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Matched Registered Asset
                </span>
                <Link
                  to={`/assets/${result.matched_asset.asset_id}`}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  View Details & History <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Title</span>
                  <p className="font-semibold text-white">{result.matched_asset.title}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Registered Creator</span>
                  <p className="text-slate-200">{result.matched_asset.creator_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Category</span>
                  <p className="text-slate-200">{result.matched_asset.category_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase">Matched Version</span>
                  <p className="font-mono text-blue-400">v{result.matched_version?.version_number ?? 1}</p>
                </div>
              </div>
            </div>
          )}

          {/* Blockchain Verification Proof */}
          {result.blockchain_verification && (
            <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl space-y-2 text-xs font-mono">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                On-Chain Smart Contract Proof
              </span>
              <p className="text-slate-300 truncate">
                Tx: {result.blockchain_verification.transaction_hash}
              </p>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                <span>Block #{result.blockchain_verification.block_number}</span>
                <span>Registrant: {result.blockchain_verification.registrant?.slice(0, 10)}...</span>
              </div>
            </div>
          )}

          {/* Competing Claims Warning Box */}
          {result.competing_claim_count > 0 && (
            <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Competing Claims Notice ({result.competing_claim_count} additional registered claim{result.competing_claim_count > 1 ? 's' : ''})
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Other creators have independently submitted matching files to the registry. The blockchain timestamps establish prior registration order objectively.
              </p>
              {result.competing_claims && result.competing_claims.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {result.competing_claims.map((c, i) => (
                    <div key={i} className="p-2 bg-slate-950/60 rounded border border-slate-800 flex justify-between text-[11px]">
                      <span className="text-slate-200">{c.title} ({c.creator_name})</span>
                      <span className="text-slate-400 font-mono">{new Date(c.registered_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legal Disclaimer returned by backend */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300 uppercase block mb-1">Legal Notice:</span>
            {result.legal_disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
