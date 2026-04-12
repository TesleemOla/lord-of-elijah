'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket');
      
      // Join rooms based on role
      if (user.role === 'SUPER_ADMIN') {
        newSocket.emit('joinRoom', 'admins');
      } else if (user.unitId) {
        newSocket.emit('joinRoom', `unit_${user.unitId}`);
      }
    });

    newSocket.on('lowStockAlert', (data: { name: string; stock: number; sku: string }) => {
      // Refresh UI data
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.error(`Low Stock Alert: ${data.name} (${data.sku}) is at ${data.stock} units!`, {
        description: 'Please replenish stock as soon as possible.',
        icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
        duration: 8000,
      });
    });

    newSocket.on('analyticsUpdate', () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
