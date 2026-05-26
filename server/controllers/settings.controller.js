const Settings = require('../models/Settings');

// Helper to get or create settings singleton
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      deliveryCharge: 50,
      freeDeliveryThreshold: 500,
      minimumOrderValue: 200,
      serviceablePinCodes: [
        '208011',
        '208001',
        '208002',
        '208003',
        '208004',
        '208005',
        '208006',
        '208007',
        '208008',
        '208009',
        '208010',
        '208012',
        '208013',
        '208014',
        '208015',
        '208016',
        '208017',
        '208018',
        '208019',
        '208020',
        '208021',
        '208022',
        '208023',
        '208024',
        '208025',
        '208026',
        '208027'
      ], // default Kanpur pincodes
      workingHours: { open: '09:00', close: '22:00' },
      estimatedDeliveryHours: 24,
      pharmacyPhone: '+91 99999 99999',
      pharmacyEmail: 'contact@pankajmedical.com',
      maintenanceMode: false
    });
  }
  return settings;
};

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({
      success: true,
      data: {
        deliveryCharge: settings.deliveryCharge,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        minimumOrderValue: settings.minimumOrderValue,
        serviceablePinCodes: settings.serviceablePinCodes,
        estimatedDeliveryHours: settings.estimatedDeliveryHours,
        workingHours: settings.workingHours,
        pharmacyPhone: settings.pharmacyPhone,
        pharmacyEmail: settings.pharmacyEmail,
        maintenanceMode: settings.maintenanceMode
      }
    });
  } catch (err) {
    console.error('Get public settings error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (err) {
    console.error('Get admin settings error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateAdminSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    // Update fields
    const allowedFields = [
      'deliveryCharge',
      'freeDeliveryThreshold',
      'minimumOrderValue',
      'serviceablePinCodes',
      'workingHours',
      'estimatedDeliveryHours',
      'pharmacyPhone',
      'pharmacyEmail',
      'maintenanceMode'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    return res
      .status(200)
      .json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (err) {
    console.error('Update admin settings error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
