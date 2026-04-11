'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { Header } from '../../components/layout/Header';
import { authService } from '../../services/auth';
import { Button } from '../../components/ui/Button';
import { Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { ReceiptModal } from '../../components/POS/ReceiptModal';

export default function POSPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const [cart, setCart] = useState<{product: any, qty: number, overridePrice?: number}[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchApi<any[]>('/products'),
  });

  const createSale = useMutation({
    mutationFn: () => fetchApi<any>('/transactions/sale', {
      method: 'POST',
      body: JSON.stringify({ 
        items: cart.map(i => ({ 
          productId: i.product._id, 
          qty: i.qty,
          overridePrice: i.overridePrice
        })),
        customerName: customerName || 'Guest'
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

  const updatePrice = (productId: string, price: string) => {
    const newPrice = price === '' ? undefined : parseFloat(price);
    setCart(prev => prev.map(i => i.product._id === productId ? { ...i, overridePrice: newPrice } : i));
  };

  const total = cart.reduce((acc, item) => acc + ((item.overridePrice ?? item.product.price) * item.qty), 0);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Cool POS background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background pointer-events-none" />
      
      <Header user={user} />
      
      <main className="flex-1 p-6 relative z-10 flex gap-6">
        {/* Products Grid */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Terminal</h1>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-6">
            {products?.map(product => (
              <div 
                key={product._id} 
                onClick={() => addToCart(product)}
                className="glass-panel p-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="h-10 w-10 bg-[#27272a] rounded-lg mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                </div>
                <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                <p className="text-primary font-bold mt-1">₦{product.price.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">{product.stockQuantity} in stock</p>
              </div>
            ))}
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
            <div className="flex justify-between mb-4">
              <span className="text-gray-400">Total</span>
              <span className="text-2xl font-bold text-primary">₦{total.toFixed(2)}</span>
            </div>
            <input 
              type="text" 
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full mb-4 p-3 rounded-lg bg-black/30 border border-[#3f3f46] text-white outline-none focus:border-primary transition-colors"
            />
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
