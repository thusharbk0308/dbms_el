import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '@/services/api';
import type { Category, Asset, AssetVisibility } from '@/types';
import { LegalDisclaimer } from '@/components/common/LegalDisclaimer';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Info,
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

  // Compute SHA-256 fingerprint client-side in browser for instant preview
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Register Digital Intellectual Property
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload your file to generate a deterministic SHA-256 fingerprint and anchor a timestamped blockchain verification record.
        </p>
      </div>

      <LegalDisclaimer variant="banner" />

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Modal / Card after registration */}
      {createdAsset ? (
        <div className="bg-slate-900 border border-emerald-800/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold text-white">Asset Successfully Registered!</h2>
              <p className="text-xs text-slate-400">Cryptographic digest anchored in database & blockchain.</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase">Asset Identifier</span>
              <p className="text-white font-bold">{createdAsset.asset_id}</p>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase">SHA-256 Fingerprint</span>
              <p className="text-emerald-400 text-[11px] break-all select-all">
                {createdAsset.current_version?.file_hash}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Registration Status</span>
                <p className="text-blue-400 font-semibold">{createdAsset.registration_status}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Version Number</span>
                <p className="text-slate-300">v{createdAsset.current_version?.version_number ?? 1}</p>
              </div>
            </div>

            {createdAsset.blockchain_records && createdAsset.blockchain_records.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase">Blockchain Transaction</span>
                <p className="text-slate-300 text-[11px] truncate">
                  Tx: {createdAsset.blockchain_records[0].transaction_hash}
                </p>
                <p className="text-blue-400 text-[11px]">
                  Block #{createdAsset.blockchain_records[0].block_number} &bull; Network:{' '}
                  {createdAsset.blockchain_records[0].network_name}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/assets/${createdAsset.asset_id}`)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
            >
              View Asset Details & History
            </button>
            <button
              onClick={() => {
                setCreatedAsset(null);
                setFile(null);
                setFileHashPreview('');
                setTitle('');
                setDescription('');
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all"
            >
              Register Another Asset
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          {/* File Upload Drop Area */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Asset File
            </label>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-blue-500/80 bg-slate-950/60 rounded-2xl p-8 text-center transition-all cursor-pointer">
              <input
                type="file"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-blue-950/50 rounded-2xl text-blue-400 border border-blue-800/40">
                  <UploadCloud className="w-8 h-8" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB &bull; {file.type || 'Binary file'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Click to upload or drag and drop your file here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Images, Documents (PDF, DOCX, TXT), Source Code (PY, CPP, C, JAVA, JS, HTML, CSS) up to 25MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client-side SHA-256 Preview */}
          {fileHashPreview && (
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Client-Computed SHA-256 Digest Preview:
              </span>
              <p className="text-emerald-400 break-all select-all text-[11px]">{fileHashPreview}</p>
            </div>
          )}

          {/* Asset Metadata Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Asset Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Decentralized Oracle Implementation v1.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Registry Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as AssetVisibility)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="PUBLIC">Public (Searchable in registry)</option>
                <option value="UNLISTED">Unlisted (Visible only via direct link)</option>
                <option value="PRIVATE">Private (Restricted to owner)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Description / Scope Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the intellectual property, methodology, or specification..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Registering & Anchoring to Blockchain...
              </span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Generate Fingerprint & Register Asset
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
