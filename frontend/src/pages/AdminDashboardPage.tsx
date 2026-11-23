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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#171717] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
            Administrator Control Center
            <span className="inline-block w-2.5 h-2.5 bg-[#E9786D] ml-1"></span>
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Review dispute queues, audit user accounts, monitor on-chain asset integrity, and inspect immutable system logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-[#171717] gap-3 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setTab('DISPUTES')}
          className={`px-4 py-2 border-2 border-[#171717] transition-all flex items-center gap-1.5 ${
            tab === 'DISPUTES'
              ? 'bg-[#E9786D] text-[#171717] shadow-[2px_2px_0px_#171717]'
              : 'bg-[#FFFFFF] text-[#171717] hover:bg-[#F8F6F2]'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Disputes Queue ({disputes.length})
        </button>
        <button
          onClick={() => setTab('USERS')}
          className={`px-4 py-2 border-2 border-[#171717] transition-all flex items-center gap-1.5 ${
            tab === 'USERS'
              ? 'bg-[#191B20] text-white shadow-[2px_2px_0px_#171717]'
              : 'bg-[#FFFFFF] text-[#171717] hover:bg-[#F8F6F2]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Users ({users.length})
        </button>
        <button
          onClick={() => setTab('ASSETS')}
          className={`px-4 py-2 border-2 border-[#171717] transition-all flex items-center gap-1.5 ${
            tab === 'ASSETS'
              ? 'bg-[#191B20] text-white shadow-[2px_2px_0px_#171717]'
              : 'bg-[#FFFFFF] text-[#171717] hover:bg-[#F8F6F2]'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          Assets ({assets.length})
        </button>
        <button
          onClick={() => setTab('AUDIT')}
          className={`px-4 py-2 border-2 border-[#171717] transition-all flex items-center gap-1.5 ${
            tab === 'AUDIT'
              ? 'bg-[#191B20] text-white shadow-[2px_2px_0px_#171717]'
              : 'bg-[#FFFFFF] text-[#171717] hover:bg-[#F8F6F2]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab: Disputes Queue */}
      {tab === 'DISPUTES' && (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#171717] bg-[#F8F6F2] text-[#171717] font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Dispute ID</th>
                <th className="py-3 px-4 font-bold">Target Asset</th>
                <th className="py-3 px-4 font-bold">Reporter</th>
                <th className="py-3 px-4 font-bold">Contestation Reason</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#171717]">
              {disputes.map((d) => (
                <tr key={d.dispute_id} className="hover:bg-[#F8F6F2] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold">#{d.dispute_id}</td>
                  <td className="py-3 px-4 font-mono text-xs">{d.asset_id}</td>
                  <td className="py-3 px-4 font-bold">User #{d.reporter_id}</td>
                  <td className="py-3 px-4 max-w-xs truncate text-[#666666]">
                    {d.description}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={d.dispute_status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedDispute(d);
                        setResolutionStatus('RESOLVED');
                        setResolutionNotes('');
                      }}
                      className="px-2.5 py-1 bg-[#191B20] text-white font-bold uppercase text-[10px] border border-[#171717] shadow-[1px_1px_0px_#171717] hover:bg-[#E9786D] hover:text-[#171717] transition-all"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Users */}
      {tab === 'USERS' && (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#171717] bg-[#F8F6F2] text-[#171717] font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">User ID</th>
                <th className="py-3 px-4 font-bold">Full Name</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Role</th>
                <th className="py-3 px-4 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#171717]">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-[#F8F6F2] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold">#{u.user_id}</td>
                  <td className="py-3 px-4 font-bold text-[#171717]">{u.full_name}</td>
                  <td className="py-3 px-4 font-mono text-[#666666]">{u.email}</td>
                  <td className="py-3 px-4 font-mono">
                    <span className="px-2 py-0.5 bg-[#82A9D4]/25 border border-[#171717] font-bold text-[10px] uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#666666] text-[11px]">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Assets Audit */}
      {tab === 'ASSETS' && (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#171717] bg-[#F8F6F2] text-[#171717] font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Asset ID & Title</th>
                <th className="py-3 px-4 font-bold">Creator ID</th>
                <th className="py-3 px-4 font-bold">SHA-256 Digest</th>
                <th className="py-3 px-4 font-bold">Registration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#171717]">
              {assets.map((a) => (
                <tr key={a.asset_id} className="hover:bg-[#F8F6F2] transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#171717] block">{a.title}</span>
                    <span className="font-mono text-[10px] text-[#666666]">{a.asset_id}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">User #{a.creator_id}</td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {a.current_version?.file_hash ? `${a.current_version.file_hash.slice(0, 10)}...` : 'Pending'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={a.registration_status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {tab === 'AUDIT' && (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#171717] bg-[#F8F6F2] text-[#171717] font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Actor</th>
                <th className="py-3 px-4 font-bold">Action</th>
                <th className="py-3 px-4 font-bold">Target Entity</th>
                <th className="py-3 px-4 font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#171717]">
              {auditLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-[#F8F6F2] transition-colors font-mono text-xs">
                  <td className="py-3 px-4 text-[#666666] text-[11px]">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#171717]">
                    User #{log.user_id ?? 'System'}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#55AAA7]">{log.action}</td>
                  <td className="py-3 px-4 text-[#171717]">{log.entity_type} #{log.entity_id}</td>
                  <td className="py-3 px-4 text-[#666666] text-[11px] truncate max-w-xs" title={log.details}>
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Resolve Dispute */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title="Admin Dispute Adjudication"
      >
        <form onSubmit={handleResolveDispute} className="space-y-4">
          <div className="p-3 bg-[#F8F6F2] border-2 border-[#171717] space-y-1 text-xs">
            <span className="font-mono font-bold text-[10px] uppercase text-[#666666] block">Contested Asset</span>
            <p className="font-bold text-[#171717]">{selectedDispute?.asset_id}</p>
            <p className="text-[#666666] mt-1">{selectedDispute?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Adjudication Verdict *
            </label>
            <select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value)}
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            >
              <option value="RESOLVED">RESOLVED (Confirm Dispute Valid)</option>
              <option value="REJECTED">REJECTED (Dismiss Dispute)</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW (Request Further Evidence)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#171717] mb-1 uppercase tracking-wider">
              Resolution Findings & Legal Notes *
            </label>
            <textarea
              rows={4}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="State rationale based on cryptographic timestamps, prior block possession, or provided license documentation..."
              className="w-full bg-[#F8F6F2] border-2 border-[#171717] p-2.5 text-xs font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedDispute(null)}
              className="px-4 py-2 bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] font-bold text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResolving}
              className="px-4 py-2 bg-[#191B20] text-white border-2 border-[#171717] font-bold text-xs uppercase shadow-[2px_2px_0px_#171717]"
            >
              {isResolving ? 'Recording...' : 'Commit Adjudication'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
