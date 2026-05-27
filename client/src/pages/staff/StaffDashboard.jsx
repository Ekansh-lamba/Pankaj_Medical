import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, ClipboardCheck, Package, AlertCircle } from 'lucide-react';


const StaffDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">

        {/* Welcome Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Welcome back, {user?.name || 'Staff Member'}!
              </h2>
              <p className="text-sm text-gray-500">Authorized Pharmacy Staff Member</p>
            </div>
          </div>
        </div>

        {/* Dynamic Permissions Grid */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Your Active Permissions</h3>
            <p className="text-sm text-gray-500">
              Assigned by the pharmacy administrator in MongoDB. These toggle your page access
              scopes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Permission item 1 */}
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                user?.permissions?.manageOrders
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <ClipboardCheck
                className={`w-5 h-5 shrink-0 mt-0.5 ${user?.permissions?.manageOrders ? 'text-blue-600' : 'text-gray-400'}`}
              />
              <div>
                <h4 className="font-bold text-sm">Manage Customer Orders</h4>
                <p className="text-xs mt-0.5 leading-normal">
                  Allows accessing order queues, printing packaging slips, and marking COD payments
                  collected.
                </p>
                <span className="text-[10px] font-bold uppercase mt-2 inline-block px-2 py-0.5 rounded bg-white border border-gray-300">
                  {user?.permissions?.manageOrders ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Permission item 2 */}
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                user?.permissions?.verifyPrescriptions
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <ShieldCheck
                className={`w-5 h-5 shrink-0 mt-0.5 ${user?.permissions?.verifyPrescriptions ? 'text-blue-600' : 'text-gray-400'}`}
              />
              <div>
                <h4 className="font-bold text-sm">Verify Prescriptions</h4>
                <p className="text-xs mt-0.5 leading-normal">
                  Allows reviewing uploaded patient prescriptions for Schedule H & NRX medicines to
                  approve or reject them.
                </p>
                <span className="text-[10px] font-bold uppercase mt-2 inline-block px-2 py-0.5 rounded bg-white border border-gray-300">
                  {user?.permissions?.verifyPrescriptions ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Permission item 3 */}
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                user?.permissions?.manageInventory
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <Package
                className={`w-5 h-5 shrink-0 mt-0.5 ${user?.permissions?.manageInventory ? 'text-blue-600' : 'text-gray-400'}`}
              />
              <div>
                <h4 className="font-bold text-sm">Manage Stock & Expiry</h4>
                <p className="text-xs mt-0.5 leading-normal">
                  Allows view inventory layouts, increment/decrement stocks, and flag near-expiry
                  tablets in near real-time.
                </p>
                <span className="text-[10px] font-bold uppercase mt-2 inline-block px-2 py-0.5 rounded bg-white border border-gray-300">
                  {user?.permissions?.manageInventory ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Permission item 4 */}
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                user?.permissions?.viewReports
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 shrink-0 mt-0.5 ${user?.permissions?.viewReports ? 'text-blue-600' : 'text-gray-400'}`}
              />
              <div>
                <h4 className="font-bold text-sm">View Analytics Reports</h4>
                <p className="text-xs mt-0.5 leading-normal">
                  Read-only permissions to inspect store summaries, acquisition details, and tax
                  report breakdowns.
                </p>
                <span className="text-[10px] font-bold uppercase mt-2 inline-block px-2 py-0.5 rounded bg-white border border-gray-300">
                  {user?.permissions?.viewReports ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default StaffDashboard;
