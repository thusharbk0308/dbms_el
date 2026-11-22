import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type {
  AnalyticsOverview,
  CategoryDistribution,
  MonthlyTrend,
  CreatorLeaderboardEntry,
  VerificationAccuracy,
} from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  ShieldCheck,
  Award,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [categories, setCategories] = useState<CategoryDistribution[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [creators, setCreators] = useState<CreatorLeaderboardEntry[]>([]);
  const [verifications, setVerifications] = useState<VerificationAccuracy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [ov, cat, tr, cr, vr] = await Promise.all([
          api.analytics.getOverview(),
          api.analytics.getCategories(),
          api.analytics.getTrends(),
          api.analytics.getCreators(),
          api.analytics.getVerifications(),
        ]);
        setOverview(ov);
        setCategories(cat);
        setTrends(tr);
        setCreators(cr);
        setVerifications(vr);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner size="lg" text="Aggregating platform database analytics..." />;

  const verificationPieData = verifications
    ? [
        { name: 'Exact Match', value: verifications.exact_match_count, color: '#10B981' },
        { name: 'Unregistered', value: verifications.not_registered_count, color: '#F59E0B' },
        { name: 'Mismatch', value: verifications.mismatch_count, color: '#EF4444' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          Database Analytics & Platform Intelligence
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time PostgreSQL analytical aggregations, registration trends, and cryptographic verification metrics.
        </p>
      </div>

      {/* Top Stat Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Assets</span>
          <p className="text-2xl font-bold text-white mt-1">{overview?.total_assets ?? 0}</p>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">{overview?.total_confirmed_assets ?? 0} confirmed</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Creators</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{overview?.total_creators ?? 0}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Verified participants</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Licenses</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{overview?.total_active_licenses ?? 0}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{overview?.total_licenses_issued ?? 0} granted</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Open Disputes</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{overview?.open_disputes ?? 0}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Requires review</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl col-span-2 lg:col-span-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Verification Ratio</span>
          <p className="text-2xl font-bold text-cyan-400 mt-1">
            {verifications?.match_rate_percentage.toFixed(1) ?? '0.0'}%
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{overview?.total_verifications ?? 0} performed</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-blue-400" />
            Assets by Category
          </h2>

          <div className="h-64 w-full">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center pt-24">No category data recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="category_name" stroke="#64748b" fontSize={10} interval={0} angle={-25} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Bar dataKey="asset_count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Verification Accuracy Pie Chart */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verification Outcomes Breakdown
          </h2>

          <div className="h-64 w-full flex items-center justify-center">
            {verificationPieData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">No verifications conducted yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {verificationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex justify-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Exact Match ({verifications?.exact_match_count ?? 0})
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Not Registered ({verifications?.not_registered_count ?? 0})
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Mismatch ({verifications?.mismatch_count ?? 0})
            </span>
          </div>
        </div>
      </div>

      {/* Top Creators Leaderboard */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Most Active Creators Leaderboard
        </h2>

        {creators.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No creator records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">CREATOR</th>
                  <th className="py-2.5 px-3">EMAIL</th>
                  <th className="py-2.5 px-3">REGISTERED ASSETS</th>
                  <th className="py-2.5 px-3">LICENSES ISSUED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {creators.map((c) => (
                  <tr key={c.creator_id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-white">{c.full_name}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{c.email}</td>
                    <td className="py-3 px-3 font-bold text-blue-400">{c.asset_count} assets</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{c.licenses_issued} licenses</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
