'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../services/api';
import { authService } from '../../../services/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'UNIT_MANAGER';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    sku: ''
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchApi<any[]>(isSuperAdmin ? '/products/all' : '/products'),
  });

  const createProduct = useMutation({
    mutationFn: (data: any) => fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setFormData({ name: '', price: '', stock: '', sku: '' });
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-gray-400 mt-1">
            {isSuperAdmin ? 'All products across all units' : 'Products available in your unit'}
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock Qty</TableHead>
            <TableHead>SKU</TableHead>
            {isSuperAdmin && <TableHead>Unit</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product: any) => (
            <TableRow key={product._id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>₦{product.price.toFixed(2)}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>{product.sku}</TableCell>
              {isSuperAdmin && (
                <TableCell className="text-gray-400">
                  {product.unitId?.name || 'Unknown'}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Product">
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-gray-300">Product Name</label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Premium Coffee Beans"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block text-gray-300">Price (₦)</label>
              <Input 
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-gray-300">Initial Stock</label>
              <Input 
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block text-gray-300">SKU / Code</label>
            <Input 
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. CF-001"
            />
          </div>
          <Button 
            className="w-full h-12 mt-4" 
            onClick={() => createProduct.mutate(formData)}
            disabled={createProduct.isPending || !formData.name || !formData.price || !formData.stock || !formData.sku}
          >
            {createProduct.isPending ? 'Saving...' : 'Create Product'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

