const cron = require('node-cron');
const Product = require('../models/Product');
const { sendLowStockAlert } = require('../services/email.service');

/**
 * Sweeps stock items for date boundaries and quantity thresholds
 */
const runExpiryAndStockCheck = async () => {
  try {
    console.log('[Cron Job] Executing Daily Expiry and Inventory Checks...');

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Sweeps and hides products expired or within 30 days of expiry
    const hideResult = await Product.updateMany(
      {
        expiryDate: { $lte: thirtyDaysFromNow },
        isHidden: false,
        isActive: true
      },
      { $set: { isHidden: true } }
    );

    console.log(`[Cron Job] Swept expired items. Automatically hid ${hideResult.modifiedCount} products.`);

    // 2. Sweeps and gathers low stock items
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      isActive: true
    }).select('name brand stock lowStockThreshold rackLocation');

    if (lowStockProducts.length > 0) {
      console.log(`[Cron Job] Detected ${lowStockProducts.length} low-stock products. Dispatching alert...`);
      
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@pankajmedical.com';
      
      try {
        await sendLowStockAlert(adminEmail, lowStockProducts);
        console.log('[Cron Job] Low stock warning email dispatched successfully.');
      } catch (mailErr) {
        console.error('[Cron Job] Low stock alert mail dispatch failed:', mailErr.message);
      }
    } else {
      console.log('[Cron Job] All stock levels are above warning thresholds.');
    }
  } catch (err) {
    console.error('[Cron Job] Critical execution error:', err.message);
  }
};

// Daily cron job running at 00:00 IST (18:30 UTC)
const startCron = () => {
  cron.schedule('30 18 * * *', runExpiryAndStockCheck);
  console.log('[Cron Job] Automated expiry scheduler initialized (Sweeps daily at 00:00 IST / 18:30 UTC).');
};

module.exports = { startCron, runExpiryAndStockCheck };
