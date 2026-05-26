import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite Modal State
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'staff',
    permissions: {
      manageOrders: false,
      verifyPrescriptions: true,
      manageInventory: true,
      viewReports: false,
      manageProducts: false
    }
  });

  // Edit Permissions Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editPermissions, setEditPermissions] = useState({});

  const [actionLoading, setActionLoading] = useState(false);

  const fetchStaffList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/staff');
      if (res.data && res.data.success) {
        setStaff(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve staff and administrator accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  const handleInviteChange = (field, val) => {
    setInviteData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleInvitePermissionChange = (perm) => {
    setInviteData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [perm]: !prev.permissions[perm]
      }
    }));
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteData.name || !inviteData.email || !inviteData.role) {
      toast.error('Name, email, and role are required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post('/api/staff/invite', inviteData);
      if (res.data && res.data.success) {
        toast.success(`Invitation sent successfully to ${inviteData.email}.`);
        setInviteOpen(false);
        setInviteData({
          name: '',
          email: '',
          role: 'staff',
          permissions: {
            manageOrders: false,
            verifyPrescriptions: true,
            manageInventory: true,
            viewReports: false,
            manageProducts: false
          }
        });
        fetchStaffList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const actionText = user.isActive ? 'DEACTIVATE' : 'ACTIVATE';
    if (!window.confirm(`Are you sure you want to ${actionText} the staff account for "${user.name}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.put(`/api/staff/${user._id}/toggle-status`);
      if (res.data && res.data.success) {
        toast.success(res.data.message);
        fetchStaffList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action status toggle failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (user) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE the staff account for "${user.name}"? This action is irreversible.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.delete(`/api/staff/${user._id}`);
      if (res.data && res.data.success) {
        toast.success('Account deleted successfully.');
        fetchStaffList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPermissionsOpen = (user) => {
    setEditingUser(user);
    setEditPermissions(user.permissions || {});
    setEditOpen(true);
  };

  const handleEditPermissionChange = (perm) => {
    setEditPermissions(prev => ({
      ...prev,
      [perm]: !prev[perm]
    }));
  };

  const handleEditPermissionsSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.put(`/api/staff/${editingUser._id}/permissions`, {
        permissions: editPermissions
      });
      if (res.data && res.data.success) {
        toast.success('Account permissions updated successfully.');
        setEditOpen(false);
        setEditingUser(null);
        fetchStaffList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Permissions update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6 font-sans">
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-teal-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-700" /> Staff & Account Governance
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
            Configure permission keys, invite dispatch temporary passcodes, and monitor operational clearances.
          </p>
        </div>

        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-1.5 text-xs py-2.5 px-4 font-extrabold rounded-lg bg-teal-650 hover:bg-teal-700 text-white transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" /> Invite New Staff Member
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-2 text-xs text-red-800 font-medium">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* ── Grid/Table of Accounts ───────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
            Compiling staff accounts ledger...
          </div>
        ) : staff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-500 border-collapse">
              <thead>
                <tr className="bg-slate-50 font-bold uppercase tracking-wider text-teal-900 border-b border-gray-200">
                  <th className="px-4 py-4">Operator Info</th>
                  <th className="px-4 py-4">Role Clearance</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Permission Cleared Keys</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((s) => (
                  <tr key={s._id} className={`transition-colors ${!s.isActive ? 'bg-gray-50/70 opacity-60' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-gray-800 text-sm">{s.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{s.email}</span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        s.role === 'admin' 
                          ? 'bg-red-50 text-red-700 border-red-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {s.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {s.isActive ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                            <ShieldCheck className="w-4 h-4 text-green-500" /> Active Clear
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                            <ShieldAlert className="w-4 h-4 text-red-300" /> Deactivated
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(s.permissions || {}).map(([key, val]) => (
                          val && (
                            <span key={key} className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-150 uppercase tracking-wide">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </span>
                          )
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditPermissionsOpen(s)}
                          disabled={actionLoading}
                          className="btn-white text-[10px] font-bold py-1 px-2.5 flex items-center gap-1"
                        >
                          <Shield className="w-3.5 h-3.5" /> Edit Clearances
                        </button>
                        
                        <button
                          onClick={() => handleToggleStatus(s)}
                          disabled={actionLoading}
                          title={s.isActive ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 border rounded-lg transition-colors ${
                            s.isActive 
                              ? 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200' 
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {s.isActive ? <ToggleRight className="w-4.5 h-4.5" /> : <ToggleLeft className="w-4.5 h-4.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteStaff(s)}
                          disabled={actionLoading}
                          className="p-1.5 border border-gray-200 text-gray-400 hover:text-red-650 hover:border-red-200 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-gray-400 italic">
            No active staff or administrator profiles found.
          </div>
        )}
      </div>

      {/* ── INVITE MODAL ─────────────────────────────────────────────────── */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleInviteSubmit} className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md animate-fadeIn space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-150 pb-2.5">
              <h3 className="text-sm font-extrabold text-teal-900 uppercase tracking-widest flex items-center gap-1.5">
                <UserPlus className="w-4.5 h-4.5 text-teal-600" /> Invite Staff Member
              </h3>
              <button type="button" onClick={() => setInviteOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs leading-normal">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pankaj Lamba"
                  value={inviteData.name}
                  onChange={(e) => handleInviteChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@pankajmedical.com"
                  value={inviteData.email}
                  onChange={(e) => handleInviteChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role Clearance *</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => handleInviteChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                >
                  <option value="staff">Staff (Limited Clearance)</option>
                  <option value="admin">Administrator (Full Clearance)</option>
                </select>
              </div>

              {/* Checkbox Permissions grid */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 space-y-2.5">
                <span className="block text-[10px] font-extrabold text-teal-800 uppercase tracking-widest border-b border-gray-200 pb-1">
                  Access Permissions Configuration
                </span>
                
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {Object.entries(inviteData.permissions).map(([perm, checked]) => (
                    <label key={perm} className="flex items-center gap-2.5 cursor-pointer select-none">
                      <button
                        type="button"
                        onClick={() => handleInvitePermissionChange(perm)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                        {perm.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="btn-white text-xs py-2 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn-teal text-xs py-2 px-5 font-bold shadow-xs flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Dispatch Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── EDIT CLEARANCES MODAL ────────────────────────────────────────── */}
      {editOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditPermissionsSubmit} className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-md animate-fadeIn space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-150 pb-2.5">
              <h3 className="text-sm font-extrabold text-teal-900 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-4.5 h-4.5 text-teal-600" /> Edit Permissions: {editingUser.name}
              </h3>
              <button type="button" onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3">
                <span className="block text-[10px] font-extrabold text-teal-800 uppercase tracking-widest border-b border-gray-200 pb-1">
                  Active Access Clearances
                </span>
                
                <div className="grid grid-cols-1 gap-3 pt-1">
                  {Object.entries(editPermissions).map(([perm, checked]) => (
                    <label key={perm} className="flex items-center gap-2.5 cursor-pointer select-none">
                      <button
                        type="button"
                        onClick={() => handleEditPermissionChange(perm)}
                        className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          checked ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        {perm.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="btn-white text-xs py-2 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn-teal text-xs py-2 px-5 font-bold shadow-xs flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Clearances'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
