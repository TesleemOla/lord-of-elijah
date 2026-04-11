'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Plus, UserPlus } from 'lucide-react';

import { toast } from 'sonner';

import { LoadingScreen } from '../../../components/ui/LoadingScreen';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    unitId: '',
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchApi<any[]>('/users'),
  });

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => fetchApi<any[]>('/units'),
  });

  const createUser = useMutation({
    mutationFn: (data: typeof formData) => fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify({ 
        ...data, 
        role: 'UNIT_MANAGER' 
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setFormData({ email: '', password: '', unitId: '' });
      toast.success('Unit Manager created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create manager account');
    }
  });

  if (usersLoading) return <LoadingScreen message="Identifying Personnel..." />;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manage Managers</h1>
          <p className="text-gray-400 mt-1">Add and manage unit managers and their credentials.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Manager
        </Button>
      </div>

      <div className="glass-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Unit</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user: any) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium text-white">{user.email}</TableCell>
                <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        user.role === 'SUPER_ADMIN' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                        {user.role}
                    </span>
                </TableCell>
                <TableCell className="text-gray-400">
                    {user.unitId ? (typeof user.unitId === 'string' ? user.unitId : user.unitId.name) : 'System Wide'}
                </TableCell>
                <TableCell className="text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Unit Manager">
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-gray-300">Email Address</label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="manager@lordofelijah.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-gray-300">Initial Password</label>
              <PasswordInput 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-gray-300">Assign Unit</label>
              <select 
                title="Assign Unit"
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full flex h-12 rounded-xl bg-black/40 border border-[#27272a] px-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all outline-none"
              >
                <option value="">Select a unit...</option>
                {units?.map(unit => (
                    <option key={unit._id} value={unit._id}>{unit.name} ({unit.location})</option>
                ))}
              </select>
            </div>
          </div>

          <Button 
            className="w-full h-12" 
            onClick={() => createUser.mutate(formData)}
            disabled={createUser.isPending || !formData.email || !formData.password || !formData.unitId}
          >
            {createUser.isPending ? 'Creating Account...' : 'Create Manager Account'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
