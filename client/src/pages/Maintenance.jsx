import React, { useEffect, useState } from 'react';
import { ShieldAlert, Phone, Mail, Clock, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Maintenance() {
  const [contact, setContact] = useState({
    pharmacyPhone: '+91 99999 99999',
    pharmacyEmail: 'contact@pankajmedical.com',
    workingHours: { open: '09:00', close: '22:00' }
  });

  useEffect(() => {
    // Poll for maintenance mode lift every 30 seconds
    const checkIfBack = async () => {
      try {
        const res = await api.get('/api/settings/public');
        if (res.data?.data?.maintenanceMode === false) {
          window.location.reload();
        } else if (res.data?.data) {
          setContact(res.data.data);
        }
      } catch {
        // If 503 is returned, we're still in maintenance — that's expected
      }
    };

    checkIfBack();
    const interval = setInterval(checkIfBack, 30000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center px-4 py-16 font-sans">
      
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-teal-500/5 blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-64 h-64 rounded-full bg-amber-500/5 blur-3xl bottom-10 right-10 animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 max-w-xl w-full space-y-8 text-center">

        {/* Icon + pulse ring */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-400/40 flex items-center justify-center shadow-xl">
              <ShieldAlert className="w-10 h-10 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
            We'll be back soon
          </h1>
          <p className="text-sm md:text-base text-teal-300/80 font-medium leading-relaxed max-w-md mx-auto">
            Pankaj Medical &amp; General Stores is currently undergoing scheduled system maintenance.
            Our team is working hard to improve your experience.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 space-y-5 text-left shadow-2xl">
          
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black text-white/60 uppercase tracking-widest">Maintenance in Progress</span>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Need immediate assistance?</p>
            
            {contact.pharmacyPhone && (
              <a
                href={`tel:${contact.pharmacyPhone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/15 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-4.5 h-4.5 text-teal-400" />
                </div>
                <div>
                  <p className="text-[10px] text-teal-400/70 font-bold uppercase tracking-wider">Call Us</p>
                  <p className="text-sm font-bold text-teal-300 group-hover:text-white transition-colors">{contact.pharmacyPhone}</p>
                </div>
              </a>
            )}

            {contact.pharmacyEmail && (
              <a
                href={`mailto:${contact.pharmacyEmail}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/15 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4.5 h-4.5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400/70 font-bold uppercase tracking-wider">Email Us</p>
                  <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{contact.pharmacyEmail}</p>
                </div>
              </a>
            )}

            {contact.workingHours && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-wider">Store Hours</p>
                  <p className="text-sm font-bold text-amber-300">
                    {fmt(contact.workingHours.open)} – {fmt(contact.workingHours.close)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auto-refresh hint */}
        <div className="flex items-center justify-center gap-2 text-white/30 text-[11px] font-semibold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
          This page checks automatically every 30 seconds
        </div>

        {/* Footer */}
        <p className="text-white/20 text-xs font-medium">
          © {new Date().getFullYear()} Pankaj Medical &amp; General Stores · Kidwainagar, Kanpur
        </p>

      </div>
    </div>
  );
}
