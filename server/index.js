const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables (local overrides in .env take precedence)
dotenv.config();
const isProd = process.env.NODE_ENV === 'production';
const envFile = isProd ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });


const app = express();

// Establish Mongoose Database Connection
connectDB();

// Security and Utility Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// Fallback Route for Undefined Paths
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Requested API endpoint does not exist.',
    code: 'NOT_FOUND'
  });
});

// Centralized Error-handling Middleware
app.use((err, req, res, next) => {
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
