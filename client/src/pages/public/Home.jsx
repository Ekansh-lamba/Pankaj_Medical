import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Truck, ClipboardList, Clock, ArrowRight, Activity, Award, CheckCircle } from 'lucide-react';
import SearchBar from '../../components/shared/SearchBar';
import ProductCard from '../../components/shared/ProductCard';
import api from '../../services/api';

const categories = [
  { name: 'Tablets & Capsules', emoji: '💊' },
  { name: 'Syrups & Liquids', emoji: '🧴' },
  { name: 'Injections', emoji: '💉' },
  { name: 'Surgical & Devices', emoji: '🩺' },
  { name: 'Vitamins & Supplements', emoji: '🌿' },
  { name: 'Baby Care', emoji: '👶' },
  { name: 'Personal Care', emoji: '💅' },
  { name: 'Ayurvedic & Herbal', emoji: '🍃' }
];

const Home = () => {
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const response = await api.get('/api/products', {
          params: { limit: 8, sortBy: 'newest' }
        });
        if (response.data && response.data.success) {
          // getProducts API returns { products, pagination } in data
          setPopularProducts(response.data.data.products || []);
        }
      } catch (err) {
        console.error('Error fetching popular medicines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopular();
  }, []);

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Helmet>
        <title>Pankaj Medical & General Stores — Online Pharmacy Kanpur</title>
        <meta name="description" content="Order genuine prescription medicines, OTC drugs, and wellness products online. Fast doorstep delivery inside Kanpur. GSTIN-compliant licensed pharmacy." />
        <meta name="keywords" content="online pharmacy Kanpur, medicine delivery Kanpur, prescription medicines, Pankaj Medical" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-[#1b3455] to-[#12253f] text-white py-20 px-4 md:px-8 border-b border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-800/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 bg-primary-800/50 border border-primary-700/60 text-primary-100 font-semibold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-6">
              <Award className="w-3.5 h-3.5 text-primary-300" /> Trusted Local Chemist • Kanpur
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-6">
              Your Friendly <br />
              <span className="text-primary-300">Neighborhood Pharmacy</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl mb-8 leading-relaxed font-normal">
              Get genuine healthcare products, prescription medicines, and wellness essentials delivered straight to your doorstep inside Kanpur.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link to="/products" className="btn-primary py-3 px-6 text-sm font-bold text-center flex items-center justify-center gap-2">
                Browse Medicines <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" onClick={scrollToHowItWorks} className="bg-transparent hover:bg-white/10 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 border-2 border-white/20 hover:border-white/40 text-sm text-center">
                How It Works
              </a>
            </div>

            {/* Micro Trust Indicators under Hero */}
            <div className="grid grid-cols-3 gap-4 pt-10 mt-10 border-t border-white/10 text-left">
              <div>
                <h4 className="text-xl font-bold text-white">100% Genuine</h4>
                <p className="text-xs text-slate-400">Direct distributor sourcing</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Local Service</h4>
                <p className="text-xs text-slate-400">Kidwainagar, Kanpur store</p>
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">GST Verified</h4>
                <p className="text-xs text-slate-400">Licensed pharmacists</p>
              </div>
            </div>
          </div>

          {/* Store Timing Card */}
          <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl text-slate-100">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-primary-300">
              <Clock className="w-5 h-5 text-primary-300" /> Store Timings
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="font-semibold text-slate-200">Monday - Saturday</span>
                <span className="text-primary-200">09:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="font-semibold text-slate-200">Sunday</span>
                <span className="text-primary-200">10:00 AM - 08:00 PM</span>
              </div>
              <div className="flex items-start gap-3 bg-primary-950/40 p-4 rounded-xl border border-primary-800/30 text-sm mt-6">
                <ShieldCheck className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-normal">
                  Registered wholesale and retail pharmacist holding a valid license. Fully GSTIN-compliant receipt issued with every order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Browse by Category</h2>
          <p className="text-slate-500 text-sm">Select a category to browse our wide stock of high-quality medicines and supplements.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 rounded-xl p-5 flex flex-col items-center text-center group"
            >
              <span className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-200">{cat.emoji}</span>
              <span className="text-sm font-bold text-slate-800 group-hover:text-primary-700 transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-primary-50/50 border-t border-b border-primary-100 py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">How Online Ordering Works</h2>
            <p className="text-slate-500 text-sm">Getting your medicines has never been simpler. Follow these three quick steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
              <span className="absolute -top-4 left-6 bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md">1</span>
              <h3 className="text-lg font-bold text-slate-800 mt-2 mb-3">Search & Add to Cart</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Find the precise generic salt, syrup, or brand in our search catalog. Add desired quantities to your digital shopping cart safely.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
              <span className="absolute -top-4 left-6 bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md">2</span>
              <h3 className="text-lg font-bold text-slate-800 mt-2 mb-3">Upload Prescription</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                If your medicine is classified as Schedule H or NRx, upload a photo of your prescription. Our licensed pharmacist reviews it in minutes.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
              <span className="absolute -top-4 left-6 bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md">3</span>
              <h3 className="text-lg font-bold text-slate-800 mt-2 mb-3">Same-Day Kanpur Delivery</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Once confirmed, our delivery executive brings your order in temperature-controlled packaging right to your address in Kanpur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Medicines / New Arrivals */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Popular Products</h2>
            <p className="text-slate-500 text-sm mt-1">Our latest and most requested healthcare products.</p>
          </div>
          <Link to="/products" className="group font-bold text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
            View Full Catalogue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col space-y-4 animate-pulse">
                <div className="aspect-square bg-slate-100 rounded-lg"></div>
                <div className="h-3 w-1/4 bg-slate-100 rounded"></div>
                <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                <div className="h-8 bg-slate-100 rounded mt-auto"></div>
              </div>
            ))}
          </div>
        ) : popularProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {popularProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-xl">
            <p className="text-slate-400 text-sm">No medicines available in current search.</p>
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto border-t border-slate-200">
        <h2 className="text-3xl font-black text-center text-slate-900 tracking-tight mb-12">
          Why Kanpur Trust Pankaj Medical
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-xs hover:border-primary-300 transition-colors">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">100% Genuine Stocks</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Every pill sourced directly from licensed pharma distributors. Cold-chain and expiry tracking ensured.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-xs hover:border-primary-300 transition-colors">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Fast Rx Verification</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Dedicated staff verify medical prescriptions within hours to ensure full healthcare compliance.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-xs hover:border-primary-300 transition-colors">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Kanpur Doorstep Delivery</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Quick and safe home delivery across Kanpur service pins with secure medical grade packaging.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-xs hover:border-primary-300 transition-colors">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Fully Licensed Shop</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Registered brick-and-mortar pharmacy serving local Kanpur families for years with valid drug licenses.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Search Showcase */}
      <section className="bg-primary-900 text-white py-16 px-4 md:px-8 text-center relative overflow-hidden border-t border-primary-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-xl mx-auto flex flex-col items-center relative z-10">
          <h2 className="text-3xl font-black mb-3">
            Search Our Inventory
          </h2>
          <p className="text-slate-300 mb-8 text-sm leading-relaxed">
            Quickly lookup tablets, capsules, syrups, vitamins, supplements, and Ayurvedic products. Live digital matching.
          </p>
          <div className="w-full max-w-md mx-auto flex justify-center">
            <div className="w-full text-slate-800">
              <SearchBar />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
