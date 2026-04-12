'use client'

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../services/api';
import { authService } from '../../../services/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { ReceiptModal } from '../../../components/POS/ReceiptModal';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';

import { LoadingScreen } from '../../../components/ui/LoadingScreen';

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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['transactions', unitFilter],
    queryFn: ({ pageParam = 1 }) => 
      fetchApi<any[]>(`${isSuperAdmin ? '/transactions/all' : '/transactions'}?page=${pageParam}&limit=50${unitFilter ? `&unitId=${unitFilter}` : ''}`),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const transactions = data?.pages.flatMap(p => p) || [];

  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleShowReceipt = (tx: any) => {
    setSelectedTx(tx);
    setShowReceipt(true);
  };

  if (isLoading) return <LoadingScreen message="Retrieving Master Logs..." />;

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
            <TableRow 
              key={tx._id} 
              className="group cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => handleShowReceipt(tx)}
            >
              <TableCell className="font-medium capitalize">{tx.type}</TableCell>
              <TableCell>₦{tx.totalAmount?.toLocaleString() || tx.total?.toLocaleString()}</TableCell>
              <TableCell>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  tx.type === 'SALE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  tx.type === 'REFUND' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {tx.type === 'SALE' ? 'Completed' : tx.type === 'REFUND' ? 'Refunded' : 'Voided'}
                </span>
              </TableCell>
              <TableCell>{new Date(tx.createdAt || tx.timestamp).toLocaleString()}</TableCell>
              <TableCell className="text-gray-400 text-xs">{tx.items?.length || 0} items</TableCell>
              {isSuperAdmin && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/40" />
                    <span className="text-xs font-medium">{tx.unitId?.name || 'Unknown'}</span>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowReceipt(tx);
                  }} 
                  className="hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Sentinel for Infinite Scroll */}
      <div ref={targetRef} className="py-8 flex justify-center">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-primary animate-pulse">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading more history...</span>
          </div>
        ) : hasNextPage ? (
          <div className="h-1" />
        ) : transactions.length > 0 ? (
          <div className="mt-4 text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">
            Showing {transactions.length} record(s). End of history.
          </div>
        ) : null}
      </div>

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        transaction={selectedTx}
      />
    </div>
  );
}
