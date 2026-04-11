'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Plus } from 'lucide-react';

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
      body: JSON.stringify({ name, location: 'HQ' }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setIsModalOpen(false);
      setNewUnitName('');
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Units Directory</h1>
          <p className="text-gray-400 mt-1">Manage system units and stores.</p>
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
            <TableRow key={unit._id}>
              <TableCell className="font-medium">{unit.name}</TableCell>
              <TableCell>{unit.location}</TableCell>
              <TableCell>{new Date(unit.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Unit">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Unit Name</label>
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
