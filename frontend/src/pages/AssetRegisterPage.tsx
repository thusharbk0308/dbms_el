import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, getErrorMessage } from '@/services/api';
import type { Category, Asset, AssetVisibility } from '@/types';
import { LegalDisclaimer } from '@/components/common/LegalDisclaimer';
import { StatusBadge } from '@/components/common/StatusBadge';
import { BlockchainBadge } from '@/components/common/BlockchainBadge';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Info,
  Check,
  ArrowRight,
  Layers,
} from 'lucide-react';

export const AssetRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileHashPreview, setFileHashPreview] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [visibility, setVisibility] = useState<AssetVisibility>('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAsset, setCreatedAsset] = useState<Asset | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const list = await api.categories.list();
        setCategories(list);
        if (list.length > 0) setCategoryId(list[0].category_id);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Compute SHA-256 client-side for immediate visual verification preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 25 * 1024 * 1024) {
      setError('File exceeds maximum size limit of 25MB.');
      return;
    }

    setFile(selected);
    setError(null);

    try {
      const buffer = await selected.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setFileHashPreview(hashHex);
    } catch {
      setFileHashPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to register.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category_id', categoryId.toString());
      if (description) formData.append('description', description);
      formData.append('visibility', visibility);

      const res = await api.assets.register(formData);
      setCreatedAsset(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const createdHash = createdAsset?.current_version?.file_hash || fileHashPreview;
  const createdBlockchainRec = createdAsset?.current_version?.blockchain_record || createdAsset?.blockchain_records?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Editorial Header */}
      <div>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-[#171717]">
          Register Intellectual Property
          <span className="inline-block w-2.5 h-2.5 bg-[#E9786D] ml-1.5 align-baseline"></span>
        </h1>
        <p className="text-xs text-[#666666] mt-1 font-medium">
          Generate a deterministic SHA-256 fingerprint, store relational metadata in PostgreSQL, and anchor an immutable timestamp to the local Hardhat blockchain.
        </p>
      </div>

      <LegalDisclaimer variant="card" />

      {createdAsset ? (
        /* Registration Success Confirmation Card */
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[8px_8px_0px_#171717] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b-2 border-[#171717]">
            <div className="w-10 h-10 bg-[#55AAA7] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#171717]">
                Asset Successfully Registered!
              </h2>
              <p className="text-xs text-[#666666]">
                Cryptographic fingerprint generated and transaction mined to local Ethereum block.
              </p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[3px_3px_0px_#171717] space-y-2">
              <div className="flex justify-between text-[#666666] uppercase text-[10px] font-bold">
                <span>Asset UUID</span>
                <span>Version 1.0.0</span>
              </div>
              <p className="text-base font-bold text-[#171717]">{createdAsset.title}</p>
              <p className="text-[11px] text-[#666666]">{createdAsset.asset_id}</p>
            </div>

            <div className="bg-[#F8F6F2] p-4 border-2 border-[#171717] shadow-[3px_3px_0px_#171717] space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#666666]">
                <span>Deterministic SHA-256 Fingerprint</span>
                <button
                  onClick={() => copyHash(createdHash)}
                  className="px-2 py-0.5 bg-[#FFFFFF] hover:bg-[#E9786D] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] flex items-center gap-1 transition-all"
                >
                  {copiedHash ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedHash ? 'COPIED' : 'COPY HASH'}
                </button>
              </div>
              <p className="text-xs break-all font-bold text-[#171717] bg-[#FFFFFF] p-2.5 border border-[#171717]">
                {createdHash}
              </p>
            </div>

            {createdBlockchainRec && (
              <BlockchainBadge
                txHash={createdBlockchainRec.transaction_hash}
                blockNumber={createdBlockchainRec.block_number}
                contractAddress={createdBlockchainRec.contract_address}
                status={createdBlockchainRec.transaction_status}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to={`/assets/${createdAsset.asset_id}`}
              className="px-5 py-2.5 bg-[#191B20] hover:bg-[#171717] text-white text-xs font-extrabold uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5"
            >
              Inspect Asset Details <ArrowRight className="w-4 h-4 text-[#E9786D]" />
            </Link>
            <button
              onClick={() => {
                setCreatedAsset(null);
                setFile(null);
                setFileHashPreview('');
                setTitle('');
                setDescription('');
              }}
              className="px-5 py-2.5 bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#171717] text-xs font-extrabold uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Register Another Asset
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-[#E9786D]/20 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-[#171717] text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#171717] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#55AAA7]" />
              Step 1: Upload Asset Binary
            </h2>

            <div className="relative border-2 border-dashed border-[#171717] bg-[#F8F6F2] hover:bg-[#FFFFFF] p-8 text-center transition-all cursor-pointer group">
              <input
                type="file"
                onChange={handleFileChange}
                required
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-12 h-12 bg-[#FFFFFF] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center mx-auto text-[#171717] group-hover:bg-[#E9786D] transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-extrabold uppercase text-[#171717]">
                  {file ? file.name : 'Click or Drag & Drop File Here'}
                </p>
                <p className="text-[11px] text-[#666666]">
                  Supports PNG, JPG, PDF, DOCX, TXT, PY, JS, ZIP (Max 25MB)
                </p>
                {file && (
                  <p className="text-[10px] font-mono font-bold text-[#55AAA7]">
                    Size: {(file.size / 1024).toFixed(1)} KB &bull; Type: {file.type || 'Binary'}
                  </p>
                )}
              </div>
            </div>

            {/* SHA-256 Client-side Preview Box */}
            {fileHashPreview && (
              <div className="bg-[#F8F6F2] border-2 border-[#171717] p-3.5 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#666666] block">
                  Client-side SHA-256 Digest Preview (Computed in Browser)
                </span>
                <p className="text-xs font-mono font-bold text-[#171717] break-all select-all">
                  {fileHashPreview}
                </p>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#82A9D4]" />
              Step 2: Metadata & Relational Classification
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
                  Asset Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Algorithmic Trading Library Core"
                  className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] placeholder-[#666666] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
                    Visibility Scope
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as AssetVisibility)}
                    className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
                  >
                    <option value="PUBLIC">PUBLIC (Searchable by all auditors)</option>
                    <option value="PRIVATE">PRIVATE (Restricted to owner claim)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
                  Description & Claims Context (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide technical specifications, intended licensing constraints, or creation context..."
                  className="w-full bg-[#F8F6F2] border-2 border-[#171717] px-3.5 py-2.5 text-xs font-bold text-[#171717] placeholder-[#666666] focus:outline-none focus:bg-[#FFFFFF] focus:shadow-[2px_2px_0px_#171717] transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="w-full py-3.5 bg-[#191B20] hover:bg-[#171717] disabled:opacity-50 text-white font-extrabold uppercase tracking-wider text-xs border-2 border-[#171717] shadow-[4px_4px_0px_#171717] hover:shadow-[2px_2px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin" />
                Streaming File & Anchoring to Hardhat Blockchain...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#55AAA7]" />
                Submit Registration & Anchor On-Chain
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
