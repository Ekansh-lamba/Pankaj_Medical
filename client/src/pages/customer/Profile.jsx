import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Trash2,
  Plus,
  Check,
  ShieldAlert,
  Save
} from 'lucide-react';


const Profile = () => {
  const { user, softDeleteUserAccount, isLoading: authLoading } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Profile forms
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password change forms
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Address forms
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('Kanpur');
  const [state, setState] = useState('Uttar Pradesh');
  const [pinCode, setPinCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressStatus, setAddressStatus] = useState(null); // { type: 'success'|'error', msg }

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users/profile');
      if (res.data && res.data.success) {
        const u = res.data.data;
        setProfile(u);
        setName(u.name || '');
        setPhone(u.phone || '');
      }
    } catch (err) {
      console.error('Fetch profile failed:', err);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setUpdating(true);
    try {
      const res = await api.put('/api/users/profile', { name, phone });
      if (res.data && res.data.success) {
        setProfile(res.data.data);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    console.log('[addAddress] form submitted', { label, line1, line2, city, state, pinCode, isDefault });
    setAddressStatus({ type: 'info', msg: 'Validating...' });

    if (!line1.trim() || !city.trim() || !state.trim() || !pinCode.trim()) {
      toast.error('Please fill in all required address fields');
      setAddressStatus({ type: 'error', msg: 'Missing required fields: line1, city, state or pinCode is empty.' });
      console.warn('[addAddress] validation failed - empty required field');
      return;
    }

    setAddressLoading(true);
    setAddressStatus({ type: 'info', msg: 'Sending request to server...' });
    try {
      console.log('[addAddress] sending POST /api/users/addresses...');
      const res = await api.post('/api/users/addresses', {
        label,
        line1,
        line2,
        city,
        state,
        pinCode,
        isDefault
      });

      console.log('[addAddress] response:', res.status, res.data);

      if (res.data && res.data.success) {
        setProfile(prev => ({ ...prev, addresses: res.data.data }));
        setAddressStatus({ type: 'success', msg: `Saved! You now have ${res.data.data.length} address(es).` });
        toast.success('Address added successfully');
        // Reset form
        setLine1('');
        setLine2('');
        setPinCode('');
        setIsDefault(false);
        setShowAddressForm(false);
      } else {
        const msg = res.data?.message || 'Server returned unexpected response';
        setAddressStatus({ type: 'error', msg: `Server said: ${msg}` });
        console.error('[addAddress] unexpected response (success=false):', res.data);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add address';
      setAddressStatus({ type: 'error', msg: `Error ${err.response?.status || 'network'}: ${msg}` });
      console.error('[addAddress] catch error:', err.response?.status, err.response?.data, err.message);
      toast.error(msg);
    } finally {
      setAddressLoading(false);
    }
  };


  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const res = await api.delete(`/api/users/addresses/${id}`);
      if (res.data && res.data.success) {
        setProfile({ ...profile, addresses: res.data.data });
        toast.success('Address deleted successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.post('/api/users/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data && res.data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await softDeleteUserAccount();
      toast.success('Your account was successfully deleted.');
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-2" />
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 bg-gray-50 font-sans">
      <h1 className="text-xl md:text-2xl font-black text-primary-900 mb-8 flex items-center gap-2">
        <User className="w-6 h-6 text-primary-800" /> My Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Info details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Card */}
          <div className="card-base p-6 shadow-xs">
            <h3 className="text-xs font-black text-primary-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Personal Information
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2.5 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                    Email Address (Read-only)
                  </label>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 p-2.5 rounded-lg cursor-not-allowed">
                    <Mail className="w-4 h-4 text-gray-300" />
                    <span>{profile?.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-800 border border-gray-250 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {updating ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Address Book Card */}
          <div className="card-base p-6 shadow-xs">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="text-xs font-black text-primary-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Saved Delivery Addresses
              </h3>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="btn-secondary text-[11px] font-bold py-1 px-3 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              )}
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <h4 className="text-[11px] font-black text-gray-700 uppercase tracking-wider">
                    New Address Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                {addressStatus && (
                  <div className={`p-3 rounded-lg text-xs font-semibold ${
                    addressStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    addressStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-primary-50 text-primary-800 border border-primary-200'
                  }`}>
                    {addressStatus.msg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                      Address Label
                    </label>
                    <select
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                      Pincode (serviceable inside Kanpur)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 208001"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2 rounded-lg focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="House/Flat No., Building Name, Street"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2 rounded-lg focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Locality, Landmark"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 border-gray-300"
                  />
                  <label htmlFor="isDefault" className="text-xs text-gray-600 font-bold">
                    Set as default delivery address
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="btn-white text-[11px] py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addressLoading}
                    className="btn-primary text-[11px] py-2 px-4"
                  >
                    {addressLoading ? 'Saving...' : 'Add Address'}
                  </button>
                </div>
              </form>
            )}

            {/* Address List */}
            {profile?.addresses && profile.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`p-4 border rounded-xl relative ${
                      addr.isDefault
                        ? 'border-primary-400 bg-primary-50/20'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-primary-800 uppercase bg-primary-100/50 px-2 py-0.5 rounded">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-black text-green-700 uppercase bg-green-150 px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 leading-normal">
                      {addr.line1}
                    </p>
                    {addr.line2 && (
                      <p className="text-xs font-semibold text-gray-500 leading-normal">
                        {addr.line2}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-gray-600 mt-1">
                      {addr.city}, {addr.state} - {addr.pinCode}
                    </p>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteAddress(addr._id)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-250 rounded-xl">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-bold">No saved addresses found</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Add an address to speed up checkout delivery</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Password change and danger actions */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Change Password Card */}
          <div className="card-base p-6 shadow-xs">
            <h3 className="text-xs font-black text-primary-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2.5 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2.5 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-800 border border-gray-250 p-2.5 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Repeat new password"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full btn-primary py-2.5 font-bold text-xs rounded-lg"
              >
                {passwordLoading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-white border border-red-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-black text-red-800 uppercase tracking-wider mb-4 pb-2 border-b border-red-100 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" /> Danger Zone
            </h3>

            <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mb-4">
              Deleting your account is permanent. All address information and PII details will be fully anonymized.
            </p>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Delete Account Permanently
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-base max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Confirm Account Deletion</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Are you sure you want to proceed? Your email, phone, name, and address data will be
              anonymized. This action is permanent and cannot be reversed.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-white text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={authLoading}
                className="btn-primary bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3 text-white"
              >
                {authLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
