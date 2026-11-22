import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/services/api';
import type { User, Asset, Dispute, AuditLog } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import {
  ShieldAlert,
  Users,
  FolderGit2,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  RotateCw,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [tab, setTab] = useState<'USERS' | 'DISPUTES' | 'ASSETS' | 'AUDIT'>('DISPUTES');
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispute resolution modal
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [u, d, a, logs] = await Promise.all([
        api.admin.listUsers(),
        api.admin.listDisputes(),
        api.admin.listAssets(),
        api.admin.listAuditLogs(),
      ]);
      setUsers(u);
      setDisputes(d);
      setAssets(a);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setIsResolving(true);
    try {
      await api.disputes.resolve(selectedDispute.dispute_id, {
        dispute_status: resolutionStatus,
        resolution_notes: resolutionNotes,
      });
      setSelectedDispute(null);
      setResolutionNotes('');
      await fetchAdminData();
    } catch (err) {
      alert(`Resolution failed: ${getErrorMessage(err)}`);
    } finally {
      setIsResolving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading administrative audit datasets..." />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            Administrator Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review dispute queues, audit user accounts, monitor on-chain asset integrity, and inspect immutable system logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold uppercase tracking-wider">
        <button
          onClick={() => setTab('DISPUTES')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            tab === 'DISPUTES' ? 'border-amber-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          Dispute Queue ({disputes.filter((d) => d.dispute_status === 'PENDING').length} Open)
        </button>

        <button
          onClick={() => setTab('USERS')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            tab === 'USERS' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          Users ({users.length})
        </button>

        <button
          onClick={() => setTab('ASSETS')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            tab === 'ASSETS' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FolderGit2 className="w-4 h-4 text-emerald-400" />
          Platform Assets ({assets.length})
        </button>

        <button
          onClick={() => setTab('AUDIT')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            tab === 'AUDIT' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Dispute Review */}
      {tab === 'DISPUTES' && (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">No disputes in review queue.</p>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/40">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">TARGET ASSET</th>
                    <th className="py-3 px-4">REPORTER</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">FILED AT</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {disputes.map((d) => (
                    <tr key={d.dispute_id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono text-slate-300">#{d.dispute_id}</td>
                      <td className="py-3.5 px-4 font-medium text-white">{d.asset_title || d.asset_id}</td>
                      <td className="py-3.5 px-4 text-slate-300">{d.reporter_name || `User #${d.reporter_id}`}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={d.dispute_status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setResolutionNotes(d.resolution_notes || '');
                          }}
                          className="px-3 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 rounded-lg text-amber-300 text-xs font-semibold transition-colors"
                        >
                          Review & Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Users List */}
      {tab === 'USERS' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/40">
                <th className="py-3 px-4">USER ID</th>
                <th className="py-3 px-4">FULL NAME</th>
                <th className="py-3 px-4">EMAIL</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">JOINED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-mono text-slate-400">#{u.user_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{u.full_name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={u.account_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Platform Assets */}
      {tab === 'ASSETS' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/40">
                <th className="py-3 px-4">ASSET ID</th>
                <th className="py-3 px-4">TITLE</th>
                <th className="py-3 px-4">CREATOR</th>
                <th className="py-3 px-4">REGISTRATION STATUS</th>
                <th className="py-3 px-4">BLOCKCHAIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assets.map((a) => (
                <tr key={a.asset_id} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-mono text-slate-400">{a.asset_id}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{a.title}</td>
                  <td className="py-3.5 px-4 text-slate-300">{a.creator_name || `User #${a.creator_id}`}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={a.registration_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {a.blockchain_records?.[0]?.transaction_hash
                      ? `${a.blockchain_records[0].transaction_hash.slice(0, 10)}... (Block #${a.blockchain_records[0].block_number})`
                      : 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {tab === 'AUDIT' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/40">
                <th className="py-3 px-4">LOG ID</th>
                <th className="py-3 px-4">ACTION</th>
                <th className="py-3 px-4">ENTITY</th>
                <th className="py-3 px-4">USER</th>
                <th className="py-3 px-4">DETAILS</th>
                <th className="py-3 px-4">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono text-slate-400">#{log.log_id}</td>
                  <td className="py-3 px-4 font-semibold text-white">{log.action}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {log.entity_type}:{log.entity_id}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{log.user_email || `User #${log.user_id}`}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{log.details || '—'}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dispute Review Modal */}
      {selectedDispute && (
        <Modal isOpen={!!selectedDispute} onClose={() => setSelectedDispute(null)} title={`Review Dispute #${selectedDispute.dispute_id}`}>
          <form onSubmit={handleResolveDispute} className="space-y-4">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 text-[10px] uppercase">Claim Narrative</span>
              <p className="text-slate-200">{selectedDispute.description}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Resolution Decision *</label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value="RESOLVED">RESOLVED (Confirm prior claim / rights)</option>
                <option value="REJECTED">REJECTED (Insufficient evidence / frivolous)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (Requires further inquiry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Resolution Findings & Notes *</label>
              <textarea
                required
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail administrative findings, external publication checks, or reasoning..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={isResolving}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg"
            >
              {isResolving ? 'Submitting Resolution...' : 'Submit Administrative Decision'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
