'use client'

import { useState, useEffect, Suspense } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { Header } from '../../components/layout/Header';
import { authService } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Minus, ShoppingCart, ArrowLeft, Search, Loader2, ShoppingBag, Wallet } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { clsx } from 'clsx';

import { toast } from 'sonner';
import { ReceiptModal } from '../../components/POS/ReceiptModal';
import { Modal } from '../../components/ui/Modal';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { clientsService, Client } from '../../services/clients';

function POSContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const [cart, setCart] = useState<{ product: any, qty: number, overridePrice?: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>(searchParams.get('clientId') || '');
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [amountPaid, setAmountPaid] = useState<number | string>('');
  const [isAmountPaidManual, setIsAmountPaidManual] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'POS'>('CASH');

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

  useEffect(() => {
    clientsService.getAll().then(setClients).catch(console.error);
  }, []);

  // Pre-fill customer name when a client is selected
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find(c => c._id === selectedClientId);
      if (client) {
        setCustomerName(client.name);
      }
    }
  }, [selectedClientId, clients]);

  const createSale = useMutation({
    mutationFn: () => fetchApi<any>('/transactions/sale', {
      method: 'POST',
      body: JSON.stringify({
        items: cart.map(i => ({
          productId: i.product._id,
          qty: i.qty,
          overridePrice: i.overridePrice
        })),
        customerName: customerName || (selectedClientId ? clients.find(c => c._id === selectedClientId)?.name : 'Guest'),
        amountPaid: amountPaid === '' ? total : Number(amountPaid),
        paymentMethod,
        clientId: selectedClientId || undefined
      }),
    }),
    onSuccess: (data) => {
      setCart([]);
      setCustomerName('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['daily-breakdown'] });
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

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    c.clientId.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    c.phone?.includes(clientSearchTerm)
  );

  if (productsLoading && !searchTerm) return <LoadingScreen message="Opening Digital Register..." />;

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product._id === product._id);

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

  const updateQty = (productId: string, qty: string) => {
    const newQty = qty === '' ? 0 : parseInt(qty);
    setCart(prev => {
      if (newQty <= 0 && qty !== '') {
        return prev.filter(i => i.product._id !== productId);
      }
      return prev.map(i => i.product._id === productId ? { ...i, qty: newQty } : i);
    });
  };

  const updatePrice = (productId: string, price: string) => {
    const newPrice = price === '' ? undefined : parseFloat(price);
    setCart(prev => prev.map(i => i.product._id === productId ? { ...i, overridePrice: newPrice } : i));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Subtle Light background accent */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-white to-indigo-50/50 pointer-events-none" />

      <Header user={user} />

      <main className="flex-1 p-6 relative z-10 flex gap-6 overflow-hidden h-[calc(100vh-4rem)]">
        {/* Column 1: Products Grid (Catalog) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Catalog</h1>
            </div>

            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900" />
              <input
                placeholder="Search products..."
                className="w-full pl-10 h-10 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary/50 outline-none transition-colors text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-6 pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => {

                return (
                  <div
                    key={product._id}
                    onClick={() => addToCart(product)}
                    className="glass-panel p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group flex flex-col justify-between relative overflow-hidden"
                  >

                    <div>
                      <div className="h-10 w-10 bg-slate-100 rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingCart className="h-5 w-5 text-slate-500 group-hover:text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-slate-800">{product.name}</h3>
                    </div>
                    <div className="mt-3">
                      <p className="text-primary font-bold">₦{(product.price || 0).toLocaleString()}</p>
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
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">End of Catalog</p>
              ) : !productsLoading && (
                <div className="text-center py-12">
                  <p className="text-slate-500 italic font-medium">No products found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Current Order (Cart) */}
        <div className="w-96 glass-panel flex flex-col min-h-0 border-x border-slate-200 shadow-none rounded-none border-y-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
              <ShoppingBag className="h-5 w-5 text-primary" /> Current Order
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.map(item => (
              <div key={item.product._id} className="flex flex-col bg-white p-3 rounded-xl border border-slate-100 gap-2 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-[13px] leading-tight mb-1 text-slate-900">{item.product.name}</p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={item.overridePrice ?? item.product.price}
                        onChange={(e) => updatePrice(item.product._id, e.target.value)}
                        className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-primary font-bold outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.product._id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <input
                        type="number"
                        value={item.qty === 0 ? '' : item.qty}
                        onChange={(e) => updateQty(item.product._id, e.target.value)}
                        className="w-8 bg-transparent text-xs font-bold text-center outline-none border-none focus:ring-0 text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addToCart(item.product)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-[10px] font-bold text-primary">
                      ₦{((item.overridePrice ?? item.product.price) * item.qty).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-800">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm font-medium text-slate-900">Order is empty</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold uppercase text-slate-500">Total Amount</p>
              <p className="text-xl font-black text-primary">₦{total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Column 3: Settlement (Checkout) */}
        <div className="w-64 glass-panel flex flex-col min-h-0 bg-slate-50/30 border-none rounded-none">
          <div className="p-4 border-b border-slate-100 bg-white">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-primary">
              <Wallet className="h-5 w-5" /> Settlement
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Linked Client */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest flex justify-between">
                Linked Client
                {selectedClientId && <span className="text-primary tracking-normal font-black">Linked</span>}
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or select client..."
                  value={clientSearchTerm}
                  onChange={(e) => {
                    setClientSearchTerm(e.target.value);
                    setShowClientResults(true);
                  }}
                  onFocus={() => setShowClientResults(true)}
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 outline-none focus:border-primary transition-all shadow-sm"
                />
                {selectedClientId && (
                  <button
                    onClick={() => {
                      setSelectedClientId('');
                      setCustomerName('');
                      setClientSearchTerm('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-red-400 hover:text-red-300 font-bold uppercase bg-red-400/10 px-1.5 py-0.5 rounded"
                  >
                    Clear
                  </button>
                )}

                {showClientResults && (
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto glass-panel border-slate-200 shadow-2xl bg-white">
                    <div
                      className="p-3 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 transition-colors"
                      onClick={() => {
                        setSelectedClientId('');
                        setCustomerName('');
                        setClientSearchTerm('');
                        setShowClientResults(false);
                      }}
                    >
                      <p className="font-medium text-slate-900">Guest / Walk-in</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Default Option</p>
                    </div>
                    {filteredClients.map(client => (
                      <div
                        key={client._id}
                        className="p-3 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 transition-colors flex justify-between items-center"
                        onClick={() => {
                          setSelectedClientId(client._id);
                          setCustomerName(client.name);
                          setClientSearchTerm(client.name);
                          setShowClientResults(false);
                        }}
                      >
                        <div>
                          <p className="font-bold text-slate-900">{client.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black">{client.clientId}</p>
                        </div>
                        {client.phone && <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{client.phone}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {showClientResults && <div className="fixed inset-0 z-40" onClick={() => setShowClientResults(false)} />}
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Customer Name</p>
              <input
                type="text"
                placeholder="Guest"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Amount Paid */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Amount Paid</p>
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
                  "w-full p-4 rounded-xl bg-white border text-lg font-black outline-none transition-all shadow-sm",
                  Number(amountPaid) < total ? "border-amber-400 text-amber-600" : "border-slate-200 text-primary focus:border-primary"
                )}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Payment Method</p>
              <div className="flex gap-2">
                {(['CASH', 'TRANSFER', 'POS'] as const).map(method => (
                  <button
                    key={method}
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
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <Button
              className="w-full h-10 font-black"
              onClick={() => createSale.mutate()}
              disabled={cart.length === 0 || createSale.isPending}
            >
              {createSale.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                </div>
              ) : (
                'Process Charge'
              )}
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

export default function POSPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Register..." />}>
      <POSContent />
    </Suspense>
  );
}
