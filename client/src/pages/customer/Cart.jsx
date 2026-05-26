import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import RxBadge from '../../components/shared/RxBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldAlert, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    grandTotal,
    deliveryCharge,
    hasRxItems,
    itemCount,
    loading,
    fetchCart,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQtyChange = async (productId, quantity, rxType) => {
    const maxLimit = (rxType === 'H' || rxType === 'NRX') ? 2 : 10;
    if (quantity < 1) return;
    if (quantity > maxLimit) {
      toast.error(`Maximum order limit for this drug class is ${maxLimit} units.`);
      return;
    }

    const res = await updateQuantity(productId, quantity);
    if (res && !res.success) {
      toast.error(res.message || 'Failed to update quantity');
    }
  };

  const handleRemove = async (productId) => {
    const res = await removeFromCart(productId);
    if (res && res.success) {
      toast.success('Removed from cart');
    } else if (res) {
      toast.error(res.message || 'Failed to remove item');
    }
  };

  const handleProceed = () => {
    if (subtotal < 200) {
      toast.error('Minimum order subtotal for checkout is ₹200');
      return;
    }
    navigate('/checkout');
  };

  if (loading && items.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
        Loading your shopping cart...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 bg-gray-50 font-sans">
      <h1 className="text-xl md:text-2xl font-black text-teal-900 mb-8 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-teal-700" /> Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
      </h1>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Prescription required alert banner */}
            {hasRxItems && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800 font-bold leading-normal">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                <div>
                  <h4 className="font-black text-amber-900">Prescription Upload Required</h4>
                  <p className="mt-0.5 text-[11px] text-amber-700 font-medium">
                    This cart contains prescription-locked medicines (Schedule H/NRx). You will be required to upload a valid doctor's prescription during checkout.
                  </p>
                </div>
              </div>
            )}

            {/* List */}
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-150 overflow-hidden shadow-xs">
              {items.map((item) => (
                <div key={item.product} className="p-4 md:p-5 flex gap-4 items-center">
                  {/* Image */}
                  <div className="w-16 h-16 bg-gray-50 border border-gray-150 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide truncate">
                          {item.name}
                        </h3>
                        {item.brand && (
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                            {item.brand}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.product)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors focus:outline-none"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Rx pill badge */}
                    <div className="mt-1">
                      <RxBadge rxType={item.rxType} />
                    </div>

                    {/* Bottom controls and pricing */}
                    <div className="flex items-center justify-between gap-4 mt-3 flex-wrap">
                      {/* Stepper */}
                      <div className="flex items-center border border-gray-250 rounded-lg overflow-hidden shrink-0">
                        <button
                          onClick={() => handleQtyChange(item.product, item.quantity - 1, item.rxType)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 disabled:opacity-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3.5 py-1 text-xs font-extrabold text-gray-800 bg-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQtyChange(item.product, item.quantity + 1, item.rxType)}
                          className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Pricing */}
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-teal-800 block">
                          {formatCurrency(item.sellingPrice * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                            {formatCurrency(item.sellingPrice)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart link */}
            <div className="flex justify-between items-center text-xs font-semibold px-1">
              <Link to="/products" className="text-teal-700 hover:text-teal-800 transition-colors">
                &larr; Continue Shopping
              </Link>
              <button
                onClick={() => {
                  if (window.confirm('Clear all items from your shopping cart?')) {
                    clearCart();
                    toast.success('Cart cleared');
                  }
                }}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Checkout Summary panel */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-5 sticky top-20">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-2.5">
                Payment Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-bold text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-500">
                  <span>Delivery Charge</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-extrabold' : 'text-gray-800'}>
                    {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
                  </span>
                </div>
                
                {deliveryCharge > 0 && (
                  <p className="text-[10px] text-gray-400 font-semibold italic leading-normal">
                    Tip: Add ₹{500 - subtotal} more to get FREE delivery!
                  </p>
                )}

                <div className="border-t border-gray-150 pt-3 flex justify-between font-extrabold text-sm">
                  <span className="text-teal-900">Grand Total</span>
                  <span className="text-teal-900 font-black">{formatCurrency(grandTotal)}</span>
                </div>
                
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center pt-1 border-t border-gray-100">
                  Inclusive of all GST taxes
                </p>
              </div>

              {/* Minimum order notice */}
              {subtotal < 200 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 text-[11px] text-red-700 font-semibold leading-normal">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>Minimum subtotal required to proceed is ₹200. Please add more items.</span>
                </div>
              )}

              <button
                onClick={handleProceed}
                disabled={subtotal < 200}
                className="w-full btn-teal py-3 px-4 font-extrabold rounded-lg flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center max-w-lg mx-auto shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-base font-bold text-teal-900 mb-1">Your Cart is Empty</h2>
          <p className="text-xs text-gray-500 font-semibold max-w-xs mb-6 leading-relaxed">
            You haven't added any medicines or healthcare products to your shopping bag yet.
          </p>
          <Link to="/products" className="btn-teal py-2.5 px-6 font-bold shadow-xs">
            Browse Medicines
          </Link>
        </div>
      )}
    </div>
  );
}
