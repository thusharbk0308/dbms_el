import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getErrorMessage } from '@/services/api';
import type { Dispute, Asset } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import {
  AlertCircle,
  Plus,
  ShieldAlert,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const DisputesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedAssetId = searchParams.get('asset_id') || '';

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [assetId, setAssetId] = useState(preselectedAssetId);
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const list = await api.disputes.list();
      setDisputes(list);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId.trim()) {
      setFormError('Please enter a target asset identifier.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('asset_id', assetId.trim());
      formData.append('description', description);
      if (evidenceFile) formData.append('evidence_file', evidenceFile);

      await api.disputes.submit(formData);
      setIsModalOpen(false);
      setDescription('');
      setEvidenceFile(null);
      await fetchDisputes();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading dispute reports..." />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-400" />
            Dispute Tracking & Resolution
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit copyright or authorship disputes with evidence attachments for administrative review.
          </p>
        </div>

        <button
          onClick={() => { setIsModalOpen(true); setFormError(null); }}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 self-start active:scale-95"
        >
          <Plus className="w-4 h-4" />
          File a Dispute
        </button>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <EmptyState
          title="No disputes filed"
          description="You currently have no open or resolved dispute filings on record."
          actionText="File a Dispute"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div
              key={d.dispute_id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.dispute_status} size="sm" />
                  <span className="font-mono text-xs text-slate-400">
                    Dispute #{d.dispute_id} &bull; Target Asset: {d.asset_id}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(d.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Claim Details:</span>
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  {d.description}
                </p>
              </div>

              {d.resolution_notes && (
                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs space-y-1">
                  <span className="text-blue-300 font-semibold uppercase text-[10px] block">
                    Administrator Resolution Notes:
                  </span>
                  <p className="text-slate-300 text-[11px]">{d.resolution_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Dispute Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="File a Copyright / Ownership Dispute">
        <form onSubmit={handleSubmitDispute} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Target Asset Identifier (asset_id) *
            </label>
            <input
              type="text"
              required
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="e.g. ast-8f4b2c1e89a0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Dispute Grounds & Evidence Narrative *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the conflict, prior publication dates, or evidence of original authorship..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Attach Evidence Document (PDF, Image, etc.)
            </label>
            <input
              type="file"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg"
          >
            {isSubmitting ? 'Submitting Dispute...' : 'Submit Dispute for Review'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
