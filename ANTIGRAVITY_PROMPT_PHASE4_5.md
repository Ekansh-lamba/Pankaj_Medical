# Antigravity Prompt — Phase 4 + 5: Payments, Notifications, Analytics & Go-Live
# Pankaj Medical and General Stores

---

## STEP 1 — Git Safety Check (Mandatory Before Any Code)

Run both commands in PowerShell from `D:\PANKAJ MEDICAL AND GENRAL STORES`:

```powershell
git ls-files | Select-String -Pattern "ANTIGRAVITY|PANKAJ_MEDICAL|ANTHROPIC_PROMPT|recovery|spec|prompt"
git ls-files | Select-String ".env"
```

Both must return **empty output** before writing any code. If anything appears untrack it first.

Also run lint before starting:
```powershell
npm run lint
```
Must return 0 errors before proceeding.

---

## Project Context

**Store:** PANKAJ MEDICAL AND GENERAL STORES
**Address:** 133/17 M Block, Kidwainagar, Kanpur Nagar
**GSTIN:** 09ACPPL2448G1ZB
**Repo:** https://github.com/Ekansh-lamba/Pankaj_Medical
**Stack:** React 18 + Vite + Tailwind CSS v3 + Node.js + Express + MongoDB Atlas + Zustand + Axios
**Language:** JavaScript only — no TypeScript

---

## Phases 1, 2 & 3 — Already Complete

Do not rebuild anything from previous phases. What is verified and working:

- Full auth — email/password, Google OAuth, phone OTP, JWT dual-token
- Product catalogue — listing, search, filters, expiry management, CSV import
- Purchase Order Excel import — billing software format with grouped rows
- Cart — guest + logged-in dual mode, sync on login
- Checkout — 4 steps, address, prescription upload, COD
- Orders — placement, stock reservation, status transitions, cancellation
- H/NRX prescription approval — staff review, approve/reject/reupload
- Notifications — bell with 60s polling, in-app notifications
- Staff dashboards — order queue, prescription review
- Admin dashboards — products, expiry, CSV import, order management
- MongoDB indexes created
- Cloudinary — prescription images in private authenticated folder
- Settings — delivery charges, pin codes, working hours seeded

---

## What Phase 4 + 5 Builds

**Phase 4:** Razorpay payments, coupons, automatic offers, SMS notifications, WhatsApp (basic), refunds
**Phase 5:** Admin analytics dashboard, GST invoice PDF, SEO, PWA finalization, bulk product activation, staff management, store settings UI, maintenance mode, go-live hardening

---

## PART A — Phase 4: Payments, Offers & Notifications

---

### A1. Razorpay Integration

**Install:**
```bash
cd server && npm install razorpay
```

**Environment variables to add to server/.env:**
```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id  (add to client/.env.development too)
```

**Create `server/services/razorpay.service.js`:**
```js
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
async function createRazorpayOrder(amount, currency = 'INR', receipt) {
  return await razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency,
    receipt,
    payment_capture: 1
  });
}

// Verify payment signature
function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .toString('hex');
  return expectedSignature === signature;
}

// Initiate refund
async function initiateRefund(paymentId, amount) {
  return await razorpay.payments.refund(paymentId, {
    amount: Math.round(amount * 100)
  });
}

module.exports = { createRazorpayOrder, verifyPaymentSignature, initiateRefund };
```

**Payment routes — add to `server/routes/payment.routes.js`:**
```
POST /api/payments/create-order     Customer — create Razorpay order
POST /api/payments/verify           Customer — verify payment signature
POST /api/payments/webhook          Public — Razorpay webhook (no auth)
POST /api/payments/retry/:orderId   Customer — retry failed payment
POST /api/payments/refund/:orderId  Admin — initiate refund
```

**Payment flow:**

1. Customer clicks "Pay Online" at checkout
2. Frontend calls `POST /api/payments/create-order` with grandTotal
3. Backend creates Razorpay order, returns `razorpayOrderId` and `amount`
4. Frontend opens Razorpay checkout modal with the order ID
5. Customer completes payment on Razorpay modal
6. Razorpay returns `paymentId` and `signature` to frontend
7. Frontend calls `POST /api/payments/verify` with all three IDs
8. Backend verifies signature — if valid, update order payment status to `paid`
9. OTC/H1 orders → status `confirmed` immediately
10. H/NRX orders → status `pending_approval` (wait for prescription review)

**Webhook handler (`POST /api/payments/webhook`):**
```js
// Verify webhook signature using Razorpay-Signature header
// Handle these events:
// payment.captured → mark order paid, confirm OTC/H1 orders
// payment.failed → mark order payment_failed, restore stock after 30min
// refund.processed → mark order refund complete
```

**Payment failure handling:**
- Save order with status `payment_failed`
- Schedule stock release after 30 minutes using setTimeout
- Customer can retry payment within 30 minutes via `POST /api/payments/retry/:orderId`
- After 30 minutes auto-cancel and restore stock

**Frontend changes:**
- Remove "Coming Soon" from Pay Online button in `Checkout.jsx`
- Load Razorpay checkout script: `https://checkout.razorpay.com/v1/checkout.js`
- Open Razorpay modal with correct options:

```js
const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  amount: razorpayOrder.amount,
  currency: 'INR',
  name: 'Pankaj Medical and General Stores',
  description: `Order ${order.orderNumber}`,
  order_id: razorpayOrder.id,
  handler: async (response) => {
    // Call verify endpoint
    await api.post('/payments/verify', {
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
      orderId: order._id
    });
    // Navigate to order confirmation
  },
  prefill: {
    name: user.name,
    email: user.email,
    contact: user.phone
  },
  theme: { color: '#0d9488' } // teal
};
const rzp = new window.Razorpay(options);
rzp.open();
```

---

### A2. Refund Flow

**Admin-triggered refund (`POST /api/payments/refund/:orderId`):**
- Requires admin role
- Requires current admin password confirmation in request body
- Call Razorpay refund API
- Update order: `payment.status: 'refunded'`, `payment.refundedAt`, `payment.refundAmount`
- Send email to customer: "Your refund of ₹X has been initiated"
- Log to AuditLog

**Auto-refund triggers (existing logic — just wire Razorpay now):**
- Prescription rejection → auto-refund via Razorpay
- 48-hour prescription timeout → auto-refund
- Customer cancellation after payment → auto-refund

---

### A3. Coupon System

**Expand `server/models/Coupon.js`** (placeholder already exists):

```js
{
  code: { type: String, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'flat', 'free_delivery'] },
  value: Number,                    // percentage or flat amount
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: Number,              // cap for percentage coupons
  totalUsageLimit: Number,          // max total uses
  perCustomerLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: ObjectId, ref: 'User' }],
  expiryDate: Date,
  isActive: { type: Boolean, default: true },
  createdBy: { type: ObjectId, ref: 'User' }
}
```

**Coupon routes:**
```
POST /api/coupons/validate     Customer — validate coupon at checkout
GET  /api/coupons              Admin — list all coupons
POST /api/coupons              Admin — create coupon
PUT  /api/coupons/:id          Admin — update coupon
DELETE /api/coupons/:id        Admin — deactivate coupon
```

**Coupon validation logic:**
```js
// POST /api/coupons/validate
// Body: { code, orderSubtotal, customerId }
// Check: exists, isActive, not expired, usage limits not exceeded,
//        customer hasn't used it, minOrderValue met
// Return: { valid: true, discountAmount, type, code }
```

**Auto-offer rules (no coupon code required):**
- Store in Settings document: `autoOffers: [{ minOrderValue, discountType, discountValue, label }]`
- Check at checkout and apply automatically
- Example: "10% off on orders above ₹1000"
- Show as "Offer Applied" line item in order summary

**Wire up coupon field in `Checkout.jsx`:**
- Remove "Coming soon" from coupon field
- On apply: call validate endpoint, show discount in order summary
- On place order: send `couponCode` in order creation request
- Update `order.controller.js` to apply coupon discount when placing order

---

### A4. SMS Notifications

**Install:**
```bash
cd server && npm install twilio
```

**Add to server/.env:**
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**Create `server/services/sms.service.js`:**
```js
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMS(to, message) {
  // Skip if credentials not set (dev mode)
  if (!process.env.TWILIO_ACCOUNT_SID ||
      process.env.TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
    console.log(`[SMS DEV] To: ${to} | Message: ${message}`);
    return;
  }
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${to}`
    });
  } catch (err) {
    console.error('SMS failed:', err.message);
    // Never crash the app for SMS failure
  }
}

// SMS templates — keep under 160 chars
const templates = {
  orderPendingApproval: (name, orderNo) =>
    `Hi ${name}, your order #${orderNo} needs prescription approval. We'll notify you soon. -Pankaj Medical`,
  prescriptionApproved: (name, orderNo) =>
    `Hi ${name}, prescription approved! Order #${orderNo} is confirmed. -Pankaj Medical`,
  prescriptionRejected: (name, orderNo) =>
    `Hi ${name}, prescription for order #${orderNo} was rejected. Refund initiated in 24hrs. -Pankaj Medical`,
  orderShipped: (name, orderNo) =>
    `Hi ${name}, order #${orderNo} has been shipped! -Pankaj Medical`,
  pickupReady: (name, orderNo) =>
    `Hi ${name}, order #${orderNo} is ready for pickup at our store. -Pankaj Medical`,
  orderDelivered: (name, orderNo) =>
    `Hi ${name}, order #${orderNo} delivered. Rate your experience: [link]. -Pankaj Medical`
};

module.exports = { sendSMS, templates };
```

**Wire SMS into these existing controller events:**
- Order placed with H/NRX → `templates.orderPendingApproval`
- Prescription approved → `templates.prescriptionApproved`
- Prescription rejected → `templates.prescriptionRejected`
- Order status updated to `shipped` → `templates.orderShipped`
- Order status updated to `delivered` → `templates.orderDelivered`
- In-store pickup ready → `templates.pickupReady`

**If Twilio is not set up yet** — the dev fallback logs to console. SMS is non-blocking — never let SMS failure crash the order flow.

---

### A5. Email Notifications — Complete All Templates

Add these missing email templates to `server/services/email.service.js`:

```
sendOrderConfirmed(customer, order)
sendOrderShipped(customer, order)
sendOrderDelivered(customer, order, invoiceUrl)
sendOrderCancelled(customer, order, refundAmount)
sendReturnReceived(customer, order)
sendRefundProcessed(customer, order, amount)
sendStaffInvite(staffEmail, tempPassword)
sendPrescriptionReuploadRequest(customer, order, reason)
sendDailySummary(adminEmail, stats)  — runs at 9AM daily
```

All templates: flat teal/white HTML, pharmacy name in header, clean mobile-responsive layout.

**Daily summary email cron (9AM IST = 3:30 UTC):**
```js
cron.schedule('30 3 * * *', async () => {
  const stats = {
    todayOrders: await Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    todayRevenue: // sum of grandTotal for today's paid orders
    pendingRx: await Order.countDocuments({ status: 'pending_approval' }),
    lowStockCount: await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    })
  };
  await sendDailySummary(process.env.ADMIN_EMAIL, stats);
});
```

---

## PART B — Phase 5: Analytics, Go-Live & Admin Tools

---

### B1. Admin Analytics Dashboard

**Replace the current empty AdminDashboard.jsx with a full analytics dashboard.**

**Summary cards row (top of dashboard):**
```
Today's Revenue  |  Orders Today  |  Pending Rx  |  Low Stock  |  New Customers
```

**Charts section (use Recharts — already in project):**

1. **Revenue trend** — LineChart, daily revenue for last 30 days
2. **Order volume by status** — BarChart, count per status
3. **Top 10 selling products** — horizontal BarChart, by quantity sold
4. **Customer acquisition** — AreaChart, new customers per week

**Backend analytics routes (add to admin.routes.js):**
```
GET /api/admin/analytics/summary     Dashboard summary cards
GET /api/admin/analytics/revenue     Revenue chart data (query: ?days=30)
GET /api/admin/analytics/orders      Order volume by status
GET /api/admin/analytics/products    Top selling products
GET /api/admin/analytics/customers   Customer growth data
```

**Reports section:**
```
GET /api/admin/reports/sales         Sales report (query: ?from=&to=)
GET /api/admin/reports/products      Product-wise sales report
GET /api/admin/reports/export        Export as CSV (query: ?type=sales|products&format=csv)
```

CSV export using `json2csv` npm package:
```bash
cd server && npm install json2csv
```

---

### B2. GST Invoice PDF Generation

**Install:**
```bash
cd server && npm install pdfkit
```

**Create `server/services/invoice.service.js`:**

Generate a GST-compliant PDF invoice for every order:

```
Header:
  PANKAJ MEDICAL AND GENERAL STORES
  133/17 M Block, Kidwainagar, Kanpur Nagar
  GSTIN: 09ACPPL2448G1ZB
  Tel: [phone] | Email: [email]

Invoice Details:
  Invoice No: PM-INV-2024-00142
  Invoice Date: [date]
  Order No: PM-2024-00142
  Payment Method: [COD/Online]

Bill To:
  [Customer name]
  [Delivery address]
  [Phone]

Items Table:
  | Medicine Name | HSN | Qty | MRP | Disc% | Taxable | GST% | CGST | SGST | Total |

Totals:
  Subtotal, Total Discount, Total Taxable Value
  Total CGST, Total SGST, Total GST
  Delivery Charge
  Grand Total

Footer:
  "Medicines sold against valid prescription only where required"
  "This is a computer-generated invoice — no signature required"
```

**GST calculation (intra-state UP → UP):**
- GST = CGST + SGST (split equally)
- 12% GST → 6% CGST + 6% SGST
- 5% GST → 2.5% CGST + 2.5% SGST
- 18% GST → 9% CGST + 9% SGST

**Generate and store invoice:**
```js
// After order delivered or confirmed (for prepaid)
// Generate PDF → upload to Cloudinary public folder
// Store URL in order.invoiceUrl
// Attach PDF to delivery email
```

**Invoice route:**
```
GET /api/orders/:id/invoice    Customer/Admin — download invoice PDF
```

**Enable download invoice button** in OrderDetail.jsx — currently disabled.

---

### B3. Staff Management (Admin Panel)

**New page: `client/src/pages/admin/StaffManagement.jsx`**

Features:
- Table of all staff accounts: name, email, phone, permissions, status, joined date
- "Invite Staff" button → modal with email input → sends invite email with temp password
- Edit permissions per staff member — toggle switches for each permission:
  - Manage Orders
  - Verify Prescriptions
  - Manage Inventory
  - View Reports
  - Manage Products
- Activate/Deactivate staff account toggle
- "Active" / "Inactive" badge per staff

**Backend routes (add to admin.routes.js):**
```
GET  /api/admin/staff                    List all staff
POST /api/admin/staff                    Create staff + send invite email
PUT  /api/admin/staff/:id/permissions    Update permission toggles
PUT  /api/admin/staff/:id/status         Activate or deactivate
```

**Staff invite flow:**
1. Admin enters email in invite modal
2. Backend generates temp password (8 chars random)
3. Creates User with role: 'staff', all permissions false by default
4. Sends `sendStaffInvite` email with temp password
5. Staff logs in, prompted to change password on first login

---

### B4. Store Settings UI (Admin Panel)

**New page: `client/src/pages/admin/StoreSettings.jsx`**

Sections:

**Delivery Settings:**
- Delivery charge (₹) — number input
- Free delivery threshold (₹) — number input
- Minimum order value (₹) — number input
- Estimated delivery hours — number input
- Serviceable pin codes — tag input (add/remove pin codes)

**Working Hours:**
- Opening time — time picker
- Closing time — time picker

**Store Info:**
- Pharmacy phone number
- Pharmacy email

**Maintenance Mode:**
- Toggle switch — when ON, customers see maintenance page
- Warning: "This will make the store inaccessible to customers"

**Auto Offers:**
- List of automatic discount rules
- Add new rule: min order value, discount type, discount value, label
- Delete rule

**Route:** `/admin/settings`

**Backend:** Already has `GET/PUT /api/admin/settings` — just build the UI.

---

### B5. Bulk Product Activation (Admin Panel)

**Add to `client/src/pages/admin/Products.jsx`:**

- "Select All" checkbox in table header
- Checkbox per product row
- Bulk actions toolbar (appears when items selected):
  - Activate Selected
  - Deactivate Selected
  - Delete Selected (soft delete)
- Separate prominent button: **"Activate All Inactive Products"**
  - Shows count: "423 inactive products"
  - Confirm dialog before running
  - Calls `PUT /api/admin/products/bulk-activate`

**Backend route:**
```
PUT /api/admin/products/bulk-activate    Admin — set isActive:true for all inactive products
PUT /api/admin/products/bulk-action      Admin — body: { productIds[], action: 'activate'|'deactivate'|'delete' }
```

---

### B6. Audit Log Viewer (Admin Panel)

**New page: `client/src/pages/admin/AuditLogs.jsx`**

- Table of all audit log entries
- Columns: Timestamp, User, Role, Action, Target, Details
- Filter by: action type, date range, user
- Paginated — 50 per page
- Read only — no actions

**Route:** `/admin/audit-logs`

**Backend:** `GET /api/admin/audit-logs` with query params for filtering

---

### B7. SEO & Public Pages

**React Helmet for dynamic meta tags:**
```bash
cd client && npm install react-helmet-async
```

Wrap app in `<HelmetProvider>`. Add `<Helmet>` to:
- `ProductList.jsx` — "Buy Medicines Online | Pankaj Medical Kanpur"
- `ProductDetail.jsx` — "[Medicine Name] | Pankaj Medical"
- `Home.jsx` — "Pankaj Medical and General Stores — Online Pharmacy Kanpur"

**Sitemap generation:**

Add endpoint `GET /sitemap.xml` in Express that generates XML sitemap:
```js
// List all active product slugs and static pages
// Format as valid XML sitemap
// Cache for 24 hours
```

**robots.txt:**
Create `client/public/robots.txt`:
```
User-agent: *
Allow: /
Allow: /products
Allow: /products/*
Disallow: /admin
Disallow: /staff
Disallow: /cart
Disallow: /checkout
Disallow: /my-orders
Sitemap: https://yourdomain.com/sitemap.xml
```

**Open Graph tags on product pages:**
```jsx
<Helmet>
  <title>{product.name} | Pankaj Medical</title>
  <meta name="description" content={`Buy ${product.name} online. ${product.composition}. ₹${product.sellingPrice}`} />
  <meta property="og:title" content={product.name} />
  <meta property="og:image" content={product.images[0]} />
</Helmet>
```

---

### B8. PWA Finalization

**Update `client/public/manifest.json`:**
```json
{
  "name": "Pankaj Medical and General Stores",
  "short_name": "Pankaj Medical",
  "description": "Online pharmacy — Kanpur",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0d9488",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Create pharmacy cross icons in teal at 192x192 and 512x512 and save to `client/public/icons/`.

**Update `client/public/sw.js`** with proper caching strategy:
```js
const CACHE_NAME = 'pankaj-medical-v2';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
```

---

### B9. Maintenance Mode Middleware

**Add to `server/middleware/maintenance.middleware.js`:**
```js
module.exports = async (req, res, next) => {
  // Always allow health check and admin routes
  if (req.path === '/health' || req.path.startsWith('/api/auth') ||
      req.path.startsWith('/api/admin')) {
    return next();
  }
  const settings = await Settings.findOne({});
  if (settings?.maintenanceMode) {
    return res.status(503).json({
      success: false,
      message: 'Store is temporarily under maintenance. Please check back soon.',
      code: 'MAINTENANCE_MODE'
    });
  }
  next();
};
```

Register in `server/index.js` before all routes.

**Frontend maintenance page:**
- Check `/api/settings/public` on app load
- If `maintenanceMode: true`, show full-screen maintenance page
- Show: pharmacy name, "We'll be back soon", estimated time, phone number
- Admin and staff can still log in via `/login`

---

### B10. MongoDB Indexes (Run Before Go-Live)

Create all required indexes by running this script from server folder:
```js
// save as create-indexes.js and run: node create-indexes.js
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;

  await db.collection('products').createIndex(
    { name: 'text', composition: 'text', brand: 'text', tags: 'text' },
    { weights: { name: 10, composition: 8, brand: 5, tags: 3 }, name: 'product_text_search' }
  );
  await db.collection('products').createIndex({ expiryDate: 1, isHidden: 1 }, { name: 'product_expiry_idx' });
  await db.collection('products').createIndex({ slug: 1 }, { unique: true, sparse: true, name: 'product_slug_unique' });
  await db.collection('products').createIndex({ isActive: 1, isHidden: 1, category: 1 }, { name: 'product_listing_idx' });
  await db.collection('orders').createIndex({ customer: 1, createdAt: -1 }, { name: 'order_customer_idx' });
  await db.collection('orders').createIndex({ status: 1, createdAt: -1 }, { name: 'order_status_idx' });
  await db.collection('prescriptions').createIndex({ status: 1, createdAt: -1 }, { name: 'prescription_status_idx' });
  await db.collection('notifications').createIndex({ recipient: 1, isRead: 1, createdAt: -1 }, { name: 'notification_recipient_idx' });
  await db.collection('carts').createIndex({ customer: 1 }, { unique: true, name: 'cart_customer_unique' });

  console.log('All indexes created');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
```

---

### B11. Security Hardening (Go-Live Checklist)

Implement all of these before deployment:

```
[ ] Rate limiting on all auth endpoints — already done, verify still active
[ ] Helmet.js security headers — already done, verify in production mode
[ ] CORS — restrict to production domain only (update after domain is bought)
[ ] All prescription URLs — confirm always signed Cloudinary URLs
[ ] Input validation — Zod on all POST/PUT endpoints
[ ] MongoDB sanitization — confirm mongoose-sanitize is active
[ ] Razorpay webhook signature verification — confirm implemented
[ ] JWT in httpOnly cookie — confirm refresh token never in localStorage
[ ] bcrypt salt rounds — confirm always 12
[ ] Admin destructive actions — require password re-entry (refunds, bulk delete)
[ ] Environment variables — confirm none hardcoded, all in .env
[ ] .gitignore — confirm .env files never committed
```

---

### B12. Google Analytics 4

**Add to `client/index.html`:**
```html
<!-- Replace G-XXXXXXXXXX with your actual GA4 measurement ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Add VITE_GA4_ID to client/.env and use it dynamically.

---

### B13. Order Rating System

**Complete the rating flow:**
- Customer can rate after order is `delivered`
- Rating: 1-5 stars + optional comment
- Already in Order model: `rating: { score, comment, ratedAt }`
- Show ratings in admin analytics

**Add average rating to admin dashboard:**
- Average order rating this month
- Recent reviews list

---

## PART C — New Pages Summary

```
client/src/pages/admin/
  StaffManagement.jsx      (new)
  StoreSettings.jsx        (new)
  AuditLogs.jsx            (new)
  Analytics.jsx            (new — replace AdminDashboard shell)

client/src/pages/
  Maintenance.jsx          (new — shown when maintenanceMode: true)
```

---

## PART D — npm Packages to Install

**Server:**
```bash
cd server
npm install razorpay twilio pdfkit json2csv
```

**Client:**
```bash
cd client
npm install react-helmet-async
```

---

## PART E — App.jsx Route Updates

Add these new routes:
```jsx
<Route path="/admin/staff" element={<ProtectedRoute roles={['admin']}><StaffManagement /></ProtectedRoute>} />
<Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><StoreSettings /></ProtectedRoute>} />
<Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
<Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>} />
```

Update AdminLayout.jsx sidebar — enable all navigation links:
```
Dashboard     → /admin/dashboard (now full analytics)
Products      → /admin/products
Import CSV    → /admin/products/import
Expiry        → /admin/expiry
Orders        → /admin/orders
Prescriptions → /admin/prescriptions
Staff         → /admin/staff          (Phase 5 — now active)
Settings      → /admin/settings       (Phase 5 — now active)
Audit Logs    → /admin/audit-logs     (Phase 5 — now active)
```

---

## PART F — Deliverable Checklist

### Phase 4
- [ ] Razorpay order creation API
- [ ] Razorpay payment verification API
- [ ] Razorpay webhook handler with signature verification
- [ ] Payment failure handling with 30min stock release
- [ ] Payment retry flow
- [ ] Admin refund API with password confirmation
- [ ] Auto-refund on prescription rejection
- [ ] Coupon model + CRUD APIs
- [ ] Coupon validation at checkout
- [ ] Auto-offer rules in settings
- [ ] Coupon field wired in Checkout.jsx
- [ ] SMS service with Twilio (dev fallback to console)
- [ ] SMS sent for key order events
- [ ] All email templates completed
- [ ] Daily summary email cron at 9AM IST

### Phase 5
- [ ] Admin analytics dashboard with 4 charts
- [ ] Analytics backend routes
- [ ] CSV report export
- [ ] GST invoice PDF generation with pdfkit
- [ ] Invoice attached to delivery email
- [ ] Download invoice button enabled in OrderDetail.jsx
- [ ] Staff management page
- [ ] Staff invite flow with temp password email
- [ ] Store settings UI page
- [ ] Maintenance mode middleware + frontend page
- [ ] Bulk product activation UI + API
- [ ] Audit log viewer page
- [ ] React Helmet meta tags on public pages
- [ ] Sitemap.xml endpoint
- [ ] robots.txt
- [ ] PWA manifest.json updated with correct icons
- [ ] Service worker updated (v2)
- [ ] MongoDB indexes script created and run
- [ ] Security hardening checklist completed
- [ ] Google Analytics 4 integrated
- [ ] Order rating system completed
- [ ] All admin sidebar links active

### Git safety (run before final push)
- [ ] `git ls-files | Select-String -Pattern "ANTIGRAVITY|PANKAJ_MEDICAL|ANTHROPIC_PROMPT|recovery|spec|prompt"` → empty
- [ ] `git ls-files | Select-String ".env"` → empty
- [ ] `npm run lint` → 0 errors on both client and server
- [ ] `npm run dev` → starts cleanly, no errors

---

## What NOT to Build

- React Native mobile app (deferred)
- WhatsApp Business API (deferred — needs approval process)
- Loyalty points / wallet system (deferred)
- Delivery agent management (deferred)
- Supplier management (deferred)
- Partial order fulfilment (deferred)
- Multi-branch support (deferred)

---

## Deliver

1. Confirmation git safety checks passed (empty output)
2. Confirmation `npm run lint` → 0 errors
3. `npm run dev` starts cleanly — share server console output
4. Manual testing instructions for:
   - Place an online Razorpay payment order end-to-end
   - Apply a coupon code at checkout
   - View admin analytics dashboard with charts
   - Download a GST invoice PDF from an order
   - Invite a staff member and verify invite email sent
   - Toggle maintenance mode and verify customer sees maintenance page
5. Summary of any decisions that deviate from this plan
