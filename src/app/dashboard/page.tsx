'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { authService } from '../../services/auth';
import { CreditCard, DollarSign, Package, TrendingUp, ArrowUpRight, AlertCircle, PieChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'count'>('revenue');
  const [focusedUnitId, setFocusedUnitId] = useState<string | null>(null);

  const router = useRouter();
  const user = authService.getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary', isSuperAdmin ? 'global' : 'local', period],
    queryFn: () =>
      fetchApi<any>(`${isSuperAdmin ? '/transactions/summary/global' : '/transactions/summary/local'}?period=${period}`),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', period, isSuperAdmin ? 'global' : 'local', focusedUnitId],
    queryFn: () => fetchApi<any>(`/transactions/analytics?period=${period}${focusedUnitId ? `&unitId=${focusedUnitId}` : ''}`),
  });

  const { data: unitPerformance } = useQuery({
    queryKey: ['unit-performance'],
    queryFn: () => fetchApi<any[]>('/transactions/performance/units'),
    enabled: isSuperAdmin,
  });

  if (summaryLoading || analyticsLoading) {
    return <LoadingScreen message="Assembling Business Intelligence..." />;
  }

  const focusedUnit = unitPerformance?.find(u => u.unitId === focusedUnitId);

  const stats = [
    {
      id: 'revenue',
      title: focusedUnitId ? `${focusedUnit?.unitName} Revenue` : "Amount Received",
      value: `₦${(analytics?.totalRevenue || 0).toLocaleString()}`,
      description: "Actual cash collected from transactions",
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      label: focusedUnitId ? `Earnings for this unit` : "Total income for selected range"
    },
    {
      id: 'outstanding',
      title: "Outstanding Balance",
      value: `₦${(summary?.totalOutstanding || 0).toLocaleString()}`,
      description: "Amount pending from partial/unpaid sales",
      icon: AlertCircle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      label: "Money yet to be collected"
    },
    {
      id: 'count',
      title: focusedUnitId ? `${focusedUnit?.unitName} Sales` : "Total Sales",
      value: (analytics?.totalTransactions || 0).toLocaleString(),
      description: "Number of completed sale transactions",
      icon: CreditCard,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      label: focusedUnitId ? `Transactions in this unit` : "Number of completed sales"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            {focusedUnitId ? focusedUnit?.unitName : 'Dashboard Overview'}
            {focusedUnitId && (
              <button
                onClick={() => setFocusedUnitId(null)}
                className="text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-primary border border-primary/20 transition-all"
              >
                Clear Filter
              </button>
            )}
          </h1>
          <p className="text-slate-500 mt-1">
            {isSuperAdmin
              ? (focusedUnitId ? `Detailed performance for ${focusedUnit?.unitName}` : 'Real-time multi-tenant analytics')
              : 'Performance metrics for your unit'}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${period === p
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isSuperAdmin && !focusedUnitId && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Unit Performance Breakdown</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {unitPerformance?.map((unit: any) => (
              <div
                key={unit.unitId}
                onClick={() => setFocusedUnitId(unit.unitId)}
                className="min-w-[240px] glass-panel p-5 bg-white hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Package className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-900 group-hover:text-primary" />
                </div>
                <h4 className="font-bold text-slate-800 mb-1">{unit.unitName}</h4>
                <div className="flex justify-between items-end">
                  <p className="text-xl font-black text-indigo-600">₦{unit.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{unit.count} Sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            onClick={() => {
              if (stat.id === 'revenue' || stat.id === 'count') {
                setActiveMetric(stat.id as any);
              } else if (stat.id === 'outstanding') {
                router.push('/dashboard/transactions?paymentStatus=PARTIAL');
              }
            }}
            className={`glass-panel p-6 flex flex-col justify-between transition-all cursor-pointer bg-white ${activeMetric === stat.id ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-md shadow-primary/5' : 'hover:border-slate-200'
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest leading-none mb-2">
                  {stat.title}
                  {activeMetric === stat.id && <ArrowUpRight className="h-3 w-3 text-primary animate-pulse" />}
                </p>
                <h2 className="text-3xl font-black text-slate-900">{stat.value}</h2>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none truncate">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Payment Status Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { status: 'PAID', count: summary?.paidCount || 0, label: 'Paid in Full', color: 'text-green-600', border: 'border-green-100', bg: 'bg-green-50' },
            { status: 'PARTIAL', count: summary?.partialCount || 0, label: 'Partial Payment', color: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50' },
            { status: 'UNPAID', count: summary?.unpaidCount || 0, label: 'No Payment', color: 'text-red-600', border: 'border-red-100', bg: 'bg-red-50' }
          ].map((p) => (
            <div
              key={p.status}
              onClick={() => router.push(`/dashboard/transactions?paymentStatus=${p.status}`)}
              className={`glass-panel p-4 ${p.bg} ${p.border} hover:bg-white/5 transition-all cursor-pointer group flex items-center justify-between`}
            >
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 transition-colors">{p.label}</p>
                <h4 className={`text-2xl font-black ${p.color}`}>{p.count}</h4>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-900 group-hover:text-primary transition-all" />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 capitalize">{activeMetric} Analysis</h3>
            <p className="text-sm text-slate-500">
              {focusedUnitId
                ? `Fluctuation patterns for ${focusedUnit?.unitName}`
                : `Global visualization of ${activeMetric} over the selected ${period}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/20" />
              <span className="text-xs text-slate-500">Trend Line</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full min-h-[400px] min-w-0">
          {analyticsLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.chartData || []}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (period === 'year') {
                      const parts = val.split('-');
                      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
                      return date.toLocaleString('default', { month: 'short' });
                    }
                    return val.split('-').slice(1).join('/');
                  }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    activeMetric === 'revenue'
                      ? `₦${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
                      : val
                  }
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(val: any) => [
                    activeMetric === 'revenue' ? `₦${val.toLocaleString()}` : val,
                    activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
