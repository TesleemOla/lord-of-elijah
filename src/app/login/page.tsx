'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { setupRequired } = await authService.getSetupStatus();
        if (setupRequired) {
          router.push('/setup');
        }
      } catch (err) {
        console.error('Failed to check setup status', err);
      }
    };
    checkSetup();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      
      <div className="w-full max-w-md glass-panel p-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] mb-4">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to your TransactFlow account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
             <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
               {error}
             </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
            <Input 
              type="email" 
              placeholder="admin@system.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            className="w-full mt-6 h-12 text-md" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
