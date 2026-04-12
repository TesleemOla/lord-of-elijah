'use client'

import { authService, UserToken } from '../../services/auth';
import { Activity, Menu as MenuIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { clsx } from 'clsx';

interface HeaderProps {
  user: UserToken | null;
}

export function Header({ user }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-[var(--border)] glass-panel rounded-none flex items-center justify-between px-4 md:px-6 z-40 relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden text-gray-400 hover:text-white transition-colors"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
          
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden xs:block">TransactFlow</span>
          </Link>
        </div>

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

      {/* Mobile Drawer Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Drawer Content */}
      <div 
        className={clsx(
          "fixed inset-y-0 left-0 w-72 bg-black border-r border-[#27272a] z-40 transform transition-transform duration-300 ease-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar 
          user={user} 
          onClose={() => setIsMobileMenuOpen(false)} 
          className="border-none w-full !h-full" 
        />
      </div>
    </>
  );
}
