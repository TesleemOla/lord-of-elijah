'use client'

import React, { useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Download, CheckCircle2, Trash2, RotateCcw, AlertCircle, Wallet } from 'lucide-react';
import { PaymentModal } from '../Transactions/PaymentModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { authService } from '../../services/auth';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showPayment, setShowPayment] = React.useState(false);
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const isManager = user?.role === 'UNIT_MANAGER';

  const voidMutation = useMutation({
    mutationFn: () => fetchApi(`/transactions/${transaction._id}/void`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Transaction Voided Successfully');
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to void transaction')
  });

  const refundMutation = useMutation({
    mutationFn: () => fetchApi(`/transactions/${transaction._id}/refund`, {
      method: 'POST',
      body: JSON.stringify({
        items: transaction.items.map((i: any) => ({ productId: i.productId, qty: i.qty }))
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Full Refund Processed Successfully');
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to process refund')
  });

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    try {
      toast.loading('Preparing multi-page receipt...', { id: 'pdf-gen' });
      
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // 2 is usually enough for clarity without massive file size
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate how many mm high the whole canvas image should be in the PDF
      const canvasHeightInMm = (imgHeight * pdfWidth) / imgWidth;
      
      let heightLeft = canvasHeightInMm;
      let position = 0;
      
      // Page 1
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightInMm, undefined, 'FAST');
      heightLeft -= pdfHeight;
      
      // Add more pages if content remains
      while (heightLeft > 0) {
        position = heightLeft - canvasHeightInMm; // Negative offset to show the next slice
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightInMm, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Receipt_Elijah_${transaction._id?.slice(-8).toUpperCase() || 'TX'}.pdf`);
      toast.success('Receipt Saved Successfully', { id: 'pdf-gen' });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF', { id: 'pdf-gen' });
    }
  };

  if (!transaction) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={transaction.type === 'SALE' ? 'Success' : 'Transaction Record'}
      footer={
        <div className="flex flex-col gap-3">
          {isManager && transaction.type === 'SALE' && (
            <div className="flex flex-col gap-3">
              {transaction.amountPaid < transaction.total && (
                <Button 
                    variant="outline" 
                    className="h-12 text-primary border-primary/30 hover:bg-primary/10 gap-2 uppercase text-[10px] font-black tracking-widest"
                    onClick={() => setShowPayment(true)}
                >
                  <Wallet className="h-4 w-4" /> Record Payment
                </Button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                    variant="outline" 
                    className="h-10 text-amber-500 border-amber-500/30 hover:bg-amber-500/10 gap-2 text-[10px] font-black uppercase tracking-widest"
                    onClick={() => refundMutation.mutate()}
                    disabled={refundMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4" /> Issue Refund
                </Button>
                <Button 
                    variant="outline" 
                    className="h-10 text-red-500 border-red-500/30 hover:bg-red-500/10 gap-2 text-[10px] font-black uppercase tracking-widest"
                    onClick={() => voidMutation.mutate()}
                    disabled={voidMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" /> Void Sale
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 border-white/10" onClick={onClose}>
              Done
            </Button>
            <Button className="h-12 gap-2 shadow-lg shadow-primary/20" onClick={handleDownload}>
              <Download className="h-4 w-4" /> Save as PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center mb-8">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-3 ${
          transaction.type === 'SALE' ? 'bg-green-500/20' : 
          transaction.type === 'REFUND' ? 'bg-amber-500/20' : 'bg-red-500/20'
        }`}>
          {transaction.type === 'SALE' ? (
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          ) : transaction.type === 'REFUND' ? (
            <RotateCcw className="h-10 w-10 text-amber-500" />
          ) : (
            <Trash2 className="h-10 w-10 text-red-500" />
          )}
        </div>
        <h3 className="text-xl font-bold">
          {transaction.type === 'SALE' ? 'Transaction Completed' : 
           transaction.type === 'REFUND' ? 'Refund Processed' : 'Transaction Voided'}
        </h3>
        <p className="text-gray-400 text-sm">
          {transaction.type === 'SALE' ? 'Receipt is ready for your records' :
           transaction.type === 'REFUND' ? 'Inventory has been adjusted accordingly' :
           'Transaction has been nullified and stock restored'}
        </p>
      </div>

      <div className="border border-white/5 rounded-xl overflow-hidden">
        {/* The Actual Receipt Content (Styled for PDF) */}
        <div 
          ref={receiptRef}
          className="bg-white text-black p-6 font-sans w-[480px] mx-auto selection:bg-indigo-100 relative"
        >
          {/* Reversal Watermark */}
          {transaction.type !== 'SALE' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] rotate-[-35deg] select-none">
              <span className={`text-8xl font-black border-8 px-8 py-2 ${
                transaction.type === 'REFUND' ? 'border-amber-600 text-amber-600' : 'border-red-600 text-red-600'
              }`}>
                {transaction.type}
              </span>
            </div>
          )}

          {/* Header */}
          <div className="border-b-4 border-indigo-600 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold uppercase text-indigo-700 leading-tight tracking-tighter">Lord of Elijah</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Premium Management System</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-indigo-700 text-white px-3 py-1 text-[10px] font-black tracking-widest mb-2 rounded-sm inline-block">
                {transaction.type === 'SALE' ? 'INVOICE' : transaction.type}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">REF: #{transaction._id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          {/* Date and Customer */}
          <div className="flex justify-between mb-6 text-sm">
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Transaction Date</p>
                <p className="font-bold text-gray-800">{new Date(transaction.createdAt || transaction.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Processed By</p>
                <p className="font-bold text-gray-800">{transaction.processedBy?.email || 'System'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Billed To</p>
              <p className="text-lg font-bold text-indigo-900">{transaction.customerName || 'Guest Customer'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Status: <span className={`font-bold uppercase ${
                transaction.type === 'SALE' 
                  ? ((transaction.amountPaid ?? transaction.total) < transaction.total ? 'text-amber-600' : 'text-green-600')
                  : (transaction.type === 'REFUND' ? 'text-amber-600' : 'text-red-600')
              }`}>
                {transaction.type === 'SALE' 
                  ? ((transaction.amountPaid ?? transaction.total) < transaction.total ? 'Partial Payment' : 'Paid')
                  : (transaction.type === 'REFUND' ? 'Refunded' : 'Voided')}
              </span></p>
            </div>
          </div>

          {/* Table */}
          <div className="mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-900 text-[10px] font-bold uppercase text-gray-900 tracking-widest">
                  <th className="py-2.5 px-2">Description</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Price</th>
                  <th className="py-2.5 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {transaction.items?.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 group">
                    <td className="py-2.5 px-2">
                       <p className="font-semibold text-gray-800">{item.productName}</p>
                       <p className="text-[9px] text-gray-400 mt-0.5">Item ID: {item.productId?.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="py-2.5 px-2 text-center text-gray-600 font-medium">{item.qty}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600">₦{item.priceAtTime.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-gray-900 bg-gray-50/50">₦{(item.qty * item.priceAtTime).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="flex justify-between items-start pt-4 border-t border-gray-100">
             <div className="max-w-[200px]">
                <p className="text-[9px] leading-relaxed text-gray-400 font-medium">This document confirms the status of your transaction. For any queries, please visit the authorized unit.</p>
             </div>
              <div className="space-y-2 w-full max-w-[200px]">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>Subtotal</span>
                    <span>₦{(transaction.total || transaction.totalAmount).toLocaleString()}</span>
                </div>
                {transaction.type === 'SALE' && (
                  <>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                        <span>Paid</span>
                        <span>₦{(transaction.amountPaid ?? (transaction.total || transaction.totalAmount)).toLocaleString()}</span>
                    </div>
                    {((transaction.total || transaction.totalAmount) - (transaction.amountPaid ?? (transaction.total || transaction.totalAmount))) > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-red-500 uppercase">
                          <span>Balance</span>
                          <span>₦{((transaction.total || transaction.totalAmount) - (transaction.amountPaid ?? (transaction.total || transaction.totalAmount))).toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
                <div className={`flex justify-between items-center p-2 rounded-sm ${
                  transaction.type === 'SALE' ? 'bg-indigo-900' :
                  transaction.type === 'REFUND' ? 'bg-amber-700' : 'bg-red-700'
                } text-white`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{transaction.type === 'SALE' ? 'Total' : 'Reversal'}</span>
                    <span className="text-lg font-bold">₦{(transaction.total || transaction.totalAmount).toLocaleString()}</span>
                </div>
             </div>
          </div>

          {/* Footer Card */}
          <div className="mt-8 pt-4 border-t border-dashed border-gray-200 text-center">
             <div className="inline-block bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 mb-2">
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase italic">Authorized {transaction.type} Receipt</p>
             </div>
             <p className="text-[8px] text-gray-300 tracking-tighter leading-relaxed">
                © 2026 Lord of Elijah Transaction Management. This is a computer-generated document and requires no physical signature for validation.
             </p>
          </div>
        </div>
      </div>
      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        transaction={transaction} 
      />
    </Modal>
  );
}
