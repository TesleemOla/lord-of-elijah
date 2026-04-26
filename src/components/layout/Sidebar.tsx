'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, FileText, ShoppingCart, LogOut } from 'lucide-react';
import { authService, UserToken } from '../../services/auth';
import { Button } from '../ui/Button';
import { useEffect, useState } from 'react';

interface SidebarProps {
  user: UserToken | null;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ user, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

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
    <aside className={`w-64 glass-panel border-y-0 border-l-0 rounded-none h-full md:h-[calc(100vh-4rem)] flex flex-col justify-between ${className}`}>
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

      <div className="p-4 border-t border-[var(--border)]">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => {
            onClose?.();
            authService.logout();
          }}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
