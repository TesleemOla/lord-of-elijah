'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../../services/api';
import { authService } from '../../../services/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Download } from 'lucide-react';
import { ReceiptModal } from '../../../components/POS/ReceiptModal';

export default function TransactionsPage() {
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [unitFilter, setUnitFilter] = useState<string>('');
  
  const user = authService.getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => fetchApi<any[]>('/units'),
    enabled: isSuperAdmin,
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', unitFilter],
    queryFn: () => fetchApi<any[]>(`${isSuperAdmin ? '/transactions/all' : '/transactions'}${unitFilter ? `?unitId=${unitFilter}` : ''}`),
  });

  const handleShowReceipt = (tx: any) => {
    setSelectedTx(tx);
    setShowReceipt(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions History</h1>
          <p className="text-gray-400 mt-1">Review operations and sales records.</p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-xl">
            <span className="text-[10px] font-black uppercase text-gray-500 ml-2">Filter by Unit:</span>
            <select 
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold outline-none text-primary cursor-pointer pr-4"
            >
              <option value="" className="bg-[#18181b] text-gray-400">All Units</option>
              {units?.map((u: any) => (
                <option key={u._id} value={u._id} className="bg-[#18181b] text-white">
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Details</TableHead>
            {isSuperAdmin && <TableHead>Unit</TableHead>}
            <TableHead>Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((tx: any) => (
            <TableRow key={tx._id}>
              <TableCell className="font-medium capitalize">{tx.type}</TableCell>
              <TableCell>₦{tx.totalAmount?.toLocaleString() || tx.total?.toLocaleString()}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  tx.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                  tx.status === 'REFUNDED' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {tx.status}
                </span>
              </TableCell>
              <TableCell>{new Date(tx.createdAt || tx.timestamp).toLocaleString()}</TableCell>
              <TableCell className="text-gray-400 text-xs">{tx.items?.length || 0} items</TableCell>
              {isSuperAdmin && (
                <TableCell>
                   <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary/40" />
                      <span className="text-xs font-medium">{tx.unitId?.name || 'Loading...'}</span>
                   </div>
                </TableCell>
              )}
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleShowReceipt(tx)} className="hover:bg-primary/10 hover:text-primary">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">
         Showing {transactions?.length || 0} recent transactions
      </div>

      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        transaction={selectedTx} 
      />
    </div>
  );
}
