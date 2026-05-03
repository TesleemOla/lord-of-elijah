'use client'

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';
import { Wallet, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export function PaymentModal({ isOpen, onClose, transaction }: PaymentModalProps) {
  const queryClient = useQueryClient();
  const balance = transaction.total - transaction.amountPaid;
  const [amount, setAmount] = useState<number>(balance);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'POS'>('CASH');

  const mutation = useMutation({
    mutationFn: (payAmount: number) =>
      fetchApi(`/transactions/${transaction._id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ amount: payAmount, paymentMethod }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Payment Recorded Successfully');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record payment');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return toast.error('Amount must be greater than zero');
    if (amount > balance) return toast.error('Amount exceeds remaining balance');
    mutation.mutate(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-start">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-900 tracking-widest mb-1">Outstanding Balance</p>
            <h4 className="text-2xl font-black text-white">₦{balance.toLocaleString()}</h4>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Payment Amount (₦)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              max={balance}
              min={0.01}
              step="0.01"
              className="h-12 text-lg font-bold"
              placeholder="Enter amount received"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Payment Method</label>
            <div className="flex gap-2">
              {(['CASH', 'TRANSFER', 'POS'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={clsx(
                    "flex-1 p-2 rounded-xl text-xs font-bold border transition-all",
                    paymentMethod === method 
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/30"
                  )}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-lg p-3 flex gap-3 items-center border border-white/5">
            <Info className="h-4 w-4 text-gray-500" />
            <p className="text-[10px] text-gray-500 font-medium">Recording this payment will update the revenue and reduce the outstanding balance for this transaction.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="h-12 border-white/10 uppercase text-[10px] font-black tracking-widest">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-12 gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white uppercase text-[10px] font-black tracking-widest"
          >
            {mutation.isPending ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
