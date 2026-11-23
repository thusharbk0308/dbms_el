import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, getErrorMessage } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { License, Asset, LicenseType } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Award,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const LicensesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedAssetId = searchParams.get('asset_id') || '';

  const [licenses, setLicenses] = useState<License[]>([]);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Issue License Form
  const [assetId, setAssetId] = useState(preselectedAssetId);
  const [licenseeId, setLicenseeId] = useState<number>(2);
  const [licenseType, setLicenseType] = useState<LicenseType>('Commercial');
  const [terms, setTerms] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const [lics, assets] = await Promise.all([
        api.licenses.list(),
        api.assets.list(),
      ]);
      setLicenses(lics);
      setMyAssets(assets);
      if (!assetId && assets.length > 0) {
        setAssetId(assets[0].asset_id);
      }
    } catch (err) {
      console.error('Failed to load licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleIssueLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) {
      setFormError('Please select a valid digital asset.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      await api.licenses.create({
        asset_id: assetId,
        licensee_id: Number(licenseeId),
        license_type: licenseType,
        terms: terms || undefined,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      });
      setIsModalOpen(false);
      setTerms('');
      setExpiryDate('');
      await fetchLicenses();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeLicense = async (licenseId: number) => {
    if (!confirm('Are you sure you want to revoke this license? This action cannot be undone.')) return;
    try {
      await api.licenses.updateStatus(licenseId, 'REVOKED');
      await fetchLicenses();
    } catch (err) {
      alert(`Failed to revoke license: ${getErrorMessage(err)}`);
    }
  };

  const filteredLicenses = licenses.filter((l) => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  if (loading) return <LoadingSpinner size="lg" text="Loading smart contract licensing registry..." />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#171717] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
            Licensing & Rights Management
            <span className="inline-block w-2.5 h-2.5 bg-[#82A9D4] ml-1"></span>
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Issue, audit, and revoke Commercial, Educational, and Personal licenses for registered assets.
          </p>
        </div>

        <button
          onClick={() => { setIsModalOpen(true); setFormError(null); }}
          className="px-4 py-2.5 bg-[#191B20] hover:bg-[#171717] text-white font-extrabold text-xs uppercase tracking-wider border-2 border-[#171717] shadow-[3px_3px_0px_#171717] hover:shadow-[1px_1px_0px_#171717] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4 text-[#55AAA7]" />
          Issue New License
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase">
          <span className="text-[#666666]">Filter By Status:</span>
          {['ALL', 'ACTIVE', 'REVOKED', 'EXPIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 border-2 border-[#171717] transition-all ${
                statusFilter === st
                  ? 'bg-[#191B20] text-white shadow-[2px_2px_0px_#171717]'
                  : 'bg-[#F8F6F2] text-[#171717] hover:bg-[#FFFFFF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono font-bold text-[#666666]">
          {filteredLicenses.length} Total Licenses
        </span>
      </div>

      {/* Licenses Table */}
      {filteredLicenses.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No licenses matching criteria"
          description="Issue digital licenses to grant educational or commercial rights to external creators or institutions."
          actionText="Issue License Now"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#171717] bg-[#F8F6F2] text-[#171717] font-mono uppercase text-[10px]">
                  <th className="py-3 px-4 font-bold">License ID & Asset</th>
                  <th className="py-3 px-4 font-bold">Grantee</th>
                  <th className="py-3 px-4 font-bold">Scope / Type</th>
                  <th className="py-3 px-4 font-bold">Validity Period</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#171717]">
                {filteredLicenses.map((lic) => (
                  <tr key={lic.license_id} className="hover:bg-[#F8F6F2] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-[#171717] block">
                        #{lic.license_id} &bull; {lic.asset_title || lic.asset_id}
                      </span>
                      <span className="text-[10px] font-mono text-[#666666]">{lic.asset_id}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-[#171717]">
                      User #{lic.licensee_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#82A9D4]/25 border border-[#171717] font-bold text-[10px] uppercase">
                        {lic.license_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#666666]">
                      <div>Start: {lic.start_date ? new Date(lic.start_date).toLocaleDateString() : 'Immediate'}</div>
                      <div>End: {lic.expiry_date ? new Date(lic.expiry_date).toLocaleDateString() : 'Perpetual'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lic.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {lic.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevokeLicense(lic.license_id)}
                          className="px-2.5 py-1 bg-[#E9786D] hover:bg-[#d66a60] text-[#171717] font-bold uppercase text-[10px] border border-[#171717] shadow-[1px_1px_0px_#171717] transition-all"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Issue License */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Intellectual Property License"
      >
        <form onSubmit={handleIssueLicense} className="space-y-4">
          {formError && (
            <div className="p-3 bg-[#E9786D]/20 border-2 border-[#171717] text-[#171717] text-xs font-bold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Target Digital Asset *
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            >
              {myAssets.map((a) => (
                <option key={a.asset_id} value={a.asset_id}>
                  {a.title} ({a.asset_id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
                Grantee User ID *
              </label>
              <input
                type="number"
                required
                value={licenseeId}
                onChange={(e) => setLicenseeId(Number(e.target.value))}
                className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
                License Type *
              </label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value as LicenseType)}
                className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
              >
                <option value="Commercial">Commercial</option>
                <option value="Personal">Personal</option>
                <option value="Educational">Educational</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Expiry Date (Leave empty for Perpetual)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Terms & Stipulations
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g. Non-exclusive worldwide distribution right..."
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
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
              className="px-4 py-2 bg-[#191B20] text-white border-2 border-[#171717] font-bold text-xs uppercase shadow-[2px_2px_0px_#171717]"
            >
              {isSubmitting ? 'Issuing...' : 'Issue License'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
