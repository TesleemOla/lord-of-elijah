'use client'

import { authService, UserToken } from '../../services/auth';
import { Activity } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface HeaderProps {
  user: UserToken | null;
}

export function Header({ user }: HeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-[var(--border)] glass-panel rounded-none flex items-center justify-between px-6 z-10 relative">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">TransactFlow</span>
      </Link>

      <div className="flex items-center gap-4">
        {mounted && user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user.email}</p>
              <p className="text-xs text-primary">{user.role}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-[#27272a] border border-[var(--border)] flex items-center justify-center font-semibold text-sm">
              {user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
