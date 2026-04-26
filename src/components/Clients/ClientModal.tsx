'use client'

import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { clientsService } from '../../services/clients'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ClientModal({ isOpen, onClose, onSuccess }: ClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Name is required')
      return
    }

    setLoading(true)
    try {
      await clientsService.create(formData)
      toast.success('Client created successfully')
      setFormData({ name: '', phone: '' })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Client"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-primary hover:bg-primary/80 text-white min-w-[100px]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Client'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Full Name</label>
          <Input
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Phone Number (Optional)</label>
          <Input
            placeholder="e.g. +234..."
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  )
}
