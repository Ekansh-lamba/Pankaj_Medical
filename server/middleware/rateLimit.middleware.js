const rateLimit = require('express-rate-limit');

// Strict limiter for auth routes — prevents brute-force login attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    code: 'TOO_MANY_REQUESTS'
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

// General API limiter — prevents DDoS and scraping (100 requests/15 min per IP)
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Allow 200 requests per IP per 15-min window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
    code: 'TOO_MANY_REQUESTS'
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health checks and sitemap (monitoring + SEO crawlers)
    return req.path === '/health' || req.path === '/sitemap.xml' || req.path === '/robots.txt';
  }
});

module.exports = { authRateLimiter, apiRateLimiter };
