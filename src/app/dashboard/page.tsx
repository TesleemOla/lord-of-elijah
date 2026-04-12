'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { authService } from '../../services/auth';
import { CreditCard, DollarSign, Package, TrendingUp, ArrowUpRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'count'>('revenue');
  const [focusedUnitId, setFocusedUnitId] = useState<string | null>(null);
  
  const user = authService.getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary', isSuperAdmin ? 'global' : 'local'],
    queryFn: () => 
      fetchApi<any>(isSuperAdmin ? '/transactions/summary/global' : '/transactions/summary/local'),
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
      title: focusedUnitId ? `${focusedUnit?.unitName} Revenue` : "Total Revenue",
      value: `₦${(analytics?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      label: focusedUnitId ? `Earnings for this unit` : "Total income for selected range"
    },
    {
      id: 'count',
      title: focusedUnitId ? `${focusedUnit?.unitName} Sales` : "Total Sales",
      value: (analytics?.totalTransactions || 0).toLocaleString(),
      icon: CreditCard,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      label: focusedUnitId ? `Transactions in this unit` : "Number of completed sales"
    },
    {
       id: 'global',
       title: isSuperAdmin ? "System Units" : "Today's Summary",
       value: isSuperAdmin ? (summary?.totalUnits || 0) : `₦${(summary?.todayRevenue || 0).toLocaleString()}`,
       icon: isSuperAdmin ? Package : TrendingUp,
       color: "text-purple-400",
       bgColor: "bg-purple-500/10",
       label: isSuperAdmin ? "Managed business units" : "Revenue generated today"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
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
          <p className="text-gray-400 mt-1">
            {isSuperAdmin 
              ? (focusedUnitId ? `Detailed performance for ${focusedUnit?.unitName}` : 'Real-time multi-tenant analytics') 
              : 'Performance metrics for your unit'}
          </p>
        </div>
        
        <div className="flex bg-[#18181b] p-1 rounded-xl border border-[#27272a]">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${
                period === p 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isSuperAdmin && !focusedUnitId && (
        <div className="animate-in slide-in-from-top-4 duration-500">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Unit Performance Breakdown</h3>
           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {unitPerformance?.map((unit: any) => (
                <div 
                  key={unit.unitId}
                  onClick={() => setFocusedUnitId(unit.unitId)}
                  className="min-w-[240px] glass-panel p-5 bg-gradient-to-br from-white/5 to-transparent hover:border-primary/50 transition-all cursor-pointer group"
                >
                   <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Package className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-600 group-hover:text-primary" />
                   </div>
                   <h4 className="font-bold text-white mb-1">{unit.unitName}</h4>
                   <div className="flex justify-between items-end">
                      <p className="text-xl font-black text-indigo-400">₦{unit.revenue.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{unit.count} Sales</p>
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
            onClick={() => (stat.id === 'revenue' || stat.id === 'count') && setActiveMetric(stat.id as any)}
            className={`glass-panel p-6 flex flex-col justify-between transition-all cursor-pointer ${
              activeMetric === stat.id ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 flex items-center gap-2 uppercase tracking-tighter">
                  {stat.title}
                  {activeMetric === stat.id && <ArrowUpRight className="h-3 w-3 text-primary animate-pulse" />}
                </p>
                <h2 className="text-3xl font-bold mt-2 text-white">{stat.value}</h2>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h3 className="text-xl font-bold text-white capitalize">{activeMetric} Analysis</h3>
                <p className="text-sm text-gray-400">
                  {focusedUnitId 
                    ? `Fluctuation patterns for ${focusedUnit?.unitName}` 
                    : `Global visualization of ${activeMetric} over the selected ${period}`}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <span className="text-xs text-gray-400">Trend Line</span>
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  stroke="#71717a" 
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
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => 
                     activeMetric === 'revenue' 
                      ? `₦${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}` 
                      : val
                  }
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#71717a', marginBottom: '4px' }}
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
