import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, ChevronRight, ShoppingCart, Info, Activity, ShieldAlert, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import RxBadge from '../../components/shared/RxBadge';
import ProductCard from '../../components/shared/ProductCard';
import { formatCurrency } from '../../utils/formatCurrency';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

/**
 * Standard utility to verify if an expiry Date falls in the "Expiring Soon" category (31 to 90 days from now)
 */
function checkExpiringSoon(expiryDateStr) {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 30 && diffDays <= 90;
}

/**
 * Public detailed card view for single medicine listing
 */
export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('description');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!product || product.stock <= 0) return;
    setAdding(true);
    const res = await addToCart(product, 1);
    setAdding(false);
    if (res && res.success) {
      toast.success(`${product.name} added to cart!`);
    } else if (res) {
      toast.error(res.message || 'Failed to add item');
    }
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/products/${slug}`);
        if (response.data && response.data.success) {
          setProduct(response.data.data);
          setActiveImageIdx(0);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        setError(err.response?.data?.message || 'Failed to load medicine details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 flex flex-col items-center justify-center min-h-[400px]">
        <span className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
        <span className="mt-3 text-sm text-gray-500 font-semibold">Loading product specifications...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1.5">Unable to load specifications</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{error || 'This medicine is currently unavailable or does not exist.'}</p>
        <Link to="/products" className="btn-teal inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Return to Catalogue
        </Link>
      </div>
    );
  }

  const {
    name,
    brand,
    manufacturer,
    composition,
    category,
    form,
    dosage,
    mrp,
    sellingPrice,
    discount,
    rxType,
    stock,
    expiryDate,
    images,
    description,
    sideEffects,
    storageInstructions,
    rackLocation,
    substitutes
  } = product;

  const isOutOfStock = stock <= 0;
  const isExpiringSoon = checkExpiringSoon(expiryDate);
  
  // Assemble product images with fallback placeholder
  const productImages = images && images.length > 0 ? images : [];
  const primaryImage = productImages[activeImageIdx] || '';

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
        <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?category=${encodeURIComponent(category)}`} className="hover:text-teal-600 transition-colors">{category}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-600 line-clamp-1">{name}</span>
      </nav>

      {/* Main product visual + details panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        {/* Left Column: Product Gallery */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="aspect-square bg-white border border-gray-200 rounded-2xl flex items-center justify-center p-8 relative shadow-sm">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={name}
                className="object-contain max-h-full max-w-full"
              />
            ) : (
              <svg className="w-32 h-32 text-gray-150" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
              </svg>
            )}

            {isExpiringSoon && (
              <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1">
                <Activity className="w-3 h-3" /> Expiring Soon
              </span>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-2">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 h-16 rounded-lg border-2 p-1.5 bg-white transition-all flex items-center justify-center ${
                    idx === activeImageIdx ? 'border-teal-600 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="object-contain max-h-full max-w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Spec details */}
        <div className="md:col-span-7 flex flex-col">
          <div className="pb-6 border-b border-gray-200 mb-6">
            {/* Brand Logo and Prescription labels */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-teal-50 text-teal-800 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border border-teal-100">
                {brand}
              </span>
              <RxBadge rxType={rxType} />
            </div>

            {/* Title Name */}
            <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight leading-tight mb-2">
              {name}
            </h1>

            {/* Salt composition details */}
            {composition && (
              <p className="text-sm text-gray-500 font-medium mb-4">
                <strong>Salt composition:</strong> {composition}
              </p>
            )}

            {/* Technical Sub-headers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <div>
                <span className="block text-[10px] text-gray-400 font-bold mb-1">Manufacturer</span>
                <span className="text-gray-700 font-bold">{manufacturer || 'Generic'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-bold mb-1">Dosage Form</span>
                <span className="text-gray-700 font-bold">{form}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-bold mb-1">Dosage Strength</span>
                <span className="text-gray-700 font-bold">{dosage || 'Standard'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-400 font-bold mb-1">Batch Number</span>
                <span className="text-gray-700 font-bold">{rackLocation ? `Shelf ${rackLocation}` : 'Assigned'}</span>
              </div>
            </div>
          </div>

          {/* Pricing Segments */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Special Price</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-teal-800">{formatCurrency(sellingPrice)}</span>
                {discount > 0 && (
                  <>
                    <span className="text-sm text-gray-400 line-through font-semibold">{formatCurrency(mrp)}</span>
                    <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">*Inclusive of all GST taxes</p>
            </div>

            {/* Inventory Stock Tag */}
            <div className="flex flex-col gap-1.5 items-start sm:items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inventory Status</span>
              {isOutOfStock ? (
                <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Out of Stock
                </span>
              ) : stock <= 15 ? (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Only {stock} Items Left!
                </span>
              ) : (
                <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAdd}
            disabled={adding || isOutOfStock}
            className="w-full sm:w-auto sm:min-w-[200px] btn-teal flex items-center justify-center gap-2 py-3.5 font-bold"
          >
            <ShoppingCart className="w-5 h-5" /> {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Description tabs section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs mb-12">
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          {[
            { id: 'description', label: 'Overview Description', icon: Info },
            { id: 'sideEffects', label: 'Reported Side Effects', icon: ShieldAlert },
            { id: 'storage', label: 'Storage & Handling', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-700 bg-white font-black'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 text-sm text-gray-600 leading-relaxed">
          {activeTab === 'description' && (
            <div>
              <h3 className="text-sm font-bold text-teal-800 mb-2 uppercase tracking-wide">Usage Details</h3>
              <p className="whitespace-pre-line">{description || 'No detailed description available for this medicine.'}</p>
            </div>
          )}
          {activeTab === 'sideEffects' && (
            <div>
              <h3 className="text-sm font-bold text-red-800 mb-2 uppercase tracking-wide">Clinical Safety Warnings</h3>
              <p className="whitespace-pre-line text-red-800/90">{sideEffects || 'No side effects reported or catalogued. Please consult your physician before usage.'}</p>
            </div>
          )}
          {activeTab === 'storage' && (
            <div>
              <h3 className="text-sm font-bold text-amber-800 mb-2 uppercase tracking-wide">Preservation Methods</h3>
              <p className="whitespace-pre-line">{storageInstructions || 'Keep in a cool, dry place. Protect from direct heat or light. Keep out of reach of children.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Substitutes Suggestion section */}
      {substitutes && substitutes.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-teal-900 mb-4 border-b border-gray-100 pb-2">
            Similar Alternative Medicines (Same Salt Composition)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {substitutes.map((sub) => (
              <ProductCard key={sub.slug} product={sub} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
