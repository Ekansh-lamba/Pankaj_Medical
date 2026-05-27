import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const Contact = () => {
  return (
    <div className="bg-white min-h-screen py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-900 mb-4">Contact Us</h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Have questions about medicine availability or your prescription order? Reach out to our
            pharmacy team directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Contact Details Card */}
          <div className="border border-gray-200 rounded-xl p-8 bg-white shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-3">
              Pankaj Medical Pharmacy
            </h2>

            <div className="space-y-4 text-gray-600">
              <div className="flex items-start gap-3">
                <MapPin className="text-primary-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Store Location</h4>
                  <p className="text-sm">
                    133/17 M Block, Kidwainagar, Kanpur Nagar, Uttar Pradesh - 208011
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="text-primary-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Customer Helpline</h4>
                  <p className="text-sm">+91 512 260XXXX (Landline)</p>
                  <p className="text-sm">+91 94501XXXXX (Mobile)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="text-primary-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Support Email</h4>
                  <p className="text-sm">support@pankajmedical.in</p>
                  <p className="text-sm">pankajmedicalstores@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-primary-600 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Operational Hours</h4>
                  <p className="text-sm">Monday - Saturday: 09:00 AM - 10:00 PM IST</p>
                  <p className="text-sm">Sunday: 10:00 AM - 08:00 PM IST</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-100 p-4 rounded-lg text-xs text-primary-900 leading-normal">
              <strong>Prescription Approvals Notice:</strong> Our pharmacists review prescriptions
              during working hours. Orders placed after 10:00 PM will be processed by 9:00 AM the
              following morning.
            </div>
          </div>

          {/* Simple Contact Form */}
          <div className="border border-gray-200 rounded-xl p-8 bg-white shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-3 mb-6">
              Drop Us a Message
            </h2>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                alert('Message sent successfully!');
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Your Name
                </label>
                <input type="text" placeholder="John Doe" className="input-base" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Email / Phone
                </label>
                <input
                  type="text"
                  placeholder="johndoe@gmail.com or 9999999999"
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Message Description
                </label>
                <textarea
                  rows="4"
                  placeholder="How can we help you?"
                  className="input-base"
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn-primary w-full mt-2">
                Send Query
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
