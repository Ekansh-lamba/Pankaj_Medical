import React from 'react';
import { Landmark, MapPin, Award, CheckCircle } from 'lucide-react';

const About = () => {
  const pharmacyDetails = {
    name: 'PANKAJ MEDICAL AND GENERAL STORES',
    address: '133/17 M Block, Kidwainagar, Kanpur Nagar, Uttar Pradesh',
    gstin: '09ACPPL2448G1ZB'
  };

  return (
    <div className="bg-white min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-900 mb-4">
            About Our Pharmacy
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Providing high-quality medicines, healthcare supplements, and personal care products
            with trust and care.
          </p>
        </div>

        {/* Corporate Profile Card */}
        <div className="border border-gray-200 rounded-xl p-8 bg-white shadow-sm mb-10">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
            <Landmark className="text-primary-600 w-6 h-6" /> Licensed Corporate Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Registered Store Name
                </span>
                <span className="text-base font-bold text-primary-800">{pharmacyDetails.name}</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  GSTIN Number
                </span>
                <span className="text-base font-mono font-bold text-gray-800">
                  {pharmacyDetails.gstin}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Physical Address
                </span>
                <span className="text-base text-gray-700 flex items-start gap-1.5 mt-1">
                  <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{pharmacyDetails.address}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-100 p-4 rounded-lg flex items-center gap-3">
            <Award className="text-primary-800 w-6 h-6 shrink-0" />
            <p className="text-sm text-primary-900 leading-normal">
              Licensed pharmacy operating inside Kanpur Nagar, strictly enforcing prescription check
              rules on Schedule H/NRX medicines under Drug Controller regulatory guidelines.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Our Commitment</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              At Pankaj Medical & General Stores, customer safety is our top priority. Every
              medicine in our inventory undergoes standard expiration checks daily. Medicines
              approaching expiry within 30 days are automatically withdrawn from the marketplace.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              We ensure complete transparency with digital invoices reflecting CGST and SGST splits
              for all intra-state transactions in Uttar Pradesh.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quality Standards</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <span>Procured only from verified wholesale channels.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <span>Strict preservation at manufacturer-recommended storage temperatures.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <span>Dedicated pharmacists verifying digital prescription uploads.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <span>Computerized billing with genuine HSN codes and GST rates.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
