const Settings = require('../models/Settings');

const maintenanceMiddleware = async (req, res, next) => {
  try {
    // Exclude health check
    if (req.path === '/health') {
      return next();
    }

    // Exclude auth, admin, and staff routes
    const isExcluded = 
      req.path.startsWith('/api/auth') || 
      req.path.startsWith('/api/admin') || 
      req.path.startsWith('/api/staff') ||
      req.path.startsWith('/api/settings/admin'); // allow admin to fetch/update settings to turn it off!

    if (isExcluded) {
      return next();
    }

    const settings = await Settings.findOne();
    if (settings && settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: 'The pharmacy store is currently undergoing maintenance. Please try again later or contact us directly.',
        code: 'MAINTENANCE_MODE',
        pharmacyPhone: settings.pharmacyPhone,
        pharmacyEmail: settings.pharmacyEmail
      });
    }

    next();
  } catch (err) {
    console.error('Maintenance middleware error:', err);
    next(); // don't block the site if database check fails catastrophically
  }
};

module.exports = maintenanceMiddleware;
