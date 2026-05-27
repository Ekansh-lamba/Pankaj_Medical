import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  MapPin,
  Upload,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Truck,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const { items, subtotal, grandTotal, deliveryCharge, hasRxItems, clearCart } = useCart();

  // Steps: 1 (Address), 2 (Prescription - optional), 3 (Summary/Payment), 4 (Success)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  // Address Step State
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' | 'pickup'
  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.addresses?.find(a => a.isDefault)?._id || user?.addresses?.[0]?._id || ''
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    pinCode: ''
  });

  // Prescription Step State
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cod'); // COD is default and active

  // Order Success State
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    // Redirect if cart empty (and not on success step)
    if (items.length === 0 && step !== 4) {
      navigate('/cart');
    }
    
    // Load serviceable pincodes and thresholds
    api.get('/api/settings/public')
      .then(res => {
        if (res.data && res.data.success) {
          setSettings(res.data.data);
        }
      })
      .catch(err => console.error('Failed to load settings:', err));
  }, [items, navigate, step]);

  // Load user profile on checkout mount to ensure saved addresses are fetched
  useEffect(() => {
    if (user) {
      refreshUser().catch((err) => console.error('Failed to load user profile in checkout:', err));
    }
  }, [refreshUser]);

  // Auto-select default/first address when user addresses load
  useEffect(() => {
    if (!selectedAddressId && user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find(a => a.isDefault)?._id || user.addresses[0]._id;
      setSelectedAddressId(defaultAddr);
    }
  }, [user?.addresses, selectedAddressId]);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.pinCode) {
      toast.error('Please fill in all required address fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/users/addresses', newAddress);
      if (res.data && res.data.success) {
        await refreshUser(); // Update state
        setSelectedAddressId(res.data.data[res.data.data.length - 1]._id);
        setShowNewAddressForm(false);
        setNewAddress({
          label: 'Home',
          line1: '',
          line2: '',
          city: 'Kanpur',
          state: 'Uttar Pradesh',
          pinCode: ''
        });
        toast.success('Address added successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressStepSubmit = () => {
    if (deliveryType === 'delivery') {
      if (!selectedAddressId) {
        toast.error('Please select or add a delivery address');
        return;
      }

      const activeAddr = user?.addresses?.find(a => a._id === selectedAddressId);
      if (!activeAddr) {
        toast.error('Selected address is invalid');
        return;
      }

      // Pin code serviceability validation
      if (settings?.serviceablePinCodes && !settings.serviceablePinCodes.includes(activeAddr.pinCode)) {
        toast.error(`Delivery not available at pin code: ${activeAddr.pinCode}`);
        return;
      }
    }

    // Determine next step (Skip prescription upload if cart has no H/NRX medicines)
    if (hasRxItems) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB maximum limit.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, or PDF files are accepted.');
      return;
    }

    setPrescriptionFile(file);
    if (file.type !== 'application/pdf') {
      setPrescriptionPreview(URL.createObjectURL(file));
    } else {
      setPrescriptionPreview('pdf'); // PDF icon fallback preview
    }
  };

  const handlePrescriptionStepSubmit = () => {
    if (!prescriptionFile) {
      toast.error("Prescription upload is required for Schedule H/NRx medicines.");
      return;
    }
    setStep(3);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const activeAddr = user?.addresses?.find(a => a._id === selectedAddressId);

      const orderPayload = {
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? {
          label: activeAddr.label,
          line1: activeAddr.line1,
          line2: activeAddr.line2,
          city: activeAddr.city,
          state: activeAddr.state,
          pinCode: activeAddr.pinCode
        } : undefined,
        paymentMethod,
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity
        }))
      };

      // 1. Place order
      const orderRes = await api.post('/api/orders', orderPayload);
      if (!orderRes.data || !orderRes.data.success) {
        toast.error('Order placement failed');
        setLoading(false);
        return;
      }

      const orderData = orderRes.data.data;

      // 2. If Payment Method is Online (Razorpay), trigger overlay
      if (paymentMethod === 'razorpay') {
        const initPaymentRes = await api.post('/api/payments/create-order', { orderId: orderData._id });
        if (!initPaymentRes.data || !initPaymentRes.data.success) {
          toast.error('Failed to initiate online transaction');
          navigate(`/my-orders/${orderData._id}`);
          setLoading(false);
          return;
        }

        const { key, order: rzpOrder } = initPaymentRes.data;

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          toast.error('Failed to load payment gateway script. Please check your internet connection.');
          navigate(`/my-orders/${orderData._id}`);
          setLoading(false);
          return;
        }

        const options = {
          key,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'Pankaj Medical Store',
          description: `Payment for Order #${orderData.orderNumber}`,
          order_id: rzpOrder.id,
          handler: async function (response) {
            setLoading(true);
            try {
              const verifyRes = await api.post('/api/payments/verify', {
                orderId: orderData._id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.data && verifyRes.data.success) {
                // Upload prescription if required
                if (hasRxItems && prescriptionFile) {
                  const formData = new FormData();
                  formData.append('orderId', orderData._id);
                  formData.append('prescription', prescriptionFile);

                  await api.post('/api/prescriptions/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                }

                setPlacedOrder(verifyRes.data.data);
                clearCart();
                setStep(4);
                toast.success('Payment verified & order placed successfully!');
              } else {
                toast.error('Payment verification failed.');
                navigate(`/my-orders/${orderData._id}`);
              }
            } catch (err) {
              console.error('Payment verification failure:', err);
              toast.error(err.response?.data?.message || 'Error verifying signature');
              navigate(`/my-orders/${orderData._id}`);
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: {
            color: '#0f766e'
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              toast.error('Payment cancelled. You can retry paying from your track order dashboard.');
              navigate(`/my-orders/${orderData._id}`);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // 3. Upload prescription if required for COD
      if (hasRxItems && prescriptionFile) {
        const formData = new FormData();
        formData.append('orderId', orderData._id);
        formData.append('prescription', prescriptionFile);

        const uploadRes = await api.post('/api/prescriptions/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (!uploadRes.data || !uploadRes.data.success) {
          toast.error('Failed to link prescription image to order');
        }
      }

      // Success transition for COD
      setPlacedOrder(orderData);
      clearCart();
      setStep(4);
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error placing order');
    } finally {
      setLoading(false);
    }
  };

  const activeAddress = user?.addresses?.find(a => a._id === selectedAddressId);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 bg-gray-50 font-sans">
      {/* Checkout step indicator tracker */}
      {step < 4 && (
        <div className="flex items-center justify-between border-b border-gray-250 pb-5 mb-8 text-xs font-bold text-gray-400 select-none">
          <span className={`${step === 1 ? 'text-primary-800 font-black' : 'text-primary-600'}`}>1. Shipping Address</span>
          <span className="text-gray-300">&rarr;</span>
          <span className={`${step === 2 ? 'text-primary-800 font-black' : hasRxItems ? 'text-gray-400' : 'opacity-40 cursor-not-allowed'}`}>
            2. Upload Prescription
          </span>
          <span className="text-gray-300">&rarr;</span>
          <span className={`${step === 3 ? 'text-primary-800 font-black' : 'text-gray-400'}`}>3. Review & Pay</span>
        </div>
      )}

      {/* STEP 1: ADDRESS SELECTION */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-black text-primary-900">Select Delivery Method</h2>

          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`p-4 border rounded-xl flex flex-col gap-1 items-center transition-all ${
                deliveryType === 'delivery'
                  ? 'border-primary-500 bg-primary-50/10 text-primary-800 font-bold'
                  : 'border-gray-250 bg-white text-gray-500'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span className="text-xs uppercase font-extrabold tracking-wider">Home Delivery</span>
            </button>
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`p-4 border rounded-xl flex flex-col gap-1 items-center transition-all ${
                deliveryType === 'pickup'
                  ? 'border-primary-500 bg-primary-50/10 text-primary-800 font-bold'
                  : 'border-gray-250 bg-white text-gray-500'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs uppercase font-extrabold tracking-wider">Store Pickup</span>
            </button>
          </div>

          {deliveryType === 'delivery' ? (
            <div className="space-y-5">
              {/* Addresses List */}
              <div className="space-y-3">
                {user?.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`block p-4 border rounded-xl bg-white cursor-pointer transition-all ${
                        selectedAddressId === addr._id
                          ? 'border-primary-500 ring-2 ring-primary-500/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="selected_address"
                          checked={selectedAddressId === addr._id}
                          onChange={() => setSelectedAddressId(addr._id)}
                          className="mt-1 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-primary-900 uppercase tracking-wider">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="bg-gray-100 text-gray-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 font-medium mt-1 leading-normal">
                            {addr.line1}, {addr.line2 && `${addr.line2}, `}{addr.city}, {addr.state} - <span className="font-extrabold">{addr.pinCode}</span>
                          </p>
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-xs font-semibold text-gray-400 italic">No saved delivery addresses found.</p>
                )}
              </div>

              {/* Toggle new Address form */}
              {!showNewAddressForm ? (
                <button
                  onClick={() => setShowNewAddressForm(true)}
                  className="btn-white py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              ) : (
                <form onSubmit={handleAddNewAddress} className="card-base p-5 space-y-4 animate-fadeIn">
                  <h3 className="text-xs font-extrabold text-primary-900 uppercase tracking-widest border-b border-gray-150 pb-2">
                    New Address Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Label *</label>
                      <select
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      >
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        placeholder="House / Shop Number, Street / Road Name"
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        placeholder="Landmark, Area, Sector Name"
                        value={newAddress.line2}
                        onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pin Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. 208011"
                        value={newAddress.pinCode}
                        onChange={(e) => setNewAddress({ ...newAddress, pinCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs focus:ring-primary-500 focus:border-primary-500 focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">City *</label>
                      <input
                        type="text"
                        value={newAddress.city}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-250 bg-gray-50 rounded-lg text-xs text-gray-500 focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">State *</label>
                      <input
                        type="text"
                        value={newAddress.state}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-250 bg-gray-50 rounded-lg text-xs text-gray-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="btn-white py-2 px-4 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="card-base p-5 flex items-start gap-3.5 text-xs leading-normal">
              <MapPin className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-primary-900 uppercase tracking-wide">Pickup Location</h3>
                <p className="text-gray-700 font-bold mt-1">PANKAJ MEDICAL AND GENERAL STORES</p>
                <p className="text-gray-500 font-medium mt-0.5">133/17 M Block, Kidwainagar, Kanpur Nagar, UP</p>
                <p className="text-gray-400 text-[10px] uppercase font-bold mt-2 tracking-wider">
                  Open Hours: {settings?.workingHours?.open || '09:00'} AM - {settings?.workingHours?.close || '22:00'} PM
                </p>
              </div>
            </div>
          )}

          {/* Step Actions */}
          <div className="flex justify-end pt-5 border-t border-gray-200">
            <button
              onClick={handleAddressStepSubmit}
              className="btn-primary py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 group shadow-xs"
            >
              Continue to Next Step <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PRESCRIPTION UPLOAD */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setStep(1)}
              className="p-1.5 border border-gray-250 rounded-lg text-gray-500 hover:text-primary-800 hover:border-primary-100 transition-colors bg-white shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-black text-primary-900">Upload Doctor's Prescription</h2>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800 font-bold leading-normal">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <h4 className="font-black text-amber-900">Prescription Locked Medicines Detected</h4>
              <p className="mt-0.5 text-[11px] text-amber-700 font-medium">
                Under Indian Drugs Act regulations, Schedule H/NRx drug lines require a verified prescription upload. Once placed, pharmacy auditors will review the document before confirming your order.
              </p>
            </div>
          </div>

          {/* Upload card */}
          <div className="card-base p-6 shadow-xs flex flex-col items-center">
            {prescriptionPreview ? (
              <div className="w-full max-w-sm space-y-4">
                <div className="border border-gray-250 rounded-xl p-3 bg-gray-50 flex items-center justify-center overflow-hidden max-h-64">
                  {prescriptionPreview === 'pdf' ? (
                    <div className="py-10 text-center flex flex-col items-center gap-2 text-xs font-bold text-gray-500">
                      <FileText className="w-12 h-12 text-primary-600" />
                      <span>Prescription_Document.pdf loaded successfully</span>
                    </div>
                  ) : (
                    <img src={prescriptionPreview} alt="Prescription preview" className="object-contain max-h-60" />
                  )}
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setPrescriptionFile(null);
                      setPrescriptionPreview(null);
                    }}
                    className="btn-white text-xs py-2 px-4 font-bold"
                  >
                    Change File
                  </button>
                </div>
              </div>
            ) : (
              <label className="w-full max-w-md border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-xl p-10 bg-gray-50/50 hover:bg-white text-center cursor-pointer transition-all flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-xs font-black text-gray-700">Drag or browse prescription image</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                  JPG, PNG, or PDF formats up to 5MB
                </p>
              </label>
            )}
          </div>

          {/* Step Actions */}
          <div className="flex justify-end pt-5 border-t border-gray-200">
            <button
              onClick={handlePrescriptionStepSubmit}
              className="btn-primary py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-2 group shadow-xs"
            >
              Continue to Final Step <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & PAYMENT */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setStep(hasRxItems ? 2 : 1)}
              className="p-1.5 border border-gray-250 rounded-lg text-gray-500 hover:text-primary-800 hover:border-primary-100 transition-colors bg-white shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-black text-primary-900">Review & Payment</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Recap */}
            <div className="lg:col-span-2 space-y-4">
              {/* Delivery Recap */}
              <div className="card-base p-5 shadow-xs text-xs leading-normal">
                <h3 className="font-extrabold text-primary-900 uppercase tracking-widest border-b border-gray-150 pb-2.5 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4.5 h-4.5" /> Shipping Address
                </h3>
                {deliveryType === 'delivery' && activeAddress ? (
                  <div>
                    <p className="font-bold text-gray-800 uppercase tracking-wider">{activeAddress.label}</p>
                    <p className="text-gray-500 font-medium mt-1 leading-normal">
                      {activeAddress.line1}, {activeAddress.line2 && `${activeAddress.line2}, `}{activeAddress.city}, {activeAddress.state} - <span className="font-extrabold">{activeAddress.pinCode}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-gray-800">Store Pickup</p>
                    <p className="text-gray-500 font-medium mt-0.5">PANKAJ MEDICAL AND GENERAL STORES, Kanpur, UP</p>
                  </div>
                )}
              </div>

              {/* Prescription Image Recap */}
              {hasRxItems && prescriptionFile && (
                <div className="card-base p-5 shadow-xs text-xs leading-normal">
                  <h3 className="font-extrabold text-primary-900 uppercase tracking-widest border-b border-gray-150 pb-2.5 mb-3 flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5" /> Linked Prescription Document
                  </h3>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-primary-600" />
                    <span className="font-bold text-gray-700 truncate">{prescriptionFile.name}</span>
                  </div>
                </div>
              )}

              {/* Item Lists Recap */}
              <div className="card-base p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-2.5">
                  Review Cart Items
                </h3>
                <div className="divide-y divide-gray-100 text-xs">
                  {items.map((item) => (
                    <div key={item.product} className="py-3.5 flex justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-800 uppercase tracking-wide truncate max-w-xs">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-extrabold text-gray-700 shrink-0">{formatCurrency(item.sellingPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Payment Actions & Sums */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card-base p-5 shadow-xs space-y-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-2.5">
                  Payment Method
                </h3>

                <div className="space-y-3">
                  {/* COD */}
                  <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-500 bg-primary-50/10 text-primary-800 font-bold'
                      : 'border-gray-250 bg-white text-gray-500'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_select"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <div className="text-xs">
                        <p className="font-extrabold uppercase tracking-wide">Cash on Delivery</p>
                        <p className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">
                          Pay cash or UPI to rider at delivery.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Online Razorpay */}
                  <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-primary-500 bg-primary-50/10 text-primary-800 font-bold'
                      : 'border-gray-250 bg-white text-gray-500'
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment_select"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="text-primary-600 focus:ring-primary-500 mt-0.5"
                      />
                      <div className="text-xs">
                        <p className="font-extrabold uppercase tracking-wide">Pay Online via UPI/Card</p>
                        <p className="text-[10px] text-gray-400 font-medium leading-normal mt-0.5">
                          Pay instantly and securely using Razorpay (Cards, UPI, Netbanking).
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Summaries */}
                <div className="space-y-2.5 text-xs pt-3 border-t border-gray-100">
                  <div className="flex justify-between font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-gray-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-500">
                    <span>Delivery Charge</span>
                    <span>{deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}</span>
                  </div>
                  <div className="border-t border-gray-150 pt-2.5 flex justify-between font-black text-sm text-primary-900">
                    <span>Grand Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full btn-primary py-3 px-4 font-extrabold rounded-lg flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'razorpay' ? 'Pay & Place Order' : 'Place COD Order'} ({formatCurrency(grandTotal)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: ORDER SUCCESS */}
      {step === 4 && placedOrder && (
        <div className="card-base p-8 md:p-12 text-center max-w-xl mx-auto shadow-xs animate-fadeIn flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-primary-600 animate-bounce" />
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-primary-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-6">
            Order Reference: <span className="text-gray-800 font-black tracking-normal">{placedOrder.orderNumber}</span>
          </p>

          <div className="bg-gray-50 border border-gray-150 rounded-xl p-5 mb-8 text-xs leading-normal max-w-md text-left">
            {hasRxItems ? (
              <div className="space-y-1 text-amber-800">
                <h4 className="font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" /> Action: Prescription Verification Pending
                </h4>
                <p className="text-[11px] text-amber-700 font-medium">
                  Your order has been placed and is awaiting store prescription review and approval. You will be notified once confirmed.
                </p>
              </div>
            ) : (
              <div className="space-y-1 text-primary-800">
                <h4 className="font-extrabold text-primary-900 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0 text-primary-600" /> Awaiting Store Approval
                </h4>
                <p className="text-[11px] text-primary-700 font-medium">
                  Your order has been placed and is awaiting store approval. You will be notified once confirmed.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
            <Link to="/products" className="btn-white py-2.5 px-6 font-bold shadow-xs text-center flex-1 text-xs">
              Continue Shopping
            </Link>
            <Link to={`/my-orders/${placedOrder._id}`} className="btn-primary py-2.5 px-6 font-bold shadow-xs text-center flex-1 text-xs">
              Track Order Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
