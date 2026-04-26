'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Plus } from 'lucide-react';

import { toast } from 'sonner';

import { LoadingScreen } from '../../../components/ui/LoadingScreen';

export default function UnitsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  const { data: units, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: () => fetchApi<any[]>('/units'),
  });

  const createUnit = useMutation({
    mutationFn: (name: string) => fetchApi('/units', {
      method: 'POST',
      body: JSON.stringify({ name, location: name }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setIsModalOpen(false);
      setNewUnitName('');
      toast.success('Unit created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create unit');
    }
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Units Directory</h1>
          <p className="text-slate-500 mt-1">Manage system units and stores.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Unit
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units?.map((unit: any) => (
            <TableRow key={unit._id} className="border-slate-100">
              <TableCell className="font-semibold text-slate-900">{unit.name}</TableCell>
              <TableCell className="text-slate-500">{unit.location}</TableCell>
              <TableCell className="text-slate-400 text-xs">{new Date(unit.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Unit">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-slate-600">Unit Name</label>
            <Input
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="e.g. Branch A"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => createUnit.mutate(newUnitName)}
            disabled={createUnit.isPending || !newUnitName}
          >
            {createUnit.isPending ? 'Creating...' : 'Create Unit'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
