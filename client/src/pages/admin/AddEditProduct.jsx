import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, AlertCircle, Sparkles, Check, X, Search, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

// Zod client validation schema
const schema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  brand: z.string().min(1, 'Brand is required'),
  manufacturer: z.string().nullable().optional(),
  composition: z.string().nullable().optional(),
  category: z.enum([
    'Tablets & Capsules', 'Syrups & Liquids', 'Injections',
    'Surgical & Devices', 'Vitamins & Supplements',
    'Baby Care', 'Personal Care', 'Ayurvedic & Herbal'
  ], { required_error: 'Category is required' }),
  form: z.enum(['TAB', 'CAP', 'SYP', 'INH', 'GEL', 'CREAM', 'DROP', 'INJ', 'POWDER', 'OTHER'], { required_error: 'Form is required' }),
  dosage: z.string().nullable().optional(),
  mrp: z.coerce.number().positive('MRP must be a positive number'),
  sellingPrice: z.coerce.number().positive('Selling Price must be a positive number'),
  discount: z.coerce.number().min(0).max(100).optional().default(0),
  rxType: z.enum(['OTC', 'H', 'NRX', 'H1']).default('OTC'),
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional().default(10),
  expiryDate: z.string().nullable().optional(),
  batchNumber: z.string().nullable().optional(),
  hsnCode: z.string().nullable().optional(),
  gstRate: z.coerce.number().default(12),
  description: z.string().nullable().optional(),
  sideEffects: z.string().nullable().optional(),
  storageInstructions: z.string().nullable().optional(),
  rackLocation: z.string().nullable().optional(),
  tagsInput: z.string().optional()
}).refine(data => data.sellingPrice <= data.mrp, {
  message: 'Selling price cannot be greater than MRP',
  path: ['sellingPrice']
});

export default function AddEditProduct() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState(null);

  // OpenFDA state
  const [fdaSuggestion, setFdaSuggestion] = useState(null);
  const [fdaLoading, setFdaLoading] = useState(false);
  const [hideFda, setHideFda] = useState(false);

  // Substitutes multi-select state
  const [subQuery, setSubQuery] = useState('');
  const [subResults, setSubResults] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [selectedSubstitutes, setSelectedSubstitutes] = useState([]);

  const debouncedSubQuery = useDebounce(subQuery, 300);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      brand: '',
      manufacturer: '',
      composition: '',
      category: 'Tablets & Capsules',
      form: 'TAB',
      dosage: '',
      mrp: '',
      sellingPrice: '',
      discount: 0,
      rxType: 'OTC',
      stock: 0,
      lowStockThreshold: 10,
      expiryDate: '',
      batchNumber: '',
      hsnCode: '',
      gstRate: 12,
      description: '',
      sideEffects: '',
      storageInstructions: '',
      rackLocation: '',
      tagsInput: ''
    }
  });

  const watchName = watch('name');
  const watchMrp = watch('mrp');
  const watchSellingPrice = watch('sellingPrice');
  const debouncedName = useDebounce(watchName, 500);

  // Fetch product details for editing
  useEffect(() => {
    if (isEdit) {
      const getProduct = async () => {
        setFetchLoading(true);
        try {
          const response = await api.get(`/api/products/${id}`);
          if (response.data && response.data.success) {
            const product = response.data.data;
            
            // Populate form fields
            setValue('name', product.name || '');
            setValue('brand', product.brand || '');
            setValue('manufacturer', product.manufacturer || '');
            setValue('composition', product.composition || '');
            setValue('category', product.category || 'Tablets & Capsules');
            setValue('form', product.form || 'TAB');
            setValue('dosage', product.dosage || '');
            setValue('mrp', product.mrp || '');
            setValue('sellingPrice', product.sellingPrice || '');
            setValue('discount', product.discount || 0);
            setValue('rxType', product.rxType || 'OTC');
            setValue('stock', product.stock || 0);
            setValue('lowStockThreshold', product.lowStockThreshold || 10);
            setValue('batchNumber', product.batchNumber || '');
            setValue('hsnCode', product.hsnCode || '');
            setValue('gstRate', product.gstRate || 12);
            setValue('description', product.description || '');
            setValue('sideEffects', product.sideEffects || '');
            setValue('storageInstructions', product.storageInstructions || '');
            setValue('rackLocation', product.rackLocation || '');
            
            if (product.tags) {
              setValue('tagsInput', product.tags.join(', '));
            }

            if (product.expiryDate) {
              setValue('expiryDate', new Date(product.expiryDate).toISOString().split('T')[0]);
            }

            if (product.substitutes) {
              setSelectedSubstitutes(product.substitutes);
            }
          }
        } catch (err) {
          console.error(err);
          setError('Failed to fetch medicine details.');
        } finally {
          setFetchLoading(false);
        }
      };
      getProduct();
    }
  }, [id, isEdit, setValue]);

  // OpenFDA lookup triggered by debounced name
  useEffect(() => {
    const triggerFdaLookup = async () => {
      if (hideFda || !debouncedName || debouncedName.trim().length < 3 || isEdit) {
        return;
      }
      setFdaLoading(true);
      setFdaSuggestion(null);
      try {
        const response = await api.get('/api/products/openfda-lookup', {
          params: { name: debouncedName }
        });
        if (response.data && response.data.success && response.data.data) {
          setFdaSuggestion(response.data.data);
        }
      } catch (err) {
        console.error('FDA auto-fill error:', err);
      } finally {
        setFdaLoading(false);
      }
    };
    triggerFdaLookup();
  }, [debouncedName, hideFda, isEdit]);

  // Auto-calculate discount percentage from MRP and Selling Price
  useEffect(() => {
    const mrpNum = parseFloat(watchMrp);
    const sellNum = parseFloat(watchSellingPrice);
    if (!isNaN(mrpNum) && !isNaN(sellNum) && mrpNum > 0 && sellNum <= mrpNum) {
      const calcDiscount = Math.round(((mrpNum - sellNum) / mrpNum) * 100);
      setValue('discount', calcDiscount);
    } else {
      setValue('discount', 0);
    }
  }, [watchMrp, watchSellingPrice, setValue]);

  // Debounced search for substitute products
  useEffect(() => {
    const searchSubs = async () => {
      if (!debouncedSubQuery || debouncedSubQuery.trim().length < 2) {
        setSubResults([]);
        return;
      }
      setSubLoading(true);
      try {
        const response = await api.get('/api/products/search', {
          params: { q: debouncedSubQuery, suggest: 'true' }
        });
        if (response.data && response.data.success) {
          // Filter out the current product from suggestions
          const filtered = response.data.data.filter(item => item._id !== id);
          setSubResults(filtered);
        }
      } catch (err) {
        console.error('Error fetching substitutes:', err);
      } finally {
        setSubLoading(false);
      }
    };
    searchSubs();
  }, [debouncedSubQuery, id]);

  const handleSelectSubstitute = (medicine) => {
    if (!selectedSubstitutes.some(item => item._id === medicine._id)) {
      setSelectedSubstitutes([...selectedSubstitutes, medicine]);
    }
    setSubQuery('');
    setSubResults([]);
  };

  const handleRemoveSubstitute = (medicineId) => {
    setSelectedSubstitutes(selectedSubstitutes.filter(item => item._id !== medicineId));
  };

  const onFormSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      // Parse tags
      const tags = data.tagsInput
        ? data.tagsInput.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      const payload = {
        ...data,
        tags
      };
      delete payload.tagsInput;

      let productId = id;
      if (isEdit) {
        await api.put(`/api/products/${id}`, payload);
      } else {
        const response = await api.post('/api/products', payload);
        if (response.data && response.data.success) {
          productId = response.data.data._id;
        }
      }

      // Link substitutes
      const substituteIds = selectedSubstitutes.map(s => s._id);
      await api.put(`/api/products/${productId}/substitutes`, { substituteIds });

      alert(`Medicine ${isEdit ? 'updated' : 'added'} successfully.`);
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred while saving the product.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
        Loading medicine records...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      {/* Back button and title */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin/products" className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-blue-700 hover:border-blue-100 transition-colors bg-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-blue-900">
            {isEdit ? 'Edit Medicine Stock' : 'Add New Medicine'}
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            Fill standard pharmacy and stock tracking parameters.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-2 mb-6 text-sm text-red-800 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* FDA lookup suggestion box */}
      {!isEdit && fdaLoading && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          <span className="text-xs font-semibold text-blue-800">
            Checking OpenFDA database for active ingredients...
          </span>
        </div>
      )}

      {!isEdit && fdaSuggestion && !hideFda && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 animate-fadeIn shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-blue-900">OpenFDA Active Ingredient Suggestion</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  We found matching active components for <span className="font-bold text-blue-800">"{watchName}"</span>.
                </p>
                <div className="bg-white border border-blue-100/50 rounded-lg py-2 px-3.5 mt-3 text-sm font-semibold text-blue-950">
                  {fdaSuggestion}
                </div>
              </div>
            </div>
            <button
              onClick={() => setHideFda(true)}
              className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2.5 mt-4 justify-end">
            <button
              onClick={() => setHideFda(true)}
              className="btn-white py-1.5 px-3.5 text-xs font-bold"
            >
              Ignore
            </button>
            <button
              onClick={() => {
                setValue('composition', fdaSuggestion);
                setFdaSuggestion(null);
                setHideFda(true);
              }}
              className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Accept Ingredient
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        
        {/* SECTION 1: core medicine details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-blue-900 border-b border-gray-100 pb-2">
            1. Medicine Specifications
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Medicine Name *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. ACILOC 150MG"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 font-semibold">{errors.name.message}</p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Brand/Company Name *
              </label>
              <input
                type="text"
                {...register('brand')}
                placeholder="e.g. CADILA PHARMA"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.brand ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.brand && (
                <p className="text-xs text-red-500 mt-1 font-semibold">{errors.brand.message}</p>
              )}
            </div>

            {/* Composition */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Composition Salts (Generic Name)
              </label>
              <input
                type="text"
                {...register('composition')}
                placeholder="e.g. Ranitidine 150mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Manufacturer/Marketer
              </label>
              <input
                type="text"
                {...register('manufacturer')}
                placeholder="e.g. Cadila Pharmaceuticals Ltd."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Product Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Tablets & Capsules">Tablets & Capsules</option>
                <option value="Syrups & Liquids">Syrups & Liquids</option>
                <option value="Injections">Injections</option>
                <option value="Surgical & Devices">Surgical & Devices</option>
                <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                <option value="Baby Care">Baby Care</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Ayurvedic & Herbal">Ayurvedic & Herbal</option>
              </select>
              {errors.category && (
                <p className="text-xs text-red-500 mt-1 font-semibold">{errors.category.message}</p>
              )}
            </div>

            {/* Form */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Form Factor *
              </label>
              <select
                {...register('form')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="TAB">Tablet (TAB)</option>
                <option value="CAP">Capsule (CAP)</option>
                <option value="SYP">Syrup/Liquid (SYP)</option>
                <option value="INH">Inhaler (INH)</option>
                <option value="GEL">Gel/Ointment (GEL)</option>
                <option value="CREAM">Cream (CREAM)</option>
                <option value="DROP">Drops (DROP)</option>
                <option value="INJ">Injection (INJ)</option>
                <option value="POWDER">Powder (POWDER)</option>
                <option value="OTHER">Other (OTHER)</option>
              </select>
              {errors.form && (
                <p className="text-xs text-red-500 mt-1 font-semibold">{errors.form.message}</p>
              )}
            </div>

            {/* Dosage */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Dosage Strength
              </label>
              <input
                type="text"
                {...register('dosage')}
                placeholder="e.g. 150mg or 500mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* RxType */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Prescription Drug Class *
              </label>
              <select
                {...register('rxType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="OTC">OTC (Over the Counter)</option>
                <option value="H">Schedule H (Prescription Required)</option>
                <option value="NRX">NRx (Narcotic - Approval Required)</option>
                <option value="H1">Schedule H1 (Strict Control Warning)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Pricing & Stock */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-blue-900 border-b border-gray-100 pb-2">
            2. Pricing, Expiry & Stock Controls
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MRP */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                MRP (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('mrp')}
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.mrp ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.mrp && (
                <p className="text-xs text-red-500 mt-1 font-semibold">{errors.mrp.message}</p>
              )}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('sellingPrice')}
                placeholder="0.00"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.sellingPrice ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.sellingPrice && (
                <p className="text-xs text-red-500 mt-1 font-semibold">{errors.sellingPrice.message}</p>
              )}
            </div>

            {/* Auto Discount */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Auto-calculated Discount
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-600 font-extrabold flex items-center justify-between">
                <span>{watch('discount')}%</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">OFF</span>
              </div>
            </div>

            {/* Stock Count */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Initial Stock Qty *
              </label>
              <input
                type="number"
                {...register('stock')}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.stock ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {errors.stock && (
                <p className="text-xs text-red-500 mt-1 font-semibold">{errors.stock.message}</p>
              )}
            </div>

            {/* Low stock threshold */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Low Stock Warning Limit
              </label>
              <input
                type="number"
                {...register('lowStockThreshold')}
                placeholder="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Expiry Date
              </label>
              <input
                type="date"
                {...register('expiryDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Batch Number */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Batch Number
              </label>
              <input
                type="text"
                {...register('batchNumber')}
                placeholder="e.g. B1042"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* HSN Code */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                GST HSN Code
              </label>
              <input
                type="text"
                {...register('hsnCode')}
                placeholder="e.g. 3004"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* GST Rate */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                GST Rate Percentage
              </label>
              <select
                {...register('gstRate')}
                onChange={e => setValue('gstRate', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value={5}>5% (Basic Medicines)</option>
                <option value={12}>12% (Standard Formulations)</option>
                <option value={18}>18% (Devices / Syringes)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Inventory Layout & Substitutes */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-extrabold text-blue-900 border-b border-gray-100 pb-2">
            3. Rack Location & Substitutes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Rack location */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Store Rack/Cabinet Location
              </label>
              <input
                type="text"
                {...register('rackLocation')}
                placeholder="e.g. Cabinet-A3 Shelf-2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Tags comma-separated */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Search Tags (comma-separated)
              </label>
              <input
                type="text"
                {...register('tagsInput')}
                placeholder="e.g. antacid, gas, acidity, ranitidine"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Linked substitutes Search multi-select */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Link Alternative Substitute Medicines
            </label>
            <div className="relative">
              <input
                type="text"
                value={subQuery}
                onChange={(e) => setSubQuery(e.target.value)}
                placeholder="Search other medicines to link as alternates..."
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
              {subLoading && (
                <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-blue-600 animate-spin" />
              )}
              
              {/* Floating search suggestions drawer */}
              {subResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto z-40 divide-y divide-gray-100">
                  {subResults.map((medicine) => (
                    <div
                      key={medicine._id}
                      onClick={() => handleSelectSubstitute(medicine)}
                      className="p-2.5 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-extrabold text-gray-800">{medicine.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                          {medicine.brand} &bull; {medicine.form}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded-full">
                        Add Alternate
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Displayed alternate pills */}
            {selectedSubstitutes.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSubstitutes.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 py-1 pl-3 pr-2.5 rounded-full"
                  >
                    <span>{item.name} <span className="text-[10px] text-gray-400 font-medium">({item.brand})</span></span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubstitute(item._id)}
                      className="p-0.5 rounded-full text-gray-400 hover:bg-gray-250 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 font-semibold italic mt-2">
                No alternates linked yet. Customers will only see standard composition matchings.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 4: Extra Descriptions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-blue-900 border-b border-gray-100 pb-2">
            4. Details, Side Effects & Storage Instructions
          </h3>

          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Description / Purpose
              </label>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Describe what the medicine is primarily used for..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Side effects */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Side Effects
                </label>
                <textarea
                  rows={2}
                  {...register('sideEffects')}
                  placeholder="e.g. Headache, dizziness, nausea"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Storage */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Storage Instructions
                </label>
                <textarea
                  rows={2}
                  {...register('storageInstructions')}
                  placeholder="e.g. Keep cool, protect from light, dry cabinet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/admin/products"
            className="btn-white py-2.5 px-6 font-semibold shadow-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-2.5 px-6 font-semibold flex items-center justify-center gap-1.5 shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Medicine
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
