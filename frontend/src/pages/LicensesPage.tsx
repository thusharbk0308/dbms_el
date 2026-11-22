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

  if (loading) return <LoadingSpinner size="lg" text="Loading licensing agreements..." />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            License Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grant, audit, and revoke personal, educational, and commercial licensing permissions for registered assets.
          </p>
        </div>

        <button
          onClick={() => { setIsModalOpen(true); setFormError(null); }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 self-start active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Issue New License
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredLicenses.length} of {licenses.length} licenses
        </span>
      </div>

      {/* Licenses Table / Cards */}
      {filteredLicenses.length === 0 ? (
        <EmptyState
          title="No licenses found"
          description={statusFilter !== 'ALL' ? `No licenses with status ${statusFilter}.` : 'No licenses have been created yet.'}
          actionText="Issue a License"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/40">
                  <th className="py-3 px-4">LICENSE ID</th>
                  <th className="py-3 px-4">ASSET</th>
                  <th className="py-3 px-4">TYPE</th>
                  <th className="py-3 px-4">LICENSEE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">EXPIRY</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLicenses.map((lic) => (
                  <tr key={lic.license_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      LIC-{lic.license_id.toString().padStart(4, '0')}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {lic.asset_title || lic.asset_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-medium text-[11px] border border-blue-800/40">
                        {lic.license_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {lic.licensee_name || `User #${lic.licensee_id}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={lic.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {lic.expiry_date ? new Date(lic.expiry_date).toLocaleDateString() : 'Perpetual'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {lic.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevokeLicense(lic.license_id)}
                          className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg text-[11px] font-medium transition-colors"
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

      {/* Issue License Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Digital Asset License">
        <form onSubmit={handleIssueLicense} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Select Asset *
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            >
              {myAssets.map((a) => (
                <option key={a.asset_id} value={a.asset_id}>
                  {a.title} ({a.asset_id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Licensee User ID *
              </label>
              <input
                type="number"
                required
                value={licenseeId}
                onChange={(e) => setLicenseeId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                License Tier *
              </label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value as LicenseType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value="Personal">Personal</option>
                <option value="Educational">Educational</option>
                <option value="Commercial">Commercial</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Expiry Date (Leave blank for perpetual)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Terms & Conditions / Permission Scope
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g. Non-exclusive, worldwide software deployment rights for educational study."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg"
          >
            {isSubmitting ? 'Granting License...' : 'Issue License Agreement'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
