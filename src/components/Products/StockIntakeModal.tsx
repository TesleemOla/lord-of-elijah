'use client'

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, Package, Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface StockIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StockIntakeModal({ isOpen, onClose }: StockIntakeModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['products', 'intake', searchTerm],
    queryFn: ({ pageParam = 1 }) =>
      fetchApi<any[]>(`/products?page=${pageParam}&limit=50&search=${searchTerm}`),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: isOpen,
  });

  const products = data?.pages.flatMap(p => p) || [];

  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const submitMutation = useMutation({
    mutationFn: (updates: { productId: string; stock: number }[]) =>
      fetchApi('/products/inventory/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ updates }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Inventory updated successfully!');
      setStockUpdates({});
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update inventory'),
  });

  const handleStockChange = (productId: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setStockUpdates(prev => ({ ...prev, [productId]: numValue }));
    } else if (value === '') {
      const { [productId]: _, ...rest } = stockUpdates;
      setStockUpdates(rest);
    }
  };

  const handleSave = () => {
    const updates = Object.entries(stockUpdates).map(([productId, stock]) => ({
      productId,
      stock,
    }));

    if (updates.length === 0) {
      toast.error('No changes to save');
      return;
    }

    submitMutation.mutate(updates);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Intake Tool">
      <div className="space-y-6 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search master catalog by name or SKU..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading catalog...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              {products.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-black/20 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">{product.name}</h4>
                      <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-600 mb-1">Current</p>
                      <p className="text-sm font-semibold text-gray-400">{product.stock}</p>
                    </div>

                    <div className="w-24">
                      <p className="text-[10px] uppercase font-bold text-primary mb-1 pl-1">New Stock</p>
                      <Input
                        type="number"
                        min="0"
                        placeholder="--"
                        className={`h-10 text-center font-bold transition-colors ${stockUpdates[product._id] !== undefined ? 'border-primary bg-primary/5' : ''}`}
                        value={stockUpdates[product._id] ?? ''}
                        onChange={(e) => handleStockChange(product._id, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Sentinel for Infinite Scroll */}
              <div ref={targetRef} className="py-6 flex justify-center">
                {isFetchingNextPage ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : hasNextPage ? (
                  <div className="h-1" />
                ) : (
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">End of Master Catalog</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No products found matching your search.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <div className="flex flex-col">
            <p className="text-xs text-gray-500 italic">
              {Object.keys(stockUpdates).length} products staged for update
            </p>
            {Object.keys(stockUpdates).length > 0 && (
              <button
                onClick={() => setStockUpdates({})}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase mt-1 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear selection
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={submitMutation.isPending || Object.keys(stockUpdates).length === 0}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Commit Inventory
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
