import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Truck, ClipboardList, Clock, Search } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>Pankaj Medical & General Stores — Online Pharmacy in Kanpur</title>
        <meta name="description" content="Order genuine prescription medicines, OTC drugs, and wellness products online. Fast doorstep delivery inside Kanpur. GSTIN-compliant licensed pharmacy." />
        <meta name="keywords" content="online pharmacy Kanpur, medicine delivery Kanpur, prescription medicines, Pankaj Medical" />
        <meta property="og:title" content="Pankaj Medical & General Stores" />
        <meta property="og:description" content="Your trusted neighborhood online pharmacy. Genuine medicines delivered fast in Kanpur." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://pankajmedical.in/" />
      </Helmet>
      {/* Hero Section */}
      <section className="bg-teal-50 border-b border-teal-100 py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-center md:text-left">
            <span className="bg-teal-100 text-teal-800 font-semibold px-3 py-1 rounded-full text-sm inline-block mb-4">
              Est. Kidwainagar, Kanpur
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-teal-900 tracking-tight leading-tight mb-6">
              Pankaj Medical & <br />
              General Stores
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Your trusted partner in healthcare. Order prescription medicines, over-the-counter
              wellness products, and baby care items with direct doorstep delivery in Kanpur.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <Link to="/login" className="btn-teal text-center inline-block">
                Order Medicines Now
              </Link>
              <Link to="/about" className="btn-teal-outline text-center inline-block">
                Learn About Us
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="text-teal-600 w-5 h-5" /> Store Timings
            </h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-medium text-gray-800">Monday - Saturday</span>
                <span>09:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-medium text-gray-800">Sunday</span>
                <span>10:00 AM - 08:00 PM</span>
              </div>
              <div className="flex items-center gap-3 text-teal-800 bg-teal-50 p-3 rounded-lg border border-teal-100 mt-4 text-sm">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>GSTIN-compliant pharmacy holding valid wholesale & retail licenses.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Why Choose Pankaj Medical?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-xs hover:border-teal-300 transition-colors">
            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">100% Genuine Medicines</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We source directly from licensed manufacturers and top distributors. Complete batch
              tracking and expiry date monitoring.
            </p>
          </div>

          {/* Card 2 */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-xs hover:border-teal-300 transition-colors">
            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 mb-4">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Prescription Verification</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Dedicated staff reviewing Schedule H and NRX approvals within working hours to keep
              healthcare safe and compliant.
            </p>
          </div>

          {/* Card 3 */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-xs hover:border-teal-300 transition-colors">
            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Fast Doorstep Delivery</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Same-day delivery inside service zones in Kanpur. Secure packaging ensures the safety
              and privacy of your items.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Search Showcase */}
      <section className="bg-gray-50 border-t border-b border-gray-200 py-16 px-4 md:px-8 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Looking for a specific salt or brand?
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            We list Tablets, Syrups, Injections, Supplements, and baby care items. Log in to search
            our active inventory database.
          </p>
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search Aciloc, Paracetamol, Dolo..."
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              readOnly
              onClick={() => (window.location.href = '/login')}
            />
            <Search className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
