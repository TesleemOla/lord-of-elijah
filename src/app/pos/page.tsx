'use client'

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { Header } from '../../components/layout/Header';
import { authService } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Minus, ShoppingCart, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { clsx } from 'clsx';

import { toast } from 'sonner';
import { ReceiptModal } from '../../components/POS/ReceiptModal';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function POSPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const [cart, setCart] = useState<{product: any, qty: number, overridePrice?: number}[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState<number | string>('');
  const [isAmountPaidManual, setIsAmountPaidManual] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: productsLoading
  } = useInfiniteQuery({
    queryKey: ['products', 'pos', searchTerm],
    queryFn: ({ pageParam = 1 }) => 
      fetchApi<any[]>(`/products?page=${pageParam}&limit=20&search=${searchTerm}`),
    getNextPageParam: (lastPage, allPages) => {
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

  const createSale = useMutation({
    mutationFn: () => fetchApi<any>('/transactions/sale', {
      method: 'POST',
      body: JSON.stringify({ 
        items: cart.map(i => ({ 
          productId: i.product._id, 
          qty: i.qty,
          overridePrice: i.overridePrice
        })),
        customerName: customerName || 'Guest',
        amountPaid: amountPaid === '' ? total : Number(amountPaid)
      }),
    }),
    onSuccess: (data) => {
      setCart([]);
      setCustomerName('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setLastTransaction(data);
      setShowReceipt(true);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to complete sale');
    }
  });

  const total = cart.reduce((acc, item) => acc + ((item.overridePrice ?? (item.product.price || 0)) * item.qty), 0);

  useEffect(() => {
    if (!isAmountPaidManual) {
      setAmountPaid(total);
    }
  }, [total, isAmountPaidManual]);

  const handleAmountPaidChange = (val: string) => {
    setAmountPaid(val);
    setIsAmountPaidManual(true);
    if (val === '' || Number(val) === total) {
      setIsAmountPaidManual(false);
    }
  };

  if (productsLoading && !searchTerm) return <LoadingScreen message="Opening Digital Register..." />;

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product._id === product._id);
      const currentQty = existing ? existing.qty : 0;
      
      if (currentQty >= (product.stock || 0)) {
        toast.error(`Cannot add more: only ${product.stock} units in stock.`);
        return prev;
      }

      if (existing) {
        return prev.map(i => i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.product._id === productId);
      if (existing && existing.qty > 1) {
        return prev.map(i => i.product._id === productId ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.product._id !== productId);
    });
  };

  const updatePrice = (productId: string, price: string) => {
    const newPrice = price === '' ? undefined : parseFloat(price);
    setCart(prev => prev.map(i => i.product._id === productId ? { ...i, overridePrice: newPrice } : i));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Cool POS background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background pointer-events-none" />
      
      <Header user={user} />
      
      <main className="flex-1 p-6 relative z-10 flex gap-6">
        {/* Products Grid */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">Terminal</h1>
            </div>
            
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search products..."
                className="pl-10 h-10 bg-black/40 border-white/10 focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-6 pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => {
                const isOutOfStock = (product.stock || 0) <= 0;
                const isLowStock = (product.stock || 0) < 10;
                
                return (
                  <div 
                    key={product._id} 
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={clsx(
                      "glass-panel p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group flex flex-col justify-between relative overflow-hidden",
                      isOutOfStock && "opacity-60 grayscale cursor-not-allowed border-red-500/30"
                    )}
                  >
                    {isOutOfStock && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider z-10">
                        Out of Stock
                      </div>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider z-10">
                        Low Stock
                      </div>
                    )}

                    <div>
                      <div className="h-10 w-10 bg-[#27272a] rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingCart className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{product.name}</h3>
                    </div>
                    <div className="mt-3">
                      <p className="text-primary font-bold">₦{(product.price || 0).toLocaleString()}</p>
                      <p className={clsx(
                        "text-[10px] font-bold uppercase tracking-wider mt-1",
                        isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-500" : "text-gray-500"
                      )}>
                        {product.stock || 0} in stock
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sentinel for Infinite Scroll */}
            <div ref={targetRef} className="py-8 flex justify-center">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-primary animate-pulse">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs font-bold uppercase">Loading products...</span>
                </div>
              ) : hasNextPage ? (
                <div className="h-1" />
              ) : products.length > 0 ? (
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">End of Catalog</p>
              ) : !productsLoading && (
                <div className="text-center py-12">
                   <p className="text-gray-500 italic">No products found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="w-96 glass-panel flex flex-col h-[calc(100vh-6rem)]">
          <div className="p-4 border-b border-[var(--border)] bg-black/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Current Order
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map(item => (
              <div key={item.product._id} className="flex flex-col bg-[#27272a]/50 p-3 rounded-xl border border-[var(--border)] gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 text-xs">Price:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.overridePrice ?? item.product.price}
                        onChange={(e) => updatePrice(item.product._id, e.target.value)}
                        className="w-20 bg-black/30 border border-[#3f3f46] rounded px-1 text-xs text-primary outline-none focus:border-primary/50"
                      />
                      {item.overridePrice !== undefined && item.overridePrice !== item.product.price && (
                        <span className="text-[10px] text-orange-400 font-medium bg-orange-400/10 px-1 rounded">Special Order</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.product._id)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-4 text-center text-sm">{item.qty}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addToCart(item.product)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[var(--border)] border-dashed">
                  <span className="text-xs text-gray-500">Subtotal</span>
                  <span className="text-sm font-semibold">₦{((item.overridePrice ?? item.product.price) * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                <p>Order is empty</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[var(--border)] bg-black/40">
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 pl-1">Customer Name</p>
                <input 
                  type="text" 
                  placeholder="Optional"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-black/30 border border-[#3f3f46] text-sm text-white outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <div className="flex justify-between items-end mb-1 pl-1">
                  <p className="text-[10px] font-bold uppercase text-primary">Amount Paid</p>
                  {Number(amountPaid) < total && (
                    <p className="text-[10px] font-bold uppercase text-red-500">Balance: ₦{(total - Number(amountPaid)).toLocaleString()}</p>
                  )}
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={amountPaid}
                  onChange={e => handleAmountPaidChange(e.target.value)}
                  className={clsx(
                    "w-full p-2.5 rounded-lg bg-black/30 border text-sm font-bold outline-none transition-colors",
                    Number(amountPaid) < total ? "border-amber-500/50 text-amber-500" : "border-[#3f3f46] text-primary focus:border-primary"
                  )}
                />
              </div>
            </div>
            <Button 
              className="w-full h-14 text-lg" 
              onClick={() => createSale.mutate()}
              disabled={cart.length === 0 || createSale.isPending}
            >
              {createSale.isPending ? 'Processing...' : 'Charge'}
            </Button>
          </div>
        </div>
      </main>

      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        transaction={lastTransaction} 
      />
    </div>
  );
}
