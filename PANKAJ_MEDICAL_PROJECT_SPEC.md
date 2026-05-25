# PANKAJ MEDICAL AND GENERAL STORES — Full Project Specification

> **Store Name:** PANKAJ MEDICAL AND GENERAL STORES  
> **Location:** 133/17 M Block, Kidwainagar, Kanpur Nagar  
> **GSTIN:** 09ACPPL2448G1ZB  
> **Project Type:** Full-Stack Pharmacy E-Commerce Web Application  
> **Build Strategy:** Iterative phases — each phase delivers a working prototype

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Hosting & Deployment](#hosting--deployment)
3. [Project Structure](#project-structure)
4. [Phase Overview](#phase-overview)
5. [Phase 1 — Auth, Roles & Foundation](#phase-1--auth-roles--foundation)
6. [Phase 2 — Product Catalogue & Inventory](#phase-2--product-catalogue--inventory)
7. [Phase 3 — Cart, Orders & Prescription Flow](#phase-3--cart-orders--prescription-flow)
8. [Phase 4 — Payments, Offers & Notifications](#phase-4--payments-offers--notifications)
9. [Phase 5 — Admin Analytics, SEO & Go-Live](#phase-5--admin-analytics-seo--go-live)
10. [Database Schemas](#database-schemas)
11. [API Routes Reference](#api-routes-reference)
12. [Role & Permission Matrix](#role--permission-matrix)
13. [Medicine Classification & Approval Rules](#medicine-classification--approval-rules)
14. [Expiry Management Rules](#expiry-management-rules)
15. [Order Lifecycle](#order-lifecycle)
16. [CSV Import Specification](#csv-import-specification)
17. [GST & Invoice Rules](#gst--invoice-rules)
18. [Notification Events](#notification-events)
19. [Security Rules](#security-rules)
20. [Deferred Features](#deferred-features)

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast builds, modern standard, no CRA deprecation issues |
| Backend | Node.js + Express.js | Full JS stack, rich npm ecosystem |
| Database | MongoDB Atlas | Flexible schema for varied medicine attributes |
| Auth | Firebase Authentication | Google OAuth + Phone OTP built-in, free tier generous |
| File Storage | Cloudinary | Prescription images, product images — private + public folders |
| Payments | Razorpay | Best for India — UPI, cards, wallets, net banking, COD |
| SMS | Firebase / MSG91 | OTP via Firebase, transactional SMS via MSG91 |
| Email | Nodemailer + Gmail SMTP | Free, reliable for transactional emails |
| Styling | Tailwind CSS | Rapid UI development, mobile-first |
| State Management | Zustand | Lightweight, simple, no boilerplate |
| HTTP Client | Axios | API calls from frontend |
| Language | JavaScript (ES6+) | No TypeScript overhead for solo/small team build |
| Linting | ESLint + Prettier | Code consistency from day one |

---

## Hosting & Deployment

| Service | What it hosts | Cost | Notes |
|---|---|---|---|
| Vercel | React frontend | Free | Auto-deploy from GitHub, custom domain support |
| Render | Node.js backend | Free | Use UptimeRobot ping every 10 min to prevent sleep |
| MongoDB Atlas | Database | Free (512MB) | M0 cluster, upgrade when needed |
| Cloudinary | Images & files | Free (25GB) | Prescriptions in private folder, product images public |
| Firebase | Auth + OTP | Free | 10k SMS OTP/month on free tier |
| UptimeRobot | Keep Render alive | Free | Ping `/health` endpoint every 10 minutes |

**Upgrade path:**
- Phase 1–4: Entire stack at ₹0/month
- Phase 5+: Railway (~₹600/month) when traffic justifies it
- Scale: AWS/DigitalOcean VPS (~₹1500–3000/month) when needed

**Environment files:**
- `.env.development` — local dev keys, test Razorpay keys
- `.env.production` — live keys, production DB, live Razorpay

---

## Project Structure

```
pankaj-medical/
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   └── sw.js                    # Service worker
│   ├── src/
│   │   ├── assets/                  # Images, icons, fonts
│   │   ├── components/
│   │   │   ├── common/              # Button, Input, Modal, Badge, Loader
│   │   │   ├── layout/              # Navbar, Footer, Sidebar
│   │   │   └── shared/              # ProductCard, OrderCard, RxBadge
│   │   ├── pages/
│   │   │   ├── public/              # Home, ProductList, ProductDetail, About, Contact
│   │   │   ├── auth/                # Login, Signup, ForgotPassword, OtpVerify
│   │   │   ├── customer/            # Dashboard, Cart, Checkout, Orders, Profile, Addresses
│   │   │   ├── staff/               # OrderQueue, PrescriptionReview, Inventory, ExpiryPage
│   │   │   └── admin/               # Dashboard, Products, Users, Staff, Analytics, Settings
│   │   ├── store/                   # Zustand stores (auth, cart, notifications)
│   │   ├── hooks/                   # useAuth, useCart, useOrders, useDebounce
│   │   ├── services/                # api.js, auth.js, razorpay.js
│   │   ├── utils/                   # formatCurrency, formatDate, rxClassifier
│   │   ├── constants/               # roles, rxTypes, orderStatuses, categories
│   │   └── App.jsx                  # Routes + protected route wrappers
│   ├── .env.development
│   ├── .env.production
│   └── vite.config.js
│
├── server/                          # Node.js + Express backend
│   ├── config/
│   │   ├── db.js                    # MongoDB Atlas connection
│   │   ├── firebase.js              # Firebase Admin SDK init
│   │   └── cloudinary.js            # Cloudinary config
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Prescription.js
│   │   ├── Cart.js
│   │   ├── Coupon.js
│   │   ├── Notification.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   ├── prescription.routes.js
│   │   ├── payment.routes.js
│   │   ├── cart.routes.js
│   │   ├── user.routes.js
│   │   ├── admin.routes.js
│   │   ├── staff.routes.js
│   │   └── notification.routes.js
│   ├── controllers/                 # One controller per route file
│   ├── middleware/
│   │   ├── auth.middleware.js       # Verify JWT
│   │   ├── role.middleware.js       # requireRole('admin'), requireRole('staff')
│   │   ├── permission.middleware.js # checkStaffPermission('manageOrders')
│   │   └── rateLimit.middleware.js  # express-rate-limit config
│   ├── services/
│   │   ├── email.service.js         # Nodemailer templates
│   │   ├── sms.service.js           # MSG91 / Firebase SMS
│   │   ├── invoice.service.js       # GST invoice PDF generation
│   │   ├── csv.service.js           # CSV import parser
│   │   └── stock.service.js         # Stock reservation + release logic
│   ├── utils/
│   │   ├── auditLogger.js
│   │   ├── rxValidator.js
│   │   └── pinCodeChecker.js
│   ├── jobs/
│   │   └── expiryChecker.js         # Daily cron — flag expiring products
│   ├── .env.development
│   ├── .env.production
│   └── index.js                     # Express app entry point
│
├── .gitignore
├── README.md
└── package.json                     # Root scripts for monorepo
```

---

## Phase Overview

| Phase | Deliverable | What the client sees |
|---|---|---|
| Phase 1 | Auth + Role system | Login, signup, Google, OTP, 3 dashboards (empty but accessible) |
| Phase 2 | Product catalogue | Full medicine store, search, filters, CSV import, expiry management |
| Phase 3 | Orders + Prescriptions | Cart, checkout, H/NRX approval flow, order tracking |
| Phase 4 | Payments + Notifications | Razorpay live, SMS/email alerts, coupons, offers |
| Phase 5 | Analytics + Go-live | Admin dashboard reports, GST invoices, SEO, PWA, production deploy |

---

## Phase 1 — Auth, Roles & Foundation

### What to build
- Complete authentication system
- Role-based access control
- Protected route structure
- All three dashboard shells (customer, staff, admin)
- Health check endpoint
- About Us + Contact Us public pages

### Authentication methods
1. **Email + Password** — standard signup/login with email verification
2. **Google OAuth** — Firebase `signInWithPopup`, auto-creates account, merges if email already exists
3. **Phone OTP** — Firebase `signInWithPhoneNumber`, OTP login only (no password required for phone users)

### Auth rules
- Email verification: soft enforce — allow browsing without it, require at checkout
- JWT: access token 15 minutes, refresh token 7 days (30 days if "remember me" checked)
- On Google login with existing email: link both auth methods to same account, never duplicate
- Failed login attempts: block after 5 attempts for 15 minutes (express-rate-limit)
- Banned users: show message "Your account has been suspended. Contact support."

### Roles

| Role | Created by | Default | Description |
|---|---|---|---|
| `customer` | Self-registration | Yes | Browse, order, track |
| `staff` | Admin only (invite email) | No | Orders, prescriptions, inventory |
| `admin` | Pre-seeded in DB | No | Full access |

### Staff permissions (toggle per staff member, stored in User document)
```js
permissions: {
  manageOrders: Boolean,        // View + update order status
  verifyPrescriptions: Boolean, // Approve/reject prescriptions
  manageInventory: Boolean,     // View + update stock
  viewReports: Boolean,         // View analytics (read only)
  manageProducts: Boolean       // Add/edit products (optional for senior staff)
}
```

### Customer profile fields
- Required: `name`, `phone`
- Optional: `email`, `dateOfBirth`, `gender`
- Up to 5 saved delivery addresses
- No profile picture (not relevant for pharmacy)
- Soft delete: mark `isDeleted: true`, anonymize PII, retain order records

### Phase 1 deliverable checklist
- [ ] `/api/auth/signup` — email+password
- [ ] `/api/auth/login` — email+password
- [ ] `/api/auth/google` — Firebase token verify, create/merge user
- [ ] `/api/auth/phone/send-otp` — Firebase phone auth
- [ ] `/api/auth/phone/verify-otp` — verify + issue JWT
- [ ] `/api/auth/refresh` — refresh JWT
- [ ] `/api/auth/logout`
- [ ] `/api/auth/forgot-password`
- [ ] `/api/auth/reset-password`
- [ ] `/health` — `{ status: 'ok', timestamp }` (for UptimeRobot ping)
- [ ] Role middleware protecting all dashboard routes
- [ ] Customer dashboard shell (empty, authenticated)
- [ ] Staff dashboard shell (empty, authenticated + role-guarded)
- [ ] Admin dashboard shell (empty, authenticated + role-guarded)
- [ ] Public pages: Home, About Us, Contact Us
- [ ] Responsive mobile-first layout with Tailwind
- [ ] PWA manifest.json + basic service worker

---

## Phase 2 — Product Catalogue & Inventory

### What to build
- Complete medicine product model
- Product listing page with search and filters
- Product detail page
- Admin: add/edit/delete products
- Admin: bulk CSV import
- Composition auto-fill via OpenFDA API
- Inventory management
- Expiry management page (staff + admin only)
- Low stock alerts

### Medicine classification (Rx Type)
Every product must have one of these classifications:

| Type | Meaning | Approval needed? |
|---|---|---|
| `OTC` | Over the counter | No — direct purchase |
| `H` | Schedule H prescription medicine | Yes — staff approval required |
| `NRX` | Non-prescription but store acknowledgment needed | Yes — staff approval required |
| `H1` | Schedule H1 (strict, e.g. antibiotics, psychotropics) | Direct purchase — NO approval (H1 is stricter than H in real law but per client decision, only H and NRX need approval in this system) |

> **Important clarification confirmed by client:** Only `H` and `NRX` require staff approval + prescription upload. `OTC` and `H1` go straight to checkout without any approval gate.

### Product fields (MongoDB schema)
```js
{
  name: String,               // "ACILOC-150MG TAB"
  brand: String,              // "Cadila"
  manufacturer: String,       // Manufacturer name
  composition: String,        // "Ranitidine 150mg" (auto-fill via OpenFDA)
  category: String,           // enum — see categories below
  form: String,               // TAB | CAP | SYP | INH | GEL | CREAM | DROP | INJ | POWDER | OTHER
  dosage: String,             // "150mg", "500mg"
  mrp: Number,                // Maximum retail price
  sellingPrice: Number,       // Actual selling price
  discount: Number,           // Percentage discount
  rxType: String,             // OTC | H | NRX | H1
  stock: Number,              // Current stock count
  lowStockThreshold: Number,  // Default 10, configurable per product
  expiryDate: Date,           // MM/YYYY
  batchNumber: String,
  hsnCode: String,            // For GST invoice
  gstRate: Number,            // 5 | 12 | 18 (percentage)
  images: [String],           // Cloudinary URLs (max 3)
  description: String,
  sideEffects: String,
  storageInstructions: String,
  rackLocation: String,       // Physical shelf location
  isActive: Boolean,          // Admin can deactivate without deleting
  isHidden: Boolean,          // Auto-set true when near/past expiry
  substitutes: [ObjectId],    // Links to similar composition products
  tags: [String],
  createdBy: ObjectId,
  updatedAt: Date
}
```

### Product categories (8 default, admin can add more)
1. Tablets & Capsules
2. Syrups & Liquids
3. Injections
4. Surgical & Devices
5. Vitamins & Supplements
6. Baby Care
7. Personal Care
8. Ayurvedic & Herbal

### Search
- MongoDB text index on: `name`, `composition`, `brand`, `tags`
- Search must work on salt/composition name (doctors write salt names on prescriptions)
- Auto-suggest dropdown while typing (debounced, 300ms)

### Filters
- Category
- Price range (slider)
- Brand
- Rx type (OTC only / Prescription / All)
- In stock only (toggle)

### Composition auto-fill (OpenFDA API)
- When admin types medicine name in product form, call OpenFDA API:
  `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"MEDICINE_NAME"`
- Auto-fill: generic name, active ingredients
- Fallback: admin fills manually
- Admin can always override auto-filled values

### Substitute suggestion
- Link products with same `composition` field
- When product is out of stock: show "Similar medicines available" with linked substitutes
- Admin manually links substitutes or system auto-suggests by composition match

### Bulk CSV import
**CSV template columns (provide downloadable sample to admin):**
```
name, brand, manufacturer, composition, category, form, dosage, mrp,
sellingPrice, rxType, stock, expiryDate, batchNumber, hsnCode, gstRate,
rackLocation, description
```

**Import rules:**
- Admin uploads CSV → system shows preview (first 10 rows + count of new/update/errors)
- Admin confirms → import runs
- Match existing products by `name + brand` (case-insensitive)
- Duplicates: update price, stock, expiry — preserve images and description
- Invalid rows: skip and include in downloadable error report
- Whole import does NOT fail for one bad row
- Form type auto-detected from name suffix (TAB, CAP, SYP, etc.)

### Expiry management page (staff + admin only, `/staff/expiry` and `/admin/expiry`)
Three tabs:

| Tab | Criteria | Customer visibility | Actions available |
|---|---|---|---|
| Expired | Past expiry date | Hidden from store | Admin: mark disposed / write-off |
| Near Expiry | Within 30 days | Auto-hidden from store | Admin: mark disposed, override visibility |
| Expiring Soon | 31–90 days | Visible with warning badge | Staff: view only |

- Admin can manually override auto-hide for any product
- Daily cron job runs at midnight to update `isHidden` flags
- Low stock alert triggers when `stock <= lowStockThreshold`
- Alerts sent to admin + staff with `manageInventory` permission

### Phase 2 deliverable checklist
- [ ] Product model + all CRUD APIs
- [ ] Public product listing page (no login required)
- [ ] Product detail page (public)
- [ ] Search with text index + auto-suggest
- [ ] Filter sidebar
- [ ] Admin: add product form with OpenFDA auto-fill
- [ ] Admin: edit/delete product
- [ ] Admin: bulk CSV import with preview
- [ ] Admin: downloadable CSV template
- [ ] Expiry management page (staff + admin)
- [ ] Daily cron job for expiry auto-hide
- [ ] Low stock notification trigger
- [ ] Substitute medicine linking

---

## Phase 3 — Cart, Orders & Prescription Flow

### What to build
- Cart system (persistent for logged-in users)
- Checkout flow
- H and NRX prescription upload + staff approval
- Order management for staff
- Order tracking for customers
- Return/refund request (basic)

### Cart rules
- Logged-in users: cart saved to MongoDB (persists across devices)
- Guest users: cart in localStorage (syncs to DB on login)
- Max 10 units per product per order
- Rx medicines (H/NRX): max 2 strips per order
- Minimum order value: ₹200 for delivery (configurable by admin)
- Free delivery: orders above ₹500 (configurable by admin)
- If product goes out of stock while in cart: flag at checkout ("Item no longer available"), show substitute
- OTC + H/NRX items allowed in same cart

### Checkout steps
1. Review cart
2. Select/add delivery address OR select in-store pickup
3. Choose delivery method (delivery/pickup)
4. **If cart contains H or NRX items:** prescription upload step appears
5. Apply coupon (optional)
6. Review order summary with delivery charge, discount, GST breakdown
7. Select payment method
8. Place order → redirect to payment

### Prescription upload rules (H and NRX only)
- Upload at checkout step (not cart)
- Accepted formats: JPG, PNG, PDF — max 5MB
- Stored in Cloudinary **private** folder (signed URLs only, never public)
- Customer can reuse a previously verified prescription (saved to profile)
- Prescription validity: 6 months (Schedule H1: 30 days — but H1 doesn't require prescription in this system)
- Staff can request re-upload with a reason message
- Order placed and payment collected → status set to `pending_approval`
- Staff reviews and approves or rejects

### H and NRX approval flow
```
Customer adds H/NRX item to cart
  → Banner shown: "This medicine requires a valid prescription and store approval"
  → At checkout: prescription upload step
  → Order placed, payment collected
  → Status: pending_approval
  → Staff gets in-app + email notification: "New prescription order #XXXX needs review"
  → Staff opens prescription review page
  → Staff sees: prescription image, ordered medicines, patient name
  → Staff approves → order moves to confirmed → normal fulfilment flow
  → Staff rejects → reason required → customer notified via SMS + email
                  → auto-refund via Razorpay within 24 hours
  → Staff requests re-upload → customer notified → order stays on hold
```

**Out-of-hours handling:**
- Customer placing H/NRX order at night sees: "Prescription orders are reviewed during working hours. Your order will be confirmed by next working day."
- If no staff action within 48 hours → auto-cancel with full refund

### Order statuses
```
pending_payment → payment_failed (terminal)
pending_payment → pending_approval (H/NRX orders after payment)
pending_payment → confirmed (OTC/H1 orders after payment)
pending_approval → confirmed (after staff approves prescription)
pending_approval → cancelled (staff rejects — auto-refund)
confirmed → processing
processing → packed
packed → shipped
shipped → delivered (terminal — success)
any status before packed → cancelled (customer-initiated)
delivered → return_requested
return_requested → return_approved / return_rejected
```

### Order management (staff)
- View all incoming orders sorted by time
- Filter by status, Rx type, date
- Update order status (processing → packed → shipped)
- For pending_approval orders: view prescription image, approve or reject
- Print packing slip
- Mark COD payment as collected

### Order rules
- Auto-confirm OTC and H1 orders immediately after payment
- Stock reserved on order placement, released on cancellation or payment failure
- Customer can cancel only before `packed` status
- After `packed` status: customer must contact pharmacy directly

### Return/refund (basic)
- Customer raises return request with reason from order history page
- Admin approves or rejects from admin panel
- Approved refund processed via Razorpay API to original payment method
- No wallet/store credit system in this phase

### Delivery settings (configurable in admin settings)
- Serviceable pin codes: admin maintains whitelist
- Delivery charge: flat ₹50 (configurable)
- Free delivery threshold: ₹500 (configurable)
- Estimated delivery: "Today by 8PM" or "Within 24 hours" — admin sets working hours + cutoff time
- In-store pickup: customer gets SMS when order is ready

### Phase 3 deliverable checklist
- [ ] Cart model + APIs (add, update, remove, sync guest cart)
- [ ] Persistent cart for logged-in users
- [ ] Checkout flow (multi-step)
- [ ] Prescription upload at checkout for H + NRX items
- [ ] Cloudinary private upload for prescriptions
- [ ] Order model + creation API
- [ ] Order status state machine
- [ ] Stock reservation on order place, release on cancel
- [ ] Staff: prescription review queue
- [ ] Staff: approve/reject/re-upload-request flow
- [ ] Customer: order history page
- [ ] Customer: order tracking page with status timeline
- [ ] 48-hour auto-cancel cron job for unreviewed prescriptions
- [ ] Basic return request flow
- [ ] Delivery pin code check at checkout
- [ ] Delivery charge calculation

---

## Phase 4 — Payments, Offers & Notifications

### What to build
- Razorpay full integration
- COD payment flow
- Coupon system
- Automatic discount rules
- Email notifications (Nodemailer)
- SMS notifications (MSG91 / Firebase)
- In-app notification bell

### Razorpay integration
- Create Razorpay order on backend → pass order ID to frontend → open Razorpay checkout
- Payment methods: UPI, credit/debit card, net banking, wallets (Paytm, PhonePe, etc.)
- Webhook: listen for `payment.captured` and `payment.failed` events
- On `payment.captured`: update order to confirmed (OTC/H1) or pending_approval (H/NRX)
- On `payment.failed`: keep order as payment_failed, restore stock after 30 minutes
- Payment failed orders: customer can retry payment within 30 minutes → after 30 min auto-cancel
- Refunds: via Razorpay API to original payment method only
- COD: staff marks payment collected via staff dashboard

### Coupon system
Coupon types:
- `percentage` — e.g. 10% off
- `flat` — e.g. ₹100 off
- `free_delivery` — waive delivery charge

Coupon rules:
- Usage limit: total uses + per-customer limit (default 1 use per customer)
- Min order value to apply
- Expiry date
- Category/product restrictions (optional)
- Admin creates and manages coupons in admin panel

Automatic offers (no coupon code required):
- Admin creates rules: "10% off on orders above ₹1000"
- Auto-applied in cart, shown as discount line item

### Notification events

| Event | SMS | Email | In-app |
|---|---|---|---|
| OTP | Yes | No | No |
| Signup welcome | No | Yes | No |
| Email verification | No | Yes | No |
| Order placed (OTC/H1) | No | Yes | Yes |
| Order placed (H/NRX — pending approval) | Yes | Yes | Yes |
| Prescription approved | Yes | Yes | Yes |
| Prescription rejected | Yes | Yes | Yes |
| Prescription re-upload requested | No | Yes | Yes |
| Order confirmed | No | Yes | Yes |
| Order packed | No | No | Yes |
| Order shipped | Yes | Yes | Yes |
| Order delivered | No | Yes | Yes |
| Order cancelled | No | Yes | Yes |
| Pickup ready | Yes | No | Yes |
| New Rx order (to staff) | No | Yes | Yes |
| Low stock alert (to admin/staff) | No | Yes | Yes |
| Expiry warning (to admin) | No | Yes | No |
| Daily summary (to admin) | No | Yes | No |
| Payment failed | No | Yes | Yes |
| Refund initiated | No | Yes | Yes |

Customer notification preferences: transactional always on, promotional can be turned off.

### Phase 4 deliverable checklist
- [ ] Razorpay order creation API
- [ ] Razorpay webhook handler
- [ ] Payment retry flow (30 min window)
- [ ] COD order flow + staff mark-as-collected
- [ ] Refund API (admin-triggered)
- [ ] Coupon model + CRUD APIs
- [ ] Coupon validation at checkout
- [ ] Auto-offer rules engine
- [ ] Email service (Nodemailer) with HTML templates for all events
- [ ] SMS service with MSG91 for key events
- [ ] In-app notification bell (real-time with Socket.io or polling)
- [ ] Notification preferences in customer profile
- [ ] Daily summary email cron job (9AM)

---

## Phase 5 — Admin Analytics, SEO & Go-Live

### What to build
- Admin analytics dashboard
- GST-compliant invoice generation
- Audit logs
- SEO optimization
- PWA finalization
- Maintenance mode
- Production deployment

### Admin analytics dashboard
Key metrics on main screen:
- Today's revenue
- Total orders (today / this week / this month)
- Pending prescription approvals (urgent — highlighted)
- Low stock products count (with link to inventory)
- New customers this week

Charts:
- Revenue trend (daily/weekly/monthly toggle)
- Top 10 selling products
- Order volume by status
- Customer acquisition over time

Reports (exportable as CSV and PDF):
- Sales report by date range
- Product-wise sales
- Pending Rx orders
- Expiry report
- Stock report

### GST invoice
Auto-generated PDF on every order:
- Pharmacy name: PANKAJ MEDICAL AND GENERAL STORES
- Address: 133/17 M Block, Kidwainagar, Kanpur Nagar
- GSTIN: 09ACPPL2448G1ZB
- Customer name + address
- Order number + date
- Line items: medicine name, HSN code, quantity, MRP, discount, selling price
- GST breakdown: CGST + SGST per line item (based on `gstRate` field per product)
- Total, discount total, GST total, grand total
- "This is a computer-generated invoice"

GST rates by category:
- Most medicines: 12%
- Some OTC/personal care: 18%
- Basic medicines (government-listed): 5%
- Admin sets `gstRate` per product (5, 12, or 18)

### Audit log
Log these actions with: `userId`, `role`, `action`, `target`, `previousValue`, `newValue`, `timestamp`, `ip`:
- Product price changed
- Stock updated
- Prescription approved/rejected
- Order status changed
- Staff account created/deactivated
- Coupon created/deleted
- Bulk CSV import
- Refund processed
- Admin settings changed

Audit logs retained for 90 days, viewable by admin only.

### SEO
- Product pages publicly accessible without login (for Google indexing)
- React Helmet for dynamic meta tags on product/category pages
- Sitemap.xml generated for all public product pages
- robots.txt configured
- Open Graph tags for sharing

### PWA finalization
- manifest.json: name, short_name, icons (192px + 512px), theme color, background color, display standalone
- Service worker: cache static assets, offline fallback page
- "Add to Home Screen" prompt on mobile browsers
- App icon: pharmacy cross icon in brand color (teal/green)

### Maintenance mode
- `MAINTENANCE_MODE=true` env variable
- All public routes show maintenance page except `/health`
- Admin + staff can still log in via `/admin/login` direct URL
- Middleware checks flag before routing

### Security checklist for go-live
- [ ] Rate limiting on all auth endpoints (5 attempts / 15 min)
- [ ] Helmet.js for HTTP security headers
- [ ] CORS configured for production domain only
- [ ] All prescription image URLs are signed Cloudinary URLs (never public)
- [ ] Input validation with Joi/Zod on all API endpoints
- [ ] MongoDB injection protection (Mongoose sanitization)
- [ ] XSS protection
- [ ] Environment variables never committed to Git (.gitignore)
- [ ] Razorpay webhook signature verification
- [ ] Admin destructive actions (bulk delete, refunds) require password re-entry

### Phase 5 deliverable checklist
- [ ] Analytics dashboard with charts (Recharts)
- [ ] CSV + PDF report export
- [ ] GST invoice PDF generation (pdfkit or puppeteer)
- [ ] Audit log model + display in admin
- [ ] SEO meta tags + sitemap
- [ ] PWA manifest + service worker finalized
- [ ] Maintenance mode middleware
- [ ] Full security audit
- [ ] Production deploy (Vercel + Render + Atlas)
- [ ] Custom domain setup
- [ ] Google Analytics 4 integration
- [ ] Order feedback/rating system (1–5 stars after delivery)

---

## Database Schemas

### User
```js
{
  _id: ObjectId,
  name: String,
  email: String (unique, sparse),
  phone: String (unique, sparse),
  passwordHash: String,
  firebaseUid: String,
  authProviders: ['email', 'google', 'phone'],
  role: { type: String, enum: ['customer', 'staff', 'admin'], default: 'customer' },
  permissions: {                    // Only for staff
    manageOrders: Boolean,
    verifyPrescriptions: Boolean,
    manageInventory: Boolean,
    viewReports: Boolean,
    manageProducts: Boolean
  },
  addresses: [{
    label: String,                  // Home, Office, etc.
    line1: String,
    line2: String,
    city: String,
    state: String,
    pinCode: String,
    isDefault: Boolean
  }],
  isVerified: Boolean,              // Email verified
  isActive: Boolean,
  isDeleted: Boolean,               // Soft delete
  notificationPreferences: {
    promotional: Boolean,
    sms: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```js
{
  _id: ObjectId,
  name: String,
  slug: String,                     // URL-friendly name
  brand: String,
  manufacturer: String,
  composition: String,
  category: String,
  form: String,
  dosage: String,
  mrp: Number,
  sellingPrice: Number,
  discount: Number,
  rxType: { type: String, enum: ['OTC', 'H', 'NRX', 'H1'] },
  stock: Number,
  lowStockThreshold: { type: Number, default: 10 },
  expiryDate: Date,
  batchNumber: String,
  hsnCode: String,
  gstRate: { type: Number, enum: [5, 12, 18] },
  images: [String],
  description: String,
  sideEffects: String,
  storageInstructions: String,
  rackLocation: String,
  isActive: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false },
  substitutes: [{ type: ObjectId, ref: 'Product' }],
  tags: [String],
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```js
{
  _id: ObjectId,
  orderNumber: String,              // Auto-generated, e.g. "PM-2024-00142"
  customer: { type: ObjectId, ref: 'User' },
  items: [{
    product: { type: ObjectId, ref: 'Product' },
    name: String,                   // Snapshot at time of order
    mrp: Number,
    sellingPrice: Number,
    quantity: Number,
    rxType: String,
    gstRate: Number,
    hsnCode: String
  }],
  prescriptions: [{ type: ObjectId, ref: 'Prescription' }],
  status: {
    type: String,
    enum: ['pending_payment', 'payment_failed', 'pending_approval',
           'confirmed', 'processing', 'packed', 'shipped',
           'delivered', 'cancelled', 'return_requested',
           'return_approved', 'return_rejected']
  },
  deliveryType: { type: String, enum: ['delivery', 'pickup'] },
  deliveryAddress: { ... },         // Snapshot of address
  deliveryCharge: Number,
  subtotal: Number,
  discount: Number,
  couponCode: String,
  couponDiscount: Number,
  gstTotal: Number,
  grandTotal: Number,
  payment: {
    method: { type: String, enum: ['razorpay', 'cod'] },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'] },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  staffNotes: String,
  cancellationReason: String,
  returnReason: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  rating: { score: Number, comment: String, ratedAt: Date },
  timeline: [{
    status: String,
    timestamp: Date,
    updatedBy: ObjectId
  }],
  invoiceUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Prescription
```js
{
  _id: ObjectId,
  customer: { type: ObjectId, ref: 'User' },
  order: { type: ObjectId, ref: 'Order' },
  imageUrl: String,                 // Cloudinary signed URL (private)
  cloudinaryPublicId: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reupload_requested']
  },
  reviewedBy: { type: ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  reuploadReason: String,
  validUntil: Date,                 // 6 months from upload date
  isReusable: Boolean,              // True after first approval
  medicines: [String],              // Extracted medicine names (manual entry by staff)
  createdAt: Date
}
```

### Cart
```js
{
  _id: ObjectId,
  customer: { type: ObjectId, ref: 'User', unique: true },
  items: [{
    product: { type: ObjectId, ref: 'Product' },
    quantity: Number,
    addedAt: Date
  }],
  updatedAt: Date
}
```

### Coupon
```js
{
  _id: ObjectId,
  code: String (unique, uppercase),
  type: { type: String, enum: ['percentage', 'flat', 'free_delivery'] },
  value: Number,
  minOrderValue: Number,
  maxDiscount: Number,              // Cap for percentage coupons
  totalUsageLimit: Number,
  perCustomerLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: ObjectId, ref: 'User' }],
  expiryDate: Date,
  isActive: Boolean,
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: Date
}
```

### Notification
```js
{
  _id: ObjectId,
  recipient: { type: ObjectId, ref: 'User' },
  type: String,                     // order_placed, prescription_approved, etc.
  title: String,
  message: String,
  link: String,                     // Deep link to relevant page
  isRead: { type: Boolean, default: false },
  createdAt: Date
}
```

### AuditLog
```js
{
  _id: ObjectId,
  performedBy: { type: ObjectId, ref: 'User' },
  role: String,
  action: String,
  targetModel: String,
  targetId: ObjectId,
  previousValue: Mixed,
  newValue: Mixed,
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

---

## API Routes Reference

### Auth (`/api/auth`)
```
POST   /signup
POST   /login
POST   /google
POST   /phone/send-otp
POST   /phone/verify-otp
POST   /refresh
POST   /logout
POST   /forgot-password
POST   /reset-password/:token
GET    /verify-email/:token
```

### Products (`/api/products`)
```
GET    /                    Public — list with filters + pagination
GET    /search              Public — search by name/composition
GET    /:slug               Public — product detail
POST   /                    Admin — create product
PUT    /:id                 Admin — update product
DELETE /:id                 Admin — soft delete
POST   /import-csv          Admin — bulk import
GET    /import-template     Admin — download CSV template
GET    /expiry              Staff/Admin — expiry management list
PUT    /:id/toggle-visibility Admin — override auto-hide
```

### Cart (`/api/cart`)
```
GET    /                    Customer — get cart
POST   /add                 Customer — add item
PUT    /update              Customer — update quantity
DELETE /remove/:productId   Customer — remove item
POST   /sync                Customer — sync guest cart on login
DELETE /clear               Customer
```

### Orders (`/api/orders`)
```
POST   /                    Customer — place order
GET    /my-orders           Customer — order history
GET    /my-orders/:id       Customer — order detail
POST   /my-orders/:id/cancel Customer — cancel order
POST   /my-orders/:id/return Customer — raise return request
POST   /my-orders/:id/rate  Customer — submit rating

GET    /                    Staff/Admin — all orders (filterable)
PUT    /:id/status          Staff — update status
PUT    /:id/cod-collected   Staff — mark COD collected

GET    /                    Admin — all orders
PUT    /:id/return-action   Admin — approve/reject return
POST   /:id/refund          Admin — trigger refund
```

### Prescriptions (`/api/prescriptions`)
```
POST   /upload              Customer — upload prescription
GET    /my-prescriptions    Customer — saved prescriptions

GET    /pending             Staff — pending approval queue
PUT    /:id/approve         Staff — approve
PUT    /:id/reject          Staff — reject with reason
PUT    /:id/request-reupload Staff — request clearer image
```

### Payments (`/api/payments`)
```
POST   /create-order        Customer — create Razorpay order
POST   /verify              Customer — verify payment signature
POST   /webhook             Razorpay — webhook handler (no auth)
POST   /retry/:orderId      Customer — retry failed payment
POST   /refund/:orderId     Admin — initiate refund
```

### Coupons (`/api/coupons`)
```
POST   /validate            Customer — validate coupon code
GET    /                    Admin — list all coupons
POST   /                    Admin — create coupon
PUT    /:id                 Admin — update coupon
DELETE /:id                 Admin — delete coupon
```

### Users (`/api/users`)
```
GET    /profile             Customer — get own profile
PUT    /profile             Customer — update profile
POST   /addresses           Customer — add address
PUT    /addresses/:id       Customer — update address
DELETE /addresses/:id       Customer — delete address
DELETE /account             Customer — soft delete own account
```

### Admin (`/api/admin`)
```
GET    /users               Admin — list all users
PUT    /users/:id/status    Admin — activate/suspend user
GET    /staff               Admin — list staff
POST   /staff               Admin — create staff account
PUT    /staff/:id/permissions Admin — update staff permissions
DELETE /staff/:id           Admin — deactivate staff

GET    /analytics/summary   Admin — dashboard metrics
GET    /analytics/revenue   Admin — revenue chart data
GET    /analytics/products  Admin — top products
GET    /reports/sales       Admin — sales report
GET    /reports/export      Admin — export CSV/PDF

GET    /audit-logs          Admin — view audit logs

GET    /settings            Admin — get store settings
PUT    /settings            Admin — update settings (delivery charges, pin codes, hours)
```

### Notifications (`/api/notifications`)
```
GET    /                    All auth — get notifications (paginated)
PUT    /:id/read            All auth — mark as read
PUT    /read-all            All auth — mark all as read
GET    /unread-count        All auth — badge count
```

---

## Role & Permission Matrix

| Feature | Customer | Staff (default) | Staff (with permission) | Admin |
|---|---|---|---|---|
| Browse products | Yes | Yes | Yes | Yes |
| Place orders | Yes | Yes | Yes | Yes |
| View own orders | Yes | Yes | Yes | Yes |
| Manage all orders | No | Yes (manageOrders) | Yes | Yes |
| Verify prescriptions | No | Yes (verifyPrescriptions) | Yes | Yes |
| View inventory | No | Yes (manageInventory) | Yes | Yes |
| Update stock | No | Yes (manageInventory) | Yes | Yes |
| View expiry page | No | Yes | Yes | Yes |
| Mark product disposed | No | No | No | Yes |
| Add/edit products | No | No | Yes (manageProducts) | Yes |
| Bulk CSV import | No | No | No | Yes |
| View analytics | No | No | Yes (viewReports) | Yes |
| Export reports | No | No | No | Yes |
| Create staff accounts | No | No | No | Yes |
| Manage coupons | No | No | No | Yes |
| Process refunds | No | No | No | Yes |
| Store settings | No | No | No | Yes |
| View audit logs | No | No | No | Yes |
| Maintenance mode | No | No | No | Yes |

---

## Medicine Classification & Approval Rules

```
OTC  → No approval needed → Direct to checkout
H1   → No approval needed → Direct to checkout (per client decision)
H    → Staff approval required → Prescription mandatory → Hold order pending review
NRX  → Staff approval required → Prescription mandatory → Hold order pending review
```

**Display rules for customers:**
- OTC products: no badge
- H1 products: "Schedule H1" badge (informational only, no gate)
- H products: "Prescription Required" badge + warning at cart
- NRX products: "Store Approval Required" badge + warning at cart

**Staff review page fields:**
- Prescription image (zoomable)
- Patient name from order
- List of H/NRX medicines ordered
- Approve button (with optional note)
- Reject button (reason required)
- Request re-upload button (reason required)

---

## Expiry Management Rules

| Days to expiry | isHidden | Customer sees | Admin sees | Staff sees |
|---|---|---|---|---|
| > 90 days | false | Normal product | Normal | Normal |
| 31–90 days | false | Product + "Expiring Soon" badge | Warning badge | Warning badge |
| 1–30 days | true (auto) | Hidden | In expiry page (Near Expiry tab) | In expiry page |
| Past expiry | true (auto) | Hidden | In expiry page (Expired tab) | In expiry page |

- Cron job runs daily at 00:00 IST to update `isHidden` flags
- Admin can manually override `isHidden` with a note (visible in audit log)
- Admin can mark product as "disposed" (sets `isActive: false`, removes from expiry page)

---

## Order Lifecycle

```
[Customer places order]
        │
        ▼
[Stock reserved immediately]
        │
        ▼
   [Has H/NRX items?]
    Yes         No
     │           │
     ▼           ▼
[pending_payment] [pending_payment]
     │           │
  [Pay]       [Pay]
     │           │
     ▼           ▼
[pending_approval] [confirmed] ──────────────────┐
     │                                           │
  [Staff reviews]                                │
  Approve → [confirmed]                          │
  Reject  → [cancelled] → auto-refund            │
  48hr timeout → [cancelled] → auto-refund       │
                                                 │
                               [confirmed] ──────┘
                                    │
                                    ▼
                               [processing]
                                    │
                                    ▼
                                [packed]
                                    │
                                    ▼
                                [shipped]
                                    │
                                    ▼
                               [delivered]
                                    │
                          [Optional: return_requested]
```

**Payment failure path:**
- Order stays as `payment_failed`
- Customer can retry within 30 minutes
- After 30 minutes: auto-cancel, stock released

---

## CSV Import Specification

### Downloadable template columns
```
name* | brand* | manufacturer | composition | category* | form* | dosage |
mrp* | sellingPrice* | rxType* | stock* | expiryDate | batchNumber |
hsnCode | gstRate* | rackLocation | description | sideEffects | storageInstructions
```
`*` = required fields

### rxType valid values
`OTC`, `H`, `NRX`, `H1`

### category valid values
`Tablets & Capsules`, `Syrups & Liquids`, `Injections`, `Surgical & Devices`,
`Vitamins & Supplements`, `Baby Care`, `Personal Care`, `Ayurvedic & Herbal`

### form valid values
`TAB`, `CAP`, `SYP`, `INH`, `GEL`, `CREAM`, `DROP`, `INJ`, `POWDER`, `OTHER`
(also auto-detected from product name suffix)

### Date format
`MM/YYYY` (e.g. `06/2026`)

### Import behavior
1. Parse CSV on backend
2. Show preview: first 10 rows, total count, new count, update count, error count
3. Admin confirms
4. Valid rows: import/update
5. Invalid rows: skip, include in error report
6. Error report: downloadable CSV with row number, column, error message
7. Match key: `name` (case-insensitive) + `brand` (case-insensitive)
8. On match: update price, stock, expiry, batch — preserve images, description, substitutes

---

## GST & Invoice Rules

**Pharmacy GSTIN:** 09ACPPL2448G1ZB  
**State:** Uttar Pradesh (state code 09)

Since this is an intra-state sale (UP → UP customers):
- GST = CGST + SGST (split equally)
- Example: 12% GST = 6% CGST + 6% SGST

Invoice must include:
- Sequential invoice number (PM-INV-YYYY-XXXXX)
- Invoice date
- Pharmacy name, address, GSTIN
- Customer name, delivery address, phone
- Order number reference
- Table: Product name | HSN Code | Qty | MRP | Discount | Taxable Value | GST% | CGST | SGST | Total
- Summary: Subtotal, Total Discount, Total Taxable Value, Total CGST, Total SGST, Grand Total
- Payment method
- Disclaimer: "Medicines sold against valid prescription only where required"
- "Computer generated invoice — no signature required"

---

## Notification Events

### Email templates needed
1. Welcome email (signup)
2. Email verification OTP
3. Password reset
4. Order placed confirmation
5. Prescription approval required (to customer)
6. Prescription approved
7. Prescription rejected (with reason)
8. Prescription re-upload requested
9. Order confirmed
10. Order shipped
11. Order delivered (with invoice attached)
12. Order cancelled (with refund info if applicable)
13. Return request received
14. Refund processed
15. Staff invite email (with temp password)
16. New prescription order alert (to staff)
17. Low stock alert (to admin/staff)
18. Daily summary report (to admin)

### SMS templates needed (keep under 160 chars)
1. OTP: `Your OTP for Pankaj Medical is {otp}. Valid for 10 minutes. Do not share.`
2. Order pending: `Hi {name}, your order #{orderNo} is pending prescription approval. We'll notify you soon. -Pankaj Medical`
3. Prescription approved: `Hi {name}, prescription approved. Order #{orderNo} is confirmed and being processed. -Pankaj Medical`
4. Prescription rejected: `Hi {name}, prescription for order #{orderNo} was rejected. Refund initiated in 24hrs. -Pankaj Medical`
5. Order shipped: `Hi {name}, order #{orderNo} has been shipped. Expected by {date}. -Pankaj Medical`
6. Pickup ready: `Hi {name}, your order #{orderNo} is ready for pickup at our store. -Pankaj Medical`

---

## Security Rules

- **Rate limiting:** 5 login attempts per IP per 15 minutes (express-rate-limit)
- **Helmet.js:** XSS, clickjacking, MIME sniffing protection
- **CORS:** Whitelist production domain only (`https://pankajmedical.in` or Vercel URL)
- **Prescription images:** Always Cloudinary private folder, always signed URLs with 1-hour expiry
- **Input validation:** Joi/Zod on all POST/PUT endpoints
- **MongoDB:** Mongoose sanitize-html to prevent NoSQL injection
- **Razorpay webhooks:** Verify `x-razorpay-signature` header on every webhook
- **JWT:** httpOnly cookies for refresh token, Authorization header for access token
- **Passwords:** bcrypt with salt rounds 12
- **Admin destructive actions:** Require current password confirmation
- **Environment variables:** Never in Git, always in .env files (gitignored)
- **Audit logging:** All admin + staff data modifications logged

---

## Deferred Features (Do Not Build Now)

These are confirmed for later phases. Do not include any stub code or placeholders.

- WhatsApp Business API notifications
- Loyalty points / rewards system
- Wallet / store credit
- Delivery agent management system
- Supplier / purchase order management
- Partial order fulfilment
- Blog / health articles CMS
- "Frequently bought together" ML suggestions
- React Native mobile app
- Google Play Store / App Store publishing
- Multi-branch support
- Delivery slot scheduling by customer
- Barcode scanner for inventory
- AI prescription reading / OCR
- Full drug interaction database
- Super admin role above admin

---

## Important Notes for Development

1. **Build iteratively.** Each phase must be fully functional before starting the next. Phase 1 must have working auth before Phase 2 starts.

2. **Mobile-first.** The majority of customers will use mobile browsers. Every page must be fully responsive. Test on 375px width minimum.

3. **No TypeScript.** Use plain JavaScript (ES6+) throughout to keep development speed high. Add TypeScript in a future refactor if the team grows.

4. **Monorepo.** Keep `/client` and `/server` in the same Git repository. Use root-level `package.json` scripts to run both.

5. **Error handling.** Every API endpoint must return consistent error format:
   ```js
   { success: false, message: "Human readable message", code: "ERROR_CODE" }
   ```

6. **Consistent API response format:**
   ```js
   { success: true, data: {...}, message: "Optional message", pagination: {...} }
   ```

7. **Stock consistency.** Stock reservation and release must be atomic operations. Use MongoDB transactions where multiple documents are updated together.

8. **Prescription privacy.** Prescription images are medical documents. They must NEVER be stored as public Cloudinary URLs. Always use signed URLs with short expiry.

9. **Order number format.** Human-readable: `PM-2024-00142` (PM prefix, year, 5-digit sequential number).

10. **Testing.** Write at minimum: auth flow tests, order placement test, prescription approval test, stock reservation test before each phase delivery.
