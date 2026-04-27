'use client'

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../services/api';
import { authService } from '../../../services/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Plus } from 'lucide-react';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';

import { toast } from 'sonner';

import { Edit2, Trash2, Package, Loader2, Database } from 'lucide-react';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sku: '',
    unitId: ''
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['products'],
    queryFn: ({ pageParam = 1 }) =>
      fetchApi<any[]>(`${isSuperAdmin ? '/products/all' : '/products'}?page=${pageParam}&limit=20`),
    getNextPageParam: (lastPage, allPages) => {
      // If the last page had fewer items than our limit (20), we've reached the end
      return lastPage.length === 20 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const products = data?.pages.flatMap(page => page) || [];

  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => fetchApi<any[]>('/units'),
    enabled: isSuperAdmin,
  });

  const createProduct = useMutation({
    mutationFn: (data: any) => fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        price: parseFloat(data.price),
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Product created successfully!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create product')
  });

  const updateProduct = useMutation({
    mutationFn: (data: any) => fetchApi(`/products/${editingProduct._id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...data,
        price: parseFloat(data.price),
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Product updated successfully!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update product')
  });

  const deleteProduct = useMutation({
    mutationFn: (product: any) => fetchApi(`/products/${product._id}${isSuperAdmin ? `?unitId=${product.unitId?._id || product.unitId}` : ''}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete product')
  });

  const resetForm = () => {
    setFormData({ name: '', price: '', sku: '', unitId: '' });
    setEditingProduct(null);
  };

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct.mutate(productToDelete);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      sku: product.sku,
      unitId: product.unitId?._id || product.unitId
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingProduct) {
      updateProduct.mutate(formData);
    } else {
      createProduct.mutate(formData);
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Products Inventory</h1>
          <p className="text-gray-400 mt-1">
            {isSuperAdmin ? 'All products across all units' : 'Products available in your unit'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>SKU</TableHead>
            {isSuperAdmin && <TableHead>Unit</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product: any) => (
            <TableRow key={product._id} className="group">
              <TableCell className="font-medium text-white">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white/5 rounded flex items-center justify-center">
                    <Package className="h-4 w-4 text-gray-500" />
                  </div>
                  {product.name}
                </div>
              </TableCell>
              <TableCell className="text-primary font-bold">₦{product.price.toLocaleString()}</TableCell>
              <TableCell className="text-gray-500 text-xs">{product.sku}</TableCell>
              {isSuperAdmin && (
                <TableCell className="text-gray-400 text-xs">
                  {product.unitId?.name || 'Unknown'}
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:bg-blue-400/10" onClick={() => handleEdit(product)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-400/10" onClick={() => handleDeleteClick(product)}>
                    <Trash2 className="h-3.5 w-3.5" />
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
            <span className="text-sm font-medium">Loading more products...</span>
          </div>
        ) : hasNextPage ? (
          <div className="h-1" />
        ) : products.length > 0 ? (
          <p className="text-xs text-gray-600 italic">End of catalog</p>
        ) : null}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 h-12"
              onClick={handleSubmit}
              disabled={createProduct.isPending || updateProduct.isPending || !formData.name || !formData.price || !formData.sku || (isSuperAdmin && !formData.unitId)}
            >
              {(createProduct.isPending || updateProduct.isPending) ? 'Saving...' : (editingProduct ? 'Update Details' : 'Create Product')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {isSuperAdmin && !editingProduct && (
            <div>
              <label className="text-sm font-medium mb-1.5 block text-gray-300">Target Unit</label>
              <select
                title="Select Unit"
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full flex h-12 rounded-xl bg-black border border-[#27272a] px-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all outline-none"
              >
                <option value="">Select a unit...</option>
                <option value="all" className="text-white font-bold">★ Every Unit (Global Distribution)</option>
                {units?.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block text-gray-300">Product Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Premium Coffee Beans"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
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
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block text-gray-300">SKU / Code</label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. CF-001"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={confirmDelete}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? 'Deleting...' : 'Delete Product'}
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <p className="text-slate-600">
            Are you sure you want to delete <span className="font-bold text-slate-900">{productToDelete?.name}</span>?
            This action cannot be undone and will remove the product from the inventory permanently.
          </p>
        </div>
      </Modal>

    </div>
  );
}

