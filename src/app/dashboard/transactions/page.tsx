'use client'

import { useState, useEffect, Suspense } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../services/api';
import { authService } from '../../../services/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Download, Loader2, Filter, Wallet } from 'lucide-react';
import { ReceiptModal } from '../../../components/POS/ReceiptModal';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { useSearchParams } from 'next/navigation';
import { PaymentModal } from '../../../components/Transactions/PaymentModal';

import { LoadingScreen } from '../../../components/ui/LoadingScreen';

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('paymentStatus') || '';

  const [showReceipt, setShowReceipt] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

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
    queryKey: ['transactions', unitFilter, statusFilter],
    queryFn: ({ pageParam = 1 }) => 
      fetchApi<any[]>(`${isSuperAdmin ? '/transactions/all' : '/transactions'}?page=${pageParam}&limit=50${unitFilter ? `&unitId=${unitFilter}` : ''}${statusFilter ? `&paymentStatus=${statusFilter}` : ''}`),
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

  const handleShowPayment = (tx: any) => {
    setSelectedTx(tx);
    setShowPayment(true);
  };

  if (isLoading) return <LoadingScreen message="Retrieving Master Logs..." />;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Transactions History</h1>
          <p className="text-slate-500 mt-1">Review operations and sales records.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1.5 rounded-xl">
              <span className="text-[10px] font-black uppercase text-gray-500 ml-2">Payment Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold outline-none text-primary cursor-pointer pr-4"
              >
                <option value="" className="bg-white text-slate-500 text-xs">All Statuses</option>
                <option value="PAID" className="bg-white text-slate-900 text-xs">Paid in Full</option>
                <option value="PARTIAL" className="bg-white text-slate-900 text-xs">Partial Payment</option>
                <option value="UNPAID" className="bg-white text-slate-900 text-xs">Unpaid</option>
              </select>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1.5 rounded-xl">
              <span className="text-[10px] font-black uppercase text-slate-500 ml-2">Unit:</span>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold outline-none text-primary cursor-pointer pr-4"
              >
                <option value="" className="bg-white text-slate-500">All Units</option>
                {units?.map((u: any) => (
                  <option key={u._id} value={u._id} className="bg-white text-slate-900">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Grand Total</TableHead>
            <TableHead>Amt Paid</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Date</TableHead>
            {isSuperAdmin && <TableHead>Unit</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((tx: any) => (
            <TableRow 
              key={tx._id} 
              className="group cursor-pointer hover:bg-slate-50 transition-colors border-slate-100"
              onClick={() => handleShowReceipt(tx)}
            >
              <TableCell className="font-semibold text-slate-900 capitalize">{tx.type}</TableCell>
              <TableCell className="font-black text-slate-900">₦{tx.total?.toLocaleString()}</TableCell>
              <TableCell className="text-slate-500">₦{tx.amountPaid?.toLocaleString()}</TableCell>
              <TableCell>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  tx.type !== 'SALE' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                  tx.amountPaid >= tx.total ? 'bg-green-100 text-green-700 border-green-200' :
                  tx.amountPaid > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-red-100 text-red-700 border-red-200'
                }`}>
                  {tx.type !== 'SALE' ? tx.type :
                   tx.amountPaid >= tx.total ? 'Paid' : 
                   tx.amountPaid > 0 ? 'Partial' : 'Unpaid'}
                </span>
              </TableCell>
              <TableCell className="text-xs text-slate-500 font-medium">{new Date(tx.createdAt || tx.timestamp).toLocaleString()}</TableCell>
              {isSuperAdmin && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/40" />
                    <span className="text-xs font-semibold text-slate-700">{tx.unitId?.name || 'Unknown'}</span>
                  </div>
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    {tx.type === 'SALE' && tx.amountPaid < tx.total && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShowPayment(tx);
                            }}
                            className="h-8 text-[10px] font-black uppercase border-primary/20 hover:bg-primary/10 text-primary gap-2"
                        >
                            <Wallet className="h-3 w-3" /> Clear Balance
                        </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleShowReceipt(tx);
                        }} 
                        className="h-8 text-slate-500 hover:text-slate-900 transition-all"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
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
          <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
            Showing {transactions.length} record(s). End of history.
          </div>
        ) : null}
      </div>

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        transaction={selectedTx}
      />

      {selectedTx && (
        <PaymentModal
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            transaction={selectedTx}
        />
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Transactions..." />}>
      <TransactionsContent />
    </Suspense>
  );
}
