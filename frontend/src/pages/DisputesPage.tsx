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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#171717] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
            Dispute Tracking & Resolution
            <span className="inline-block w-2.5 h-2.5 bg-[#E9786D] ml-1"></span>
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Submit copyright or authorship disputes with evidence attachments for administrative review.
          </p>
        </div>

        <button
          onClick={() => { setIsModalOpen(true); setFormError(null); }}
          className="px-4 py-2.5 bg-[#E9786D] hover:bg-[#d66a60] text-[#171717] font-extrabold text-xs uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4 text-[#171717]" />
          File a Dispute
        </button>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No disputes on record"
          description="The intellectual property registry contains zero contested ownership claims at this time."
          actionText="File New Dispute"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div
              key={d.dispute_id}
              className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] p-6 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#171717]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#171717]">
                    Dispute #{d.dispute_id}
                  </span>
                  <span className="text-xs text-[#666666] font-mono">&bull; Target: {d.asset_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.dispute_status} size="sm" />
                  <span className="text-[10px] font-mono text-[#666666]">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <p className="text-[#171717] font-medium leading-relaxed">
                  <strong>Contestation Claims:</strong> {d.description || 'No description provided.'}
                </p>

                {d.resolution_notes && (
                  <div className="bg-[#F8F6F2] p-3 border border-[#171717]">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#55AAA7] block">
                      Admin Resolution Findings
                    </span>
                    <p className="text-[#171717] mt-0.5">{d.resolution_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: File Dispute */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Intellectual Property Dispute"
      >
        <form onSubmit={handleSubmitDispute} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[#E9786D]/20 border-2 border-[#171717] text-[#171717] text-xs font-bold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Contested Asset Identifier (UUID) *
            </label>
            <input
              type="text"
              required
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="e.g. ast-7a2b9c1d-006"
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Contestation Grounds & Detailed Explanation *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State reasons for claim contestation, evidence of prior authorship, or copyright infringement..."
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Evidence Document (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2 text-xs font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] font-bold text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#E9786D] text-[#171717] border-2 border-[#171717] font-bold text-xs uppercase shadow-[2px_2px_0px_#171717]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
