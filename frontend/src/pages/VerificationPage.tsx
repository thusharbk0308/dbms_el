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
  Clock,
  ArrowRight,
  ShieldAlert,
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
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFFFFF] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-[10px] font-mono font-bold uppercase tracking-wider text-[#171717]">
          <span className="w-2 h-2 bg-[#55AAA7] border border-[#171717]" />
          Zero-Knowledge Public Auditor Engine
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#171717]">
          Verify Digital Ownership Claims
          <span className="inline-block w-3 h-3 bg-[#E9786D] ml-1.5 align-baseline"></span>
        </h1>

        <p className="text-xs sm:text-sm text-[#666666] max-w-2xl mx-auto font-medium">
          Upload any file or enter a SHA-256 digest to verify integrity, cross-examine blockchain timestamps, and detect potential competing ownership claims.
        </p>
      </div>

      <LegalDisclaimer variant="card" />

      {/* Verification Query Card */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 sm:p-8 space-y-6">
        {/* Mode Switcher Tabs */}
        <div className="flex border-b-2 border-[#171717] gap-3 pb-3">
          <button
            onClick={() => { setTab('FILE'); setResult(null); setError(null); }}
            className={`px-4 py-2 font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] transition-all ${
              tab === 'FILE'
                ? 'bg-[#191B20] text-white shadow-[2px_2px_0px_#171717]'
                : 'bg-[#F8F6F2] text-[#171717] hover:bg-[#FFFFFF]'
            }`}
          >
            Verify by File Upload
          </button>
          <button
            onClick={() => { setTab('HASH'); setResult(null); setError(null); }}
            className={`px-4 py-2 font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] transition-all ${
              tab === 'HASH'
                ? 'bg-[#191B20] text-white shadow-[2px_2px_0px_#171717]'
                : 'bg-[#F8F6F2] text-[#171717] hover:bg-[#FFFFFF]'
            }`}
          >
            Verify by SHA-256 Digest
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-[#E9786D]/20 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-[#171717] text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#171717] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {tab === 'FILE' ? (
          <form onSubmit={handleVerifyFile} className="space-y-4">
            <div className="relative border-2 border-dashed border-[#171717] bg-[#F8F6F2] hover:bg-[#FFFFFF] p-8 text-center transition-all cursor-pointer group">
              <input
                type="file"
                required
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setResult(null);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-12 h-12 bg-[#FFFFFF] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center mx-auto text-[#171717] group-hover:bg-[#55AAA7] transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-extrabold uppercase text-[#171717]">
                  {file ? file.name : 'Select or Drag & Drop File to Verify'}
                </p>
                <p className="text-[11px] text-[#666666]">
                  File is streamed to compute SHA-256 locally on server without persistent storage
                </p>
                {file && (
                  <p className="text-[10px] font-mono font-bold text-[#55AAA7]">
                    Ready to verify &bull; {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || !file}
              className="w-full py-3.5 bg-[#55AAA7] hover:bg-[#489b98] disabled:opacity-50 text-[#171717] font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] shadow-[4px_4px_0px_#171717] hover:shadow-[2px_2px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#171717] border-t-white animate-spin" />
                  Streaming Binary & Querying Blockchain...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#171717]" />
                  Execute Cryptographic Verification
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyHash} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#171717] mb-1">
                SHA-256 Hash Digest (64-character Hexadecimal)
              </label>
              <input
                type="text"
                required
                value={submittedHash}
                onChange={(e) => setSubmittedHash(e.target.value)}
                placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-3 text-xs font-mono font-bold text-[#171717] placeholder-[#666666] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || submittedHash.trim().length !== 64}
              className="w-full py-3.5 bg-[#191B20] hover:bg-[#171717] disabled:opacity-50 text-white font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] shadow-[4px_4px_0px_#171717] hover:shadow-[2px_2px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin" />
                  Querying Blockchain Registry...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#E9786D]" />
                  Query Fingerprint on Smart Contract
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Structured Result Panels */}
      {result && (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div
            className={`border-2 border-[#171717] shadow-[8px_8px_0px_#171717] p-6 sm:p-8 ${
              result.is_match && result.verification_result === 'EXACT_MATCH'
                ? 'bg-[#55AAA7]/20 border-l-8 border-l-[#55AAA7]'
                : result.verification_result === 'NOT_REGISTERED'
                ? 'bg-[#E5E0D8] border-l-8 border-l-[#171717]'
                : 'bg-[#E9786D]/20 border-l-8 border-l-[#E9786D]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#171717]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center ${
                    result.is_match ? 'bg-[#55AAA7] text-[#171717]' : 'bg-[#E9786D] text-[#171717]'
                  }`}
                >
                  {result.is_match ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <XCircle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666]">
                    Verification Verdict
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#171717]">
                    {result.verification_result.replace(/_/g, ' ')}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={result.verification_result} />
              </div>
            </div>

            {/* Digest Details */}
            <div className="pt-4 space-y-3 font-mono text-xs">
              <div className="bg-[#FFFFFF] p-3 border-2 border-[#171717] space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[#666666] font-bold uppercase">
                  <span>Computed File SHA-256 Digest</span>
                  <button
                    onClick={() => copyToClipboard(result.submitted_hash)}
                    className="px-2 py-0.5 bg-[#F8F6F2] hover:bg-[#E9786D] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] flex items-center gap-1 transition-all"
                  >
                    {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedHash ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                <p className="break-all font-bold text-[#171717] select-all">
                  {result.submitted_hash}
                </p>
              </div>

              {/* On-Chain Record Verification Box */}
              {result.blockchain_verification && (
                <div className="bg-[#FFFFFF] p-4 border-2 border-[#171717] shadow-[3px_3px_0px_#171717] space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#666666] border-b border-[#171717] pb-1.5">
                    <span className="flex items-center gap-1 text-[#55AAA7]">
                      <ShieldCheck className="w-4 h-4" /> Blockchain Proof Validated
                    </span>
                    <span>Status: {result.blockchain_verification.verified ? 'CONFIRMED' : 'UNCONFIRMED'}</span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-[#666666] uppercase text-[10px] block font-bold">Transaction</span>
                      <span className="font-bold text-[#171717] truncate block" title={result.blockchain_verification.transaction_hash}>
                        {result.blockchain_verification.transaction_hash
                          ? `${result.blockchain_verification.transaction_hash.slice(0, 10)}...`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#666666] uppercase text-[10px] block font-bold">Block Number</span>
                      <span className="font-bold text-[#171717]">#{result.blockchain_verification.block_number ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-[#666666] uppercase text-[10px] block font-bold">Block Timestamp</span>
                      <span className="font-bold text-[#171717]">
                        {result.blockchain_verification.blockchain_timestamp
                          ? new Date(result.blockchain_verification.blockchain_timestamp).toLocaleString()
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Competing Claims Section */}
              {result.competing_claims && result.competing_claims.length > 0 && (
                <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 shadow-[4px_4px_0px_#171717] space-y-3">
                  <div className="flex items-center gap-2 text-[#E9786D] font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Competing Claims Detected ({result.competing_claims.length})
                  </div>
                  <p className="text-[11px] text-[#666666] font-sans">
                    Multiple distinct claimants have registered identical file fingerprints. They are listed below in chronological order of blockchain registration to establish prior possession objectively.
                  </p>
                  <div className="space-y-2">
                    {result.competing_claims.map((claim, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#F8F6F2] border border-[#171717] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#171717]">{claim.creator_name}</span>
                          <span className="text-[#666666] ml-2 font-mono">Asset {claim.asset_id}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#666666]">
                          {claim.registered_at ? new Date(claim.registered_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Target Asset Link if matched */}
            {result.matched_asset && (
              <div className="pt-4 flex justify-end">
                <Link
                  to={`/assets/${result.matched_asset.asset_id}`}
                  className="px-4 py-2 bg-[#191B20] hover:bg-[#171717] text-white font-extrabold uppercase text-xs border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center gap-1.5 transition-all"
                >
                  Inspect Matched Asset Record <ArrowRight className="w-3.5 h-3.5 text-[#E9786D]" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
