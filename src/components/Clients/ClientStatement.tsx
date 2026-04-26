'use client'

import { useEffect, useState } from 'react'
import { clientsService, ClientStatement as ClientStatementType } from '../../services/clients'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import { Button } from '../ui/Button'
import { ArrowLeft, Download, Printer, TrendingUp, TrendingDown, Wallet, ShoppingCart, ShoppingBag, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '../../utils/format'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { toast } from 'sonner'

interface ClientStatementProps {
  clientId: string
}

export function ClientStatement({ clientId }: ClientStatementProps) {
  const [data, setData] = useState<ClientStatementType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadStatement()
  }, [clientId])

  async function loadStatement() {
    try {
      const statementData = await clientsService.getStatement(clientId)
      setData(statementData)
    } catch (error) {
      console.error('Failed to load statement', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecordPayment() {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    setIsSubmitting(true)
    try {
      await clientsService.recordPayment(clientId, Number(paymentAmount), data?.client.name)
      toast.success('Payment recorded successfully')
      setPaymentAmount('')
      setIsPaymentModalOpen(false)
      loadStatement() // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading statement...</div>
  if (!data) return <div className="text-center py-20 text-red-400">Client statement not found.</div>

  const { client, statement, summary } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">{client.name}</h1>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono border border-primary/20">
                {client.clientId}
              </span>
            </div>
            <p className="text-gray-400">Profit & Loss / Statement of Account</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-green-600 hover:bg-green-500 text-white"
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Link href={`/pos?clientId=${client._id}`}>
            <Button className="bg-primary hover:bg-primary/80 text-white">
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </Link>
          <Button variant="ghost" className="glass-panel hover:bg-white/10">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="ghost" className="glass-panel hover:bg-white/10">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">Total Purchases</p>
            <TrendingUp className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalPurchases)}</p>
          <p className="text-xs text-gray-500">Total volume of sales</p>
        </div>
        <div className="glass-panel p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">Total Payments</p>
            <TrendingDown className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalPaid)}</p>
          <p className="text-xs text-gray-500">Total cash received</p>
        </div>
        <div className="glass-panel p-6 space-y-2 border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">Current Balance</p>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className={`text-2xl font-bold ${summary.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatCurrency(summary.balance)}
          </p>
          <p className="text-xs text-gray-500">Outstanding amount</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] bg-white/5">
          <h3 className="font-semibold text-white">Transaction History</h3>
        </div>
        <Table className="rounded-none border-0 shadow-none">
          <TableHeader>
            <TableRow className="bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit (Sale)</TableHead>
              <TableHead className="text-right">Credit (Payment)</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statement.map((row) => (
              <TableRow key={row._id}>
                <TableCell className="text-gray-300">{formatDate(row.date)}</TableCell>
                <TableCell className="text-gray-400 max-w-xs truncate">{row.items || 'Manual Payment / Refund'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    row.type === 'SALE' ? 'bg-blue-500/10 text-blue-400' : 
                    row.type === 'VOID' ? 'bg-red-500/10 text-red-400' : 
                    'bg-orange-500/10 text-orange-400'
                  }`}>
                    {row.type}
                  </span>
                </TableCell>
                <TableCell className="text-right text-white">
                  {row.type === 'SALE' ? formatCurrency(row.total) : row.total < 0 ? formatCurrency(Math.abs(row.total)) : '-'}
                </TableCell>
                <TableCell className="text-right text-green-400">
                  {row.paid > 0 ? formatCurrency(row.paid) : '-'}
                </TableCell>
                <TableCell className={`text-right font-medium ${row.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCurrency(row.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {statement.length === 0 && (
        <div className="glass-panel py-20 mt-6 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <ShoppingBag className="h-10 w-10 text-primary/40" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-semibold text-white">No Transactions Yet</h3>
            <p className="text-gray-400">
              This client hasn't made any purchases or payments. Start a new sale to record their first transaction.
            </p>
          </div>
          <Link href={`/pos?clientId=${client._id}`}>
            <Button className="bg-primary hover:bg-primary/80 text-white px-8 h-12 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5 mr-2" />
              Initiate First Sale
            </Button>
          </Link>
        </div>
      )}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Client Payment"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-500" 
              onClick={handleRecordPayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-sm text-gray-400">Current Balance</p>
            <p className={`text-2xl font-bold ${summary.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(summary.balance)}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Payment Amount (₦)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="bg-black/30 border-white/10 h-12 text-lg font-bold text-primary"
              autoFocus
            />
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              This will be recorded as a general credit to the client's account.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
