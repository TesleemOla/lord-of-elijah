'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserToken } from '../../services/auth';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} className="hidden md:flex" />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          {/* subtle glow behind main content */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative z-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
