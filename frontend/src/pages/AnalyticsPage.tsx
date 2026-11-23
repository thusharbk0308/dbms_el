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
        { name: 'Exact Match', value: verifications.exact_match_count, color: '#55AAA7' },
        { name: 'Unregistered', value: verifications.not_registered_count, color: '#82A9D4' },
        { name: 'Mismatch', value: verifications.mismatch_count, color: '#E9786D' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-[#171717] pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#171717] flex items-center gap-2">
          Database Analytics & Intelligence
          <span className="inline-block w-2.5 h-2.5 bg-[#55AAA7] ml-1"></span>
        </h1>
        <p className="text-xs text-[#666666] mt-0.5">
          Real-time PostgreSQL analytical aggregations, registration trends, and cryptographic verification metrics.
        </p>
      </div>

      {/* Top Stat Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 shadow-[4px_4px_0px_#171717]">
          <span className="text-[10px] font-mono font-bold uppercase text-[#666666]">Total Assets</span>
          <p className="text-2xl font-mono font-extrabold text-[#171717] mt-1">{overview?.total_assets ?? 0}</p>
          <span className="text-[10px] font-mono font-bold text-[#55AAA7] mt-0.5 block">
            {overview?.total_confirmed_assets ?? 0} confirmed
          </span>
        </div>
        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 shadow-[4px_4px_0px_#171717]">
          <span className="text-[10px] font-mono font-bold uppercase text-[#666666]">Active Creators</span>
          <p className="text-2xl font-mono font-extrabold text-[#171717] mt-1">{overview?.total_creators ?? 0}</p>
          <span className="text-[10px] font-mono text-[#666666] mt-0.5 block">Registered profiles</span>
        </div>
        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 shadow-[4px_4px_0px_#171717]">
          <span className="text-[10px] font-mono font-bold uppercase text-[#666666]">Total Verifications</span>
          <p className="text-2xl font-mono font-extrabold text-[#55AAA7] mt-1">{overview?.total_verifications ?? 0}</p>
          <span className="text-[10px] font-mono text-[#666666] mt-0.5 block">SHA-256 checks</span>
        </div>
        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 shadow-[4px_4px_0px_#171717]">
          <span className="text-[10px] font-mono font-bold uppercase text-[#666666]">Active Licenses</span>
          <p className="text-2xl font-mono font-extrabold text-[#82A9D4] mt-1">{overview?.total_active_licenses ?? 0}</p>
          <span className="text-[10px] font-mono text-[#666666] mt-0.5 block">Enforced rights</span>
        </div>
        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 shadow-[4px_4px_0px_#171717]">
          <span className="text-[10px] font-mono font-bold uppercase text-[#666666]">Disputes Logged</span>
          <p className="text-2xl font-mono font-extrabold text-[#E9786D] mt-1">{overview?.total_disputes ?? 0}</p>
          <span className="text-[10px] font-mono text-[#666666] mt-0.5 block">Contested claims</span>
        </div>
      </div>

      {/* Row 1: Registration Trends & Category Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#55AAA7]" />
              Registration Velocity Over Time
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#F8F6F2] border border-[#171717]">
              MONTHLY AGGREGATES
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#55AAA7" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#55AAA7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#171717"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                />
                <YAxis
                  stroke="#171717"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #171717',
                    boxShadow: '3px 3px 0px #171717',
                    borderRadius: 0,
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_registrations"
                  stroke="#171717"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#82A9D4]" />
              Assets by IP Category
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#F8F6F2] border border-[#171717]">
              DISTRIBUTION
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="category_name"
                  stroke="#171717"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                />
                <YAxis
                  stroke="#171717"
                  fontSize={10}
                  fontFamily="monospace"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #171717',
                    boxShadow: '3px 3px 0px #171717',
                    borderRadius: 0,
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="asset_count" fill="#191B20" stroke="#171717" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Verification Outcomes & Creator Leaderboard */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Verification Pie Chart */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#55AAA7]" />
              Verification Outcomes Breakdown
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#F8F6F2] border border-[#171717]">
              ACCURACY
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {verificationPieData.length === 0 ? (
              <p className="text-xs text-[#666666] font-mono">No verifications logged yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#171717"
                    strokeWidth={2}
                  >
                    {verificationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #171717',
                      boxShadow: '3px 3px 0px #171717',
                      borderRadius: 0,
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
            <div className="bg-[#F8F6F2] p-2 border border-[#171717]">
              <span className="w-2 h-2 inline-block bg-[#55AAA7] mr-1 border border-[#171717]" />
              <span className="font-bold">Exact Match</span>
            </div>
            <div className="bg-[#F8F6F2] p-2 border border-[#171717]">
              <span className="w-2 h-2 inline-block bg-[#82A9D4] mr-1 border border-[#171717]" />
              <span className="font-bold">Unregistered</span>
            </div>
            <div className="bg-[#F8F6F2] p-2 border border-[#171717]">
              <span className="w-2 h-2 inline-block bg-[#E9786D] mr-1 border border-[#171717]" />
              <span className="font-bold">Mismatch</span>
            </div>
          </div>
        </div>

        {/* Creator Leaderboard */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[6px_6px_0px_#171717] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#171717] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E9786D]" />
              Creator Activity Leaderboard
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#F8F6F2] border border-[#171717]">
              TOP REGISTRANTS
            </span>
          </div>

          <div className="space-y-2">
            {creators.map((c, i) => (
              <div
                key={c.creator_id || i}
                className="p-3 bg-[#F8F6F2] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#191B20] text-white font-mono font-bold flex items-center justify-center text-[10px]">
                    0{i + 1}
                  </span>
                  <div>
                    <span className="font-extrabold text-[#171717] block">{c.full_name}</span>
                    <span className="text-[10px] font-mono text-[#666666]">{c.email}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-[#171717]">
                    {c.asset_count} Assets
                  </span>
                  <span className="text-[10px] font-mono text-[#55AAA7] block">
                    {c.licenses_issued} Licenses
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
