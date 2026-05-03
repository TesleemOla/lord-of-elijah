'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, FileText, ShoppingCart, LogOut, Wallet, Loader2 } from 'lucide-react';
import { authService, UserToken } from '../../services/auth';
import { Button } from '../ui/Button';
import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';

interface SidebarProps {
  user: UserToken | null;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ user, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false);

  const { data: dailyBreakdown, isLoading: loadingBreakdown } = useQuery({
    queryKey: ['daily-breakdown'],
    queryFn: () => fetchApi<any>('/transactions/summary/daily-breakdown'),
    enabled: showDailyBreakdown,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ...(user?.role === 'SUPER_ADMIN'
      ? [
        { label: 'Units', href: '/dashboard/units', icon: Users },
        { label: 'Manage Users', href: '/dashboard/users', icon: Users }
      ]
      : []),
    ...(user?.role === 'UNIT_MANAGER'
      ? [{ label: 'POS Terminal', href: '/pos', icon: ShoppingCart }]
      : []),
    { label: 'Products', href: '/dashboard/products', icon: Package },
    { label: 'Clients', href: '/dashboard/clients', icon: Users },
    { label: 'Transactions', href: '/dashboard/transactions', icon: FileText },

  ];

  if (!mounted) return <div className={`w-64 glass-panel border-y-0 border-l-0 rounded-none h-[calc(100vh-4rem)] hidden md:block ${className}`}></div>;

  return (
    <aside className={`w-64 glass-panel border-y-0 border-l-0 rounded-none h-[calc(100vh-4rem)] sticky top-16 flex flex-col justify-between ${className}`}>
      <div className="py-6 px-4 space-y-2 flex-grow">
        <p className="px-4 text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <item.icon className="h-5 w-5 mr-3 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-[var(--border)] space-y-2">
        {user?.role === 'UNIT_MANAGER' && (
          <Button
            variant="outline"
            className="w-full justify-start text-primary border-primary/20 hover:bg-primary/5"
            onClick={() => setShowDailyBreakdown(true)}
          >
            <Wallet className="h-5 w-5 mr-3" />
            Daily Payments
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => {
            onClose?.();
            authService.logout();
          }}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>

      <Modal isOpen={showDailyBreakdown} onClose={() => setShowDailyBreakdown(false)} title="Daily Payments Breakdown">
        <div className="space-y-4 py-4 text-left">
          {loadingBreakdown ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel p-3 bg-green-50/50 border-green-100 text-center">
                  <p className="text-[9px] font-black uppercase text-green-600 tracking-widest mb-1">Cash</p>
                  <p className="text-lg font-black text-slate-900">₦{(dailyBreakdown?.CASH || 0).toLocaleString()}</p>
                </div>
                <div className="glass-panel p-3 bg-blue-50/50 border-blue-100 text-center">
                  <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-1">Transfer</p>
                  <p className="text-lg font-black text-slate-900">₦{(dailyBreakdown?.TRANSFER || 0).toLocaleString()}</p>
                </div>
                <div className="glass-panel p-3 bg-purple-50/50 border-purple-100 col-span-2 text-center">
                  <p className="text-[9px] font-black uppercase text-purple-600 tracking-widest mb-1">POS Terminal</p>
                  <p className="text-lg font-black text-slate-900">₦{(dailyBreakdown?.POS || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="p-3 bg-slate-900 text-white rounded-xl mt-3 flex justify-between items-center">
                <p className="text-xs font-bold uppercase tracking-wider">Total Collected Today</p>
                <p className="text-lg font-black text-primary">₦{(dailyBreakdown?.TOTAL || 0).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </aside>
  );
}
