require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;

  // Check if settings already exists
  const existing = await db.collection('settings').findOne({});

  if (existing) {
    // Update existing settings
    await db.collection('settings').updateOne(
      {},
      {
        $set: {
          deliveryCharge: 50,
          freeDeliveryThreshold: 500,
          minimumOrderValue: 200,
          serviceablePinCodes: [
            '208001', '208002', '208003', '208004', '208005',
            '208006', '208007', '208008', '208009', '208010',
            '208011', '208012', '208013', '208014', '208015',
            '208016', '208017', '208018', '208019', '208020',
            '208021', '208022', '208023', '208024', '208025',
            '208026', '208027'
          ],
          workingHours: { open: '09:00', close: '22:00' },
          estimatedDeliveryHours: 24,
          pharmacyPhone: '9999999999',
          pharmacyEmail: 'admin@pankajmedical.com',
          maintenanceMode: false
        }
      }
    );
    console.log('Settings updated successfully');
  } else {
    // Insert new settings
    await db.collection('settings').insertOne({
      deliveryCharge: 50,
      freeDeliveryThreshold: 500,
      minimumOrderValue: 200,
      serviceablePinCodes: [
        '208001', '208002', '208003', '208004', '208005',
        '208006', '208007', '208008', '208009', '208010',
        '208011', '208012', '208013', '208014', '208015',
        '208016', '208017', '208018', '208019', '208020',
        '208021', '208022', '208023', '208024', '208025',
        '208026', '208027'
      ],
      workingHours: { open: '09:00', close: '22:00' },
      estimatedDeliveryHours: 24,
      pharmacyPhone: '9999999999',
      pharmacyEmail: 'admin@pankajmedical.com',
      maintenanceMode: false
    });
    console.log('Settings created successfully');
  }

  // Confirm what was saved
  const saved = await db.collection('settings').findOne({});
  console.log('Pin codes saved:', saved.serviceablePinCodes.length, 'pin codes');
  console.log('Delivery charge: ₹', saved.deliveryCharge);
  console.log('Free delivery above: ₹', saved.freeDeliveryThreshold);
  console.log('Min order value: ₹', saved.minimumOrderValue);

  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});