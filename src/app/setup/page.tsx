'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Activity, ShieldCheck, Rocket } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { setupRequired } = await authService.getSetupStatus();
        if (!setupRequired) {
          router.push('/login');
        }
      } catch (err) {
        console.error('Setup status check failed', err);
      } finally {
        setChecking(false);
      }
    };
    checkStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    
    try {
      await authService.setupInauguralUser({ email, password });
      alert('Administrator account created successfully! You can now log in.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-12 w-12 text-primary animate-bounce mb-4" />
          <p className="text-gray-400">Initializing TransactFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-xl glass-panel p-10 relative z-10 animate-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.4)] mb-6">
            <Rocket className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">System Initialization</h1>
          <p className="text-gray-400 max-w-md">
            Welcome to <span className="text-primary font-semibold">Lord of Elijah</span> Transaction Management. 
            Create the inaugural Super Administrator account to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                <ShieldCheck className="h-6 w-6 text-green-400 mb-2" />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Super Admin</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                <Activity className="h-6 w-6 text-blue-400 mb-2" />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Full Access</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                <ShieldCheck className="h-6 w-6 text-purple-400 mb-2" />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Multi-Tenant</span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
               {error}
             </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Master Email Address</label>
            <Input 
              type="email" 
              placeholder="admin@lordofelijah.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Secure Password</label>
                <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                required
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Confirm Password</label>
                <Input 
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12"
                required
                />
            </div>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] transition-all duration-500" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Initializing System...' : 'Launch Application'}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-8">
            This account will have unrestricted access to all aspects of the multi-tenant system.
            Keep these credentials extremely secure.
        </p>
      </div>
    </div>
  );
}
