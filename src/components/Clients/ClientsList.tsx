'use client'

import { useEffect, useState } from 'react'
import { clientsService, Client } from '../../services/clients'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import { Button } from '../ui/Button'
import { Plus, Eye, Search, User } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '../../utils/format'
import { ClientModal } from './ClientModal'

export function ClientsList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const data = await clientsService.getAll()
      setClients(data)
    } catch (error) {
      console.error('Failed to load clients', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="text-slate-500">Manage your customer accounts and track their balances.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search clients by name, phone or email..."
          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Total Purchases</TableHead>
            <TableHead className="text-right">Total Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-gray-500">Loading clients...</TableCell>
            </TableRow>
          ) : filteredClients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-gray-500">No clients found.</TableCell>
            </TableRow>
          ) : (
            filteredClients.map((client) => (
              <TableRow key={client._id} className="border-slate-100">
                <TableCell className="font-semibold text-slate-900">
                  {client.name}
                </TableCell>
                <TableCell className="text-slate-500 font-medium">{client.phone || '-'}</TableCell>
                <TableCell className="text-right text-slate-900 font-bold">{formatCurrency(client.totalPurchases || 0)}</TableCell>
                <TableCell className="text-right text-green-600 font-bold">{formatCurrency(client.totalPaid || 0)}</TableCell>
                <TableCell className={`text-right font-black ${(client.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(client.balance || 0)}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/clients/${client._id}`}>
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                      <Eye className="h-4 w-4 mr-2" />
                      Statement
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadClients}
      />
    </div>
  )
}
