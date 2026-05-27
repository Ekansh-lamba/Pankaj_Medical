import React from 'react';
import { CheckCircle2, Circle, Clock, Ban } from 'lucide-react';

const STATUS_DETAILS = {
  pending_payment: { label: 'Order Placed', desc: 'Awaiting payment confirmation' },
  payment_failed: { label: 'Payment Failed', desc: 'Online transaction was unsuccessful' },
  pending_approval: { label: 'Awaiting Store Approval', desc: 'Pharmacist is reviewing order details' },
  confirmed: { label: 'Order Confirmed', desc: 'Stock reserved, preparation starting' },
  processing: { label: 'Processing', desc: 'Medicines are being picked and verified' },
  packed: { label: 'Packed & Ready', desc: 'Dispatched package sealed and invoiced' },
  shipped: { label: 'Shipped out', desc: 'Handed over to local Kanpur delivery team' },
  delivered: { label: 'Delivered', desc: 'Safely handed over to recipient' },
  cancelled: { label: 'Cancelled', desc: 'Order has been cancelled and stock returned' },
  return_requested: { label: 'Return Filed', desc: 'Customer raised a return request' },
  return_approved: { label: 'Return Approved', desc: 'Return accepted, refund processed' },
  return_rejected: { label: 'Return Rejected', desc: 'Return rejected by pharmacy auditor' }
};

export default function OrderTimeline({ timeline = [], currentStatus }) {
  // Sort timeline by timestamp ascending
  const sortedTimeline = [...timeline].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        Order Status Timeline
      </h3>
      
      <div className="relative border-l border-gray-200 ml-3.5 pl-6 space-y-6">
        {sortedTimeline.map((step, idx) => {
          const isLatest = idx === sortedTimeline.length - 1;
          const statusInfo = STATUS_DETAILS[step.status] || { label: step.status, desc: 'Status update' };
          const stepDate = new Date(step.timestamp);
          
          let Icon;
          let iconColor;
          
          if (step.status === 'cancelled' || step.status === 'payment_failed' || step.status === 'return_rejected') {
            Icon = Ban;
            iconColor = 'text-red-500 bg-white ring-4 ring-red-50';
          } else if (step.status === 'delivered' || step.status === 'return_approved') {
            Icon = CheckCircle2;
            iconColor = 'text-green-500 bg-white ring-4 ring-green-50';
          } else if (isLatest) {
            Icon = Clock;
            iconColor = 'text-primary-600 bg-white ring-4 ring-primary-50';
          } else {
            Icon = CheckCircle2;
            iconColor = 'text-primary-500 bg-white';
          }

          return (
            <div key={idx} className="relative">
              {/* Timeline bubble */}
              <span className={`absolute -left-[35px] top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-current shrink-0 ${iconColor}`}>
                <Icon className="w-4 h-4" />
              </span>

              {/* Step info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${
                    isLatest ? 'text-primary-900 font-black' : 'text-gray-700'
                  }`}>
                    {statusInfo.label}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {stepDate.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })} &bull; {stepDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                  {statusInfo.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
