import { Activity } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = "Synchronizing Data...", fullScreen = false }: LoadingScreenProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="relative">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />

        {/* Animated Icon Container */}
        <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.4)] animate-bounce-slow">
          <Activity className="h-10 w-10 text-white animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-black tracking-tight text-slate-900">
          Lord of Elijah <span className="text-primary">...</span>
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div className="h-1 w-1 bg-primary rounded-full animate-ping" />
          <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">{message}</p>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-xl">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-[60vh] flex items-center justify-center">
      {content}
    </div>
  );
}
