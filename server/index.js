const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { startCron } = require('./jobs/expiryChecker');
const maintenanceMiddleware = require('./middleware/maintenance.middleware');
const { apiRateLimiter } = require('./middleware/rateLimit.middleware');

// Load environment variables
// On Render/production: env vars come from the dashboard — do NOT try to load .env files
// In development: load from .env then .env.development for local overrides
dotenv.config(); // always load root .env first (no-op on Render where the file doesn't exist)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.development' });
}

const app = express();
app.set('trust proxy', 1);

// Establish Mongoose Database Connection
connectDB();
startCron();

// Security and Utility Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(maintenanceMiddleware);

// CORS configuration (enforce Whitelisting)
const allowedOrigins = ['http://localhost:5173', process.env.CLIENT_URL].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow browser-less requests (like mobile or direct test tools)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

// Global API rate limiter — applied to all /api/* routes
app.use('/api/', apiRateLimiter);

// Health check endpoint (Returns ok status and timestamp for UptimeRobot monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date()
  });
});

// Mounting Routing Modules
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

// SEO: Dynamic sitemap.xml — lists all active product pages
app.get('/sitemap.xml', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const BASE_URL = process.env.CLIENT_URL || 'https://pankajmedical.in';
    const products = await Product.find({ isActive: true, isHidden: false }, 'slug updatedAt').lean();

    const staticUrls = [
      { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'weekly' },
      { loc: `${BASE_URL}/products`, priority: '0.9', changefreq: 'daily' },
      { loc: `${BASE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${BASE_URL}/contact`, priority: '0.5', changefreq: 'monthly' }
    ];

    const productUrls = products
      .filter((p) => p.slug)
      .map((p) => ({
        loc: `${BASE_URL}/products/${p.slug}`,
        lastmod: p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : '',
        priority: '0.7',
        changefreq: 'weekly'
      }));

    const allUrls = [...staticUrls, ...productUrls];
    const urlXml = allUrls
      .map((u) =>
        `  <url>\n    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlXml}\n</urlset>`;

    res.set('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    return res.status(500).send('Failed to generate sitemap.');
  }
});


// Fallback Route for Undefined Paths
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Requested API endpoint does not exist.',
    code: 'NOT_FOUND'
  });
});

// Centralized Error-handling Middleware
app.use((err, req, res, _next) => {
  console.error('Centralized Server Error handler caught:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
});

// Start listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server successfully started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});
