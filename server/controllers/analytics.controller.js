const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { Parser } = require('json2csv');

/**
 * GET /api/admin/analytics/summary
 */
exports.getSummary = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Aggregate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Count pending prescriptions
    const pendingPrescriptions = await Order.countDocuments({ status: 'pending_approval' });

    return res.json({
      success: true,
      data: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalRevenue,
        pendingPrescriptions
      }
    });
  } catch (error) {
    console.error('Analytics summary failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve summary metrics.' });
  }
};

/**
 * GET /api/admin/analytics/revenue
 */
exports.getRevenueChart = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          'payment.status': 'paid',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days with 0 revenue
    const chartData = [];
    const dateMap = new Map(dailyRevenue.map(item => [item._id, item]));

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      if (dateMap.has(dateStr)) {
        chartData.push({
          date: dateStr,
          revenue: dateMap.get(dateStr).revenue,
          orders: dateMap.get(dateStr).orders
        });
      } else {
        chartData.push({
          date: dateStr,
          revenue: 0,
          orders: 0
        });
      }
    }

    return res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Analytics revenue chart failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve revenue chart data.' });
  }
};

/**
 * GET /api/admin/analytics/categories
 */
exports.getCategoryShare = async (req, res) => {
  try {
    const categoryShare = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          value: { $sum: 1 }
        }
      },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);

    return res.json({ success: true, data: categoryShare });
  } catch (error) {
    console.error('Analytics categories failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve category sharing.' });
  }
};

/**
 * GET /api/admin/analytics/top-products
 */
exports.getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          brand: { $first: '$items.brand' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.sellingPrice', '$items.quantity'] } }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 }
    ]);

    return res.json({ success: true, data: topProducts });
  } catch (error) {
    console.error('Analytics top products failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve top products.' });
  }
};

/**
 * GET /api/admin/analytics/export-csv
 */
exports.exportCSVReport = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('customer', 'name email phone');

    const fields = [
      { label: 'Order Number', value: 'orderNumber' },
      { label: 'Customer Name', value: 'customer.name' },
      { label: 'Customer Email', value: 'customer.email' },
      { label: 'Customer Phone', value: 'customer.phone' },
      { label: 'Subtotal (INR)', value: 'subtotal' },
      { label: 'Discount (INR)', value: 'discount' },
      { label: 'GST Total (INR)', value: 'gstTotal' },
      { label: 'Grand Total (INR)', value: 'grandTotal' },
      { label: 'Order Status', value: 'status' },
      { label: 'Payment Method', value: 'payment.method' },
      { label: 'Payment Status', value: 'payment.status' },
      { label: 'Placed Date', value: (row) => new Date(row.createdAt).toLocaleString('en-IN') }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(orders);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Analytics export CSV failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate CSV sales report.' });
  }
};
