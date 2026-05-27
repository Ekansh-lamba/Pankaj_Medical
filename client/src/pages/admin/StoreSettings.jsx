import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Plus,
  Trash2,
  Clock,
  Truck,
  Phone,
  Mail,
  ShieldAlert,
  Loader2,
  Check,
  Percent,
  X
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StoreSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');

  // Auto Offer form temp state (for adding a new auto offer)
  const [newOffer, setNewOffer] = useState({
    title: '',
    minOrderValue: 0,
    discountType: 'percentage',
    discountValue: 0,
    maxDiscount: '',
    isActive: true
  });

  const [showAddOffer, setShowAddOffer] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/settings/admin');
      if (res.data && res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
      toast.error('Failed to load store settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingHoursChange = (type, value) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [type]: value
      }
    }));
  };

  // Serviceable Pin Codes handlers
  const handleAddPinCode = (e) => {
    e.preventDefault();
    const pin = pincodeInput.trim();
    if (!pin) return;
    
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Pin code must be exactly 6 digits.');
      return;
    }

    if (settings.serviceablePinCodes.includes(pin)) {
      toast.error('Pin code is already in the serviceable list.');
      return;
    }

    setSettings(prev => ({
      ...prev,
      serviceablePinCodes: [...prev.serviceablePinCodes, pin]
    }));
    setPincodeInput('');
  };

  const handleRemovePinCode = (pin) => {
    setSettings(prev => ({
      ...prev,
      serviceablePinCodes: prev.serviceablePinCodes.filter(p => p !== pin)
    }));
  };

  // Auto applied offers handlers
  const handleAddAutoOffer = (e) => {
    e.preventDefault();
    if (!newOffer.title.trim()) {
      toast.error('Offer title is required.');
      return;
    }
    if (newOffer.discountValue <= 0) {
      toast.error('Discount value must be greater than 0.');
      return;
    }

    const offerObj = {
      title: newOffer.title.trim(),
      minOrderValue: Number(newOffer.minOrderValue) || 0,
      discountType: newOffer.discountType,
      discountValue: Number(newOffer.discountValue) || 0,
      maxDiscount: newOffer.maxDiscount ? Number(newOffer.maxDiscount) : undefined,
      isActive: newOffer.isActive
    };

    setSettings(prev => ({
      ...prev,
      autoOffers: [...(prev.autoOffers || []), offerObj]
    }));

    setNewOffer({
      title: '',
      minOrderValue: 0,
      discountType: 'percentage',
      discountValue: 0,
      maxDiscount: '',
      isActive: true
    });
    setShowAddOffer(false);
    toast.success('Auto-applied offer added locally. Click Save below to persist.');
  };

  const handleRemoveAutoOffer = (index) => {
    setSettings(prev => ({
      ...prev,
      autoOffers: prev.autoOffers.filter((_, i) => i !== index)
    }));
  };

  const handleToggleOfferStatus = (index) => {
    setSettings(prev => ({
      ...prev,
      autoOffers: prev.autoOffers.map((o, i) => i === index ? { ...o, isActive: !o.isActive } : o)
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.put('/api/settings/admin', settings);
      if (res.data && res.data.success) {
        toast.success('Store configurations saved successfully!');
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error(err.response?.data?.message || 'Failed to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-semibold text-blue-800">Fetching store settings and governance configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-blue-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-700" /> Store Settings & Governance
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
            Manage delivery thresholds, operating hours, active pin codes, auto discounts, and maintenance controls.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 text-xs py-2.5 px-5 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Delivery & Logistics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Financial Limits & Delivery */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" /> Financial Settings & Logistics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Delivery Charge (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={settings.deliveryCharge}
                    onChange={(e) => handleFieldChange('deliveryCharge', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Free Delivery Threshold (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) => handleFieldChange('freeDeliveryThreshold', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Minimum Order Value (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={settings.minimumOrderValue}
                    onChange={(e) => handleFieldChange('minimumOrderValue', Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estimated Delivery (Hours)</label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-gray-400 text-xs font-bold">Hrs</span>
                  <input
                    type="number"
                    value={settings.estimatedDeliveryHours}
                    onChange={(e) => handleFieldChange('estimatedDeliveryHours', Number(e.target.value))}
                    className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Serviceable Pin Codes */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" /> Serviceable Pin Codes (Kanpur Area)
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                Customers must select or input one of these pin codes to place an order.
              </p>
            </div>

            <form onSubmit={handleAddPinCode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit pin code (e.g. 208011)"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Pin
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2 max-h-48 overflow-y-auto border border-dashed border-gray-100 rounded-lg p-2.5 bg-slate-50/50">
              {settings.serviceablePinCodes?.length > 0 ? (
                settings.serviceablePinCodes.map(pin => (
                  <span
                    key={pin}
                    className="inline-flex items-center gap-1 text-[10px] font-black bg-blue-100/70 text-blue-800 border border-blue-100 px-2 py-1 rounded-md"
                  >
                    {pin}
                    <button
                      type="button"
                      onClick={() => handleRemovePinCode(pin)}
                      className="text-blue-600 hover:text-red-600 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <div className="w-full text-center text-xs text-gray-400 py-4 italic">
                  No serviceable pin codes configured. Deliveries will be blocked!
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Auto-Applied Offers & Discounts */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-blue-600" /> Auto-Applied Discounts
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  These offers are evaluated and applied automatically in the cart based on order size.
                </p>
              </div>

              {!showAddOffer && (
                <button
                  onClick={() => setShowAddOffer(true)}
                  className="px-3 py-1.5 border border-blue-100 text-blue-700 bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Auto-Offer
                </button>
              )}
            </div>

            {/* Add Auto-Offer form inline */}
            {showAddOffer && (
              <form onSubmit={handleAddAutoOffer} className="border border-blue-100 bg-blue-50/20 rounded-xl p-4 space-y-3.5 text-xs animate-fadeIn">
                <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                  <span className="font-extrabold text-blue-800 text-xs uppercase tracking-wider">New Auto Applied Offer Rule</span>
                  <button type="button" onClick={() => setShowAddOffer(false)} className="text-gray-400 hover:text-gray-650">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Offer Display Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10% Discount on orders above ₹1000"
                      value={newOffer.title}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Min Order Value (₹)</label>
                    <input
                      type="number"
                      value={newOffer.minOrderValue}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, minOrderValue: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Discount Type</label>
                    <select
                      value={newOffer.discountType}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, discountType: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none font-bold"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Value (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Discount Value *</label>
                    <input
                      type="number"
                      required
                      value={newOffer.discountValue}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, discountValue: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Max Cap (₹, Percentage only)</label>
                    <input
                      type="number"
                      placeholder="No limit"
                      value={newOffer.maxDiscount}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, maxDiscount: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={() => setShowAddOffer(false)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                  >
                    Confirm Rule
                  </button>
                </div>
              </form>
            )}

            {/* List of active auto applied offers */}
            <div className="space-y-3 pt-1">
              {settings.autoOffers?.length > 0 ? (
                settings.autoOffers.map((offer, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors ${
                      offer.isActive ? 'border-gray-200 bg-slate-50/40 hover:bg-slate-50' : 'border-gray-150 bg-gray-50/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-800 text-sm">{offer.title}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          offer.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {offer.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400 font-semibold uppercase">
                        <span>Min Order: ₹{offer.minOrderValue}</span>
                        <span>Value: {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}</span>
                        {offer.maxDiscount && <span>Max Cap: ₹{offer.maxDiscount}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleToggleOfferStatus(idx)}
                        className={`text-[10px] font-bold px-2.5 py-1 border rounded-lg transition-colors ${
                          offer.isActive
                            ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveAutoOffer(idx)}
                        className="p-1.5 border border-gray-200 text-gray-400 hover:text-red-650 hover:border-red-200 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-400 italic">
                  No automated discount offers are configured.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Timings & Security */}
        <div className="space-y-8">
          
          {/* Section 4: Operating Hours & Contact */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" /> Operating Timings & Contacts
            </h3>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Open Time</label>
                  <input
                    type="time"
                    value={settings.workingHours?.open || '09:00'}
                    onChange={(e) => handleWorkingHoursChange('open', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Close Time</label>
                  <input
                    type="time"
                    value={settings.workingHours?.close || '22:00'}
                    onChange={(e) => handleWorkingHoursChange('close', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Pharmacy Support Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 99999 99999"
                  value={settings.pharmacyPhone || ''}
                  onChange={(e) => handleFieldChange('pharmacyPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Pharmacy Support Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. contact@pankajmedical.com"
                  value={settings.pharmacyEmail || ''}
                  onChange={(e) => handleFieldChange('pharmacyEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: System Maintenance & Offline Governance */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-500" /> System Operations Status
            </h3>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleFieldChange('maintenanceMode', !settings.maintenanceMode)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                    settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                      settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div>
                  <span className="block font-black text-gray-800 text-xs uppercase tracking-wide">Maintenance Mode Toggle</span>
                  <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">
                    Activating this blocks all customers from using the platform.
                  </span>
                </div>
              </div>

              {settings.maintenanceMode ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-lg space-y-1.5">
                  <div className="font-extrabold text-red-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <ShieldAlert className="w-4.5 h-4.5 text-red-500" /> Critical Warning
                  </div>
                  <p className="text-[11px] font-semibold text-red-700">
                    Platform is offline. All client-side product lists, searches, orders, and payments are blocked. Admin control operations remain active.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border-l-4 border-green-500 p-3.5 rounded-r-lg space-y-1.5">
                  <div className="font-extrabold text-green-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <Check className="w-4 h-4 text-green-500" /> Platform Operational
                  </div>
                  <p className="text-[11px] font-semibold text-green-700">
                    Everything is fully live. Customers can browse inventory, upload prescriptions, and place cash/online payments.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
