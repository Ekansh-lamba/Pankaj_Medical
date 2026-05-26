const cron = require('node-cron');
const Product = require('../models/Product');
const Order = require('../models/Order');
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

    console.log(
      `[Cron Job] Swept expired items. Automatically hid ${hideResult.modifiedCount} products.`
    );

    // 2. Sweeps and gathers low stock items
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      isActive: true
    }).select('name brand stock lowStockThreshold rackLocation');

    if (lowStockProducts.length > 0) {
      console.log(
        `[Cron Job] Detected ${lowStockProducts.length} low-stock products. Dispatching alert...`
      );

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

/**
 * Hourly cron sweeping and auto-cancelling stale orders pending approval for 48+ hours
 */
const runHourlyPrescriptionAutoCancel = async () => {
  try {
    console.log('[Cron Job] Checking for stale prescription orders (48h cutoff)...');
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const staleOrders = await Order.find({
      status: 'pending_approval',
      createdAt: { $lt: cutoff }
    });

    if (staleOrders.length > 0) {
      console.log(
        `[Cron Job] Found ${staleOrders.length} stale pending approval orders. Auto-cancelling...`
      );
      for (const order of staleOrders) {
        order.status = 'cancelled';
        order.cancellationReason = 'Prescription verification expired (48-hour auto-cancellation)';
        order.timeline.push({
          status: 'cancelled',
          timestamp: new Date(),
          updatedBy: null // system auto-cancellation
        });

        order.payment.status = 'failed';
        await order.save();

        // Restore reserved stock levels atomically
        for (const item of order.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
        }

        console.log(`[Cron Job] Auto-cancelled stale order: ${order.orderNumber}`);
      }
    }
  } catch (err) {
    console.error('[Cron Job] Stale prescription auto-cancellation sweep failed:', err.message);
  }
};

// Start all cron schedulers
const startCron = () => {
  // Daily cron job running at 00:00 IST (18:30 UTC)
  cron.schedule('30 18 * * *', runExpiryAndStockCheck);

  // Hourly cron job running at the beginning of each hour
  cron.schedule('0 * * * *', runHourlyPrescriptionAutoCancel);

  console.log(
    '[Cron Job] Automated schedulers successfully initialized (Daily Expiry Sweeps & Hourly Stale Prescriptions Lock-releases).'
  );
};

module.exports = { startCron, runExpiryAndStockCheck, runHourlyPrescriptionAutoCancel };
