# Antigravity Recovery Prompt — Pankaj Medical and General Stores

> **Situation:** The previous agent chat was accidentally deleted. The full project folder structure and all code written in Phase 1 is still intact on disk at `D:\PANKAJ MEDICAL AND GENRAL STORES`. This prompt gives you everything you need to recover context and continue.
>
> **Do this in order: Fix the 4 errors first, then read the full context below.**

---

## PART 1 — Fix These 4 Errors Immediately

When `npm run dev` was run from the project root, 4 errors appeared. Fix all of them before doing anything else.

---

### Error 1 — MongoDB URI is undefined (CRITICAL — fix this first)

**Error message:**
```
MongoDB Connection Error: The `uri` parameter to `openUri()` must be a string,
got "undefined".
```

**Cause:** The server is looking for a plain `.env` file but only `.env.development` exists. `dotenv.config()` without a path argument reads `.env` by default, not `.env.development`.

**Fix — two things:**

**Step A:** Create a new file `server/.env` (plain, no suffix) and paste this inside it:

```
MONGO_URI=mongodb+srv://ekanshlamba6226_db_user:YOUR_NEW_PASSWORD@pankaj-medical.mxr6zfl.mongodb.net/pankaj-medical-db?retryWrites=true&w=majority&appName=pankaj-medical
PORT=5000
NODE_ENV=development
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=your_admin_email_here
```

Replace `YOUR_NEW_PASSWORD` with the actual MongoDB Atlas password. Copy all other variables from `server/.env.development` into this file as well.

**Step B:** Also update `server/index.js` — change the dotenv line at the top from:
```js
require('dotenv').config()
```
to:
```js
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
})
```
This makes both `.env` and `.env.development` work correctly depending on environment.

> **Security note:** The MongoDB password was accidentally shared publicly. The user must go to MongoDB Atlas → Database Access → Edit user → Autogenerate new password, and update the new password in `server/.env` before running the server.

---

### Error 2 — Firebase Admin SDK Invalid PEM Private Key

**Error message:**
```
Firebase Admin SDK initialization error: Failed to parse private key:
Error: Invalid PEM formatted message.
```

**Cause:** The `FIREBASE_PRIVATE_KEY` in the `.env` file has escaped `\n` characters that are not being converted to actual newlines, which breaks PEM parsing.

**Fix — two things:**

**Step A:** In `server/.env` (and `server/.env.development`), wrap the private key in double quotes:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABCDEFG...\n-----END PRIVATE KEY-----\n"
```

**Step B:** In `server/config/firebase.js`, make sure the private key is parsed correctly:
```js
privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
```

If Firebase credentials have not been set up yet and the key is still a placeholder, temporarily wrap the entire Firebase init in a try-catch with a console warning so the server does not crash:
```js
try {
  admin.initializeApp({
    credential: admin.credential.cert({ ... })
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.warn('Firebase Admin SDK initialization skipped — check credentials:', error.message);
}
```
This allows the server to start and MongoDB to connect even without Firebase credentials ready.

---

### Error 3 — Frontend: signInWithPopup not exported from firebase.js

**Error message:**
```
No matching export in "src/services/firebase.js" for import "signInWithPopup"
X [ERROR] at src/pages/auth/Login.jsx:7:2
```

**Cause:** `Login.jsx` imports `signInWithPopup` from `client/src/services/firebase.js` but that file does not re-export it.

**Fix:** Open `client/src/services/firebase.js` and add the missing exports:
```js
export {
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut
} from 'firebase/auth';
```

Alternatively, change the import in `Login.jsx` to import directly from the Firebase package:
```js
import { signInWithPopup, signInWithPhoneNumber } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
```
Either approach works — pick whichever is cleaner given how `firebase.js` is currently structured.

---

### Error 4 — Tailwind CSS: shadow-xs class does not exist

**Error message:**
```
[postcss] The `shadow-xs` class does not exist.
at client/src/index.css:25:3
```

**Cause:** `shadow-xs` is a Tailwind CSS v4 utility class. This project uses Tailwind v3 where the equivalent class is `shadow-sm`.

**Fix:** Open `client/src/index.css` and search for every occurrence of `shadow-xs`. Replace all of them with `shadow-sm`:
```css
/* Before */
@apply ... shadow-xs ...

/* After */
@apply ... shadow-sm ...
```
Search the entire file — there may be multiple occurrences across different custom component classes.

---

### Verification after fixes

After applying all 4 fixes, run `npm run dev` from the root. You should see:

```
[0] MongoDB connected: pankaj-medical.mxr6zfl.mongodb.net
[0] Server successfully started in development mode on port 5000
[1] VITE v5.x.x  ready in xxxx ms
[1]   ➜  Local: http://localhost:5173/
```

Visit `http://localhost:5000/health` — should return `{ "status": "ok", "timestamp": "..." }`.

---

## PART 2 — Full Project Context

Now that errors are fixed, here is the complete context of the project so you can continue without the previous chat history.

---

## Project Overview

**Store name:** PANKAJ MEDICAL AND GENERAL STORES  
**Address:** 133/17 M Block, Kidwainagar, Kanpur Nagar  
**GSTIN:** 09ACPPL2448G1ZB  
**Project type:** Full-stack pharmacy e-commerce web application  
**Build method:** Iterative phases — each phase delivers a working prototype before the next begins

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (M0 free cluster named `pankaj-medical`) |
| Auth | Firebase Authentication (Google OAuth + Phone OTP) |
| File storage | Cloudinary (Phase 3) |
| Payments | Razorpay (Phase 4) |
| SMS | MSG91 / Firebase (Phase 4) |
| Email | Nodemailer + Gmail SMTP |
| Styling | Tailwind CSS (v3) |
| State | Zustand |
| HTTP | Axios |
| Language | JavaScript only — no TypeScript |
| Linting | ESLint + Prettier |

---

## Monorepo Structure (already built — do not recreate)

```
D:\PANKAJ MEDICAL AND GENRAL STORES\
├── client/
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   ├── src/
│   │   ├── components/common/ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── public/   (Home.jsx, About.jsx, Contact.jsx)
│   │   │   ├── auth/     (Login.jsx, Signup.jsx, ForgotPassword.jsx, OtpVerify.jsx)
│   │   │   ├── customer/ (CustomerDashboard.jsx)
│   │   │   ├── staff/    (StaffDashboard.jsx)
│   │   │   └── admin/    (AdminDashboard.jsx)
│   │   ├── services/     (api.js, firebase.js)
│   │   ├── store/        (authStore.js)
│   │   └── App.jsx
│   ├── .env.development
│   └── package.json
├── server/
│   ├── config/           (db.js, firebase.js, cloudinary.js)
│   ├── models/           (User.js, Product.js, Order.js, Prescription.js,
│   │                      Cart.js, Coupon.js, Notification.js, AuditLog.js)
│   ├── middleware/        (auth.middleware.js, role.middleware.js,
│   │                      permission.middleware.js, rateLimit.middleware.js,
│   │                      auth.validator.js)
│   ├── controllers/      (auth.controller.js, user.controller.js)
│   ├── routes/           (auth.routes.js, user.routes.js + skeleton routes
│   │                      for product, order, prescription, payment,
│   │                      cart, admin, staff, notification)
│   ├── services/         (email.service.js)
│   ├── utils/            (jwt.js)
│   ├── .env.development
│   ├── .env              (needs to be created — see Error 1 fix above)
│   └── index.js
├── .gitignore
├── README.md
└── package.json          (root — monorepo with workspaces)
```

---

## What Phase 1 Built (already complete)

Everything below was built and is on disk. Do not rebuild any of it — only fix the 4 errors above.

### Backend
- MongoDB Atlas connection with auto-reconnect (`db.js`)
- Firebase Admin SDK init with service account (`firebase.js`)
- Cloudinary config skeleton ready for Phase 3 (`cloudinary.js`)
- Full User schema with: soft delete + PII anonymization, staff permission toggles, saved addresses, bcrypt 12 salt rounds pre-save hook, firebaseUid, authProviders
- Placeholder schemas for all other collections: Product, Order, Prescription, Cart, Coupon, Notification, AuditLog
- Zod validation on all auth request bodies (`auth.validator.js`)
- Rate limiting: 5 attempts per 15 minutes on auth routes (`rateLimit.middleware.js`)
- JWT middleware: verifies access token, checks user is active and not deleted (`auth.middleware.js`)
- Role guard: `requireRole(['admin'])` (`role.middleware.js`)
- Staff permission guard: `checkStaffPermission('verifyPrescriptions')` (`permission.middleware.js`)
- Dual-token JWT: access token (15 min) in response body, refresh token (7d/30d) in httpOnly + secure + sameSite:strict cookie (`jwt.js`)
- All auth routes implemented: signup, verify-email, login, google, phone/verify-otp, refresh, logout, forgot-password, reset-password
- `/phone/send-otp` route intentionally NOT built (Firebase handles OTP client-side)
- Nodemailer email service with flat teal/white HTML templates for: email verification, password reset, welcome email; dev fallback logs to console
- Soft delete with PII anonymization: `DELETE /api/users/account`
- All skeleton routes return `{ success: false, message: "Not yet implemented" }` as JSON (not HTML 404)
- `GET /health` returns `{ status: "ok", timestamp }` for UptimeRobot
- Helmet.js + CORS whitelisting + cookie-parser in index.js
- Consistent API response format enforced:
  - Success: `{ success: true, data: {}, message: "" }`
  - Error: `{ success: false, message: "", code: "ERROR_CODE" }`

### Frontend
- React 18 + Vite + Tailwind CSS v3 (flat teal/white theme — no glassmorphism, no blur effects)
- Zustand authStore: user, role, accessToken, isAuthenticated, isLoading
- Axios instance with interceptors: attaches JWT to Authorization header, auto-refreshes on 401
- Firebase client config: GoogleAuthProvider, RecaptchaVerifier
- ProtectedRoute component: unauthenticated → `/login`, wrong role → own dashboard (customer → `/customer/dashboard`, staff → `/staff/dashboard`, admin → `/admin/dashboard`)
- All 3 dashboard shells (empty with welcome message, role-guarded)
- Public pages: Home, About Us (with pharmacy name, address, GSTIN hardcoded — license number and pharmacist name left as `[TO BE FILLED]`), Contact Us
- Auth pages: Login (email, Google, OTP), Signup, ForgotPassword, OtpVerify
- PWA: manifest.json + sw.js (service worker caching static assets)
- ESLint + Prettier configured on both /client and /server

### Admin seeding
- Only the email in `ADMIN_EMAIL` env variable gets role: 'admin' on first registration
- All other self-registrations default to role: 'customer'
- Staff accounts are created by admin only via invite — not self-registration

---

## Role System

| Role | Created by | Permissions |
|---|---|---|
| `customer` | Self-registration | Browse, order, track own orders |
| `staff` | Admin only (invite email with temp password) | Granular toggles per staff member |
| `admin` | ADMIN_EMAIL env var seeding | Full access to everything |

### Staff permission toggles (stored in User document)
```js
permissions: {
  manageOrders: Boolean,
  verifyPrescriptions: Boolean,
  manageInventory: Boolean,
  viewReports: Boolean,
  manageProducts: Boolean
}
```

---

## Medicine Classification (critical business rule)

Every product has an `rxType` field. The approval rules are:

| rxType | Meaning | Requires staff approval? |
|---|---|---|
| `OTC` | Over the counter | No — direct checkout |
| `H1` | Schedule H1 | No — direct checkout (client decision) |
| `H` | Schedule H prescription | Yes — staff approval + prescription upload |
| `NRX` | Non-prescription but store approval needed | Yes — staff approval + prescription upload |

**Only H and NRX require prescription upload and staff approval. OTC and H1 go straight to checkout.**

---

## Current Status

- Phase 1 is complete but has 4 startup errors (fixed above)
- Phase 1 has NOT been fully tested end-to-end yet because the server crashes on startup
- Once the 4 errors are fixed and `npm run dev` runs cleanly, Phase 1 needs to be verified:

### Phase 1 verification checklist (run after fixing errors)
- [ ] `http://localhost:5000/health` returns `{ status: "ok" }`
- [ ] Register with email/password → user appears in MongoDB Atlas with role: customer
- [ ] Register with ADMIN_EMAIL → user appears with role: admin
- [ ] Email verification link works → `isVerified: true` in MongoDB
- [ ] Login with email/password → JWT returned, refreshToken cookie set
- [ ] Google OAuth login → account created or merged if email exists
- [ ] Phone OTP login → Firebase OTP received, verify → JWT issued
- [ ] Visit `/admin/dashboard` as customer → redirected to `/customer/dashboard`
- [ ] Visit `/staff/dashboard` as customer → redirected to `/customer/dashboard`
- [ ] 6 failed login attempts → rate limiting blocks further attempts
- [ ] Soft delete account → PII anonymized in MongoDB, cookie cleared
- [ ] All skeleton routes return JSON, not HTML 404

---

## What to Build Next — Phase 2

Once Phase 1 errors are fixed and verification passes, proceed to Phase 2.

**Phase 2 scope: Product Catalogue & Inventory**

### Backend
- Full Product model (already has placeholder — expand it with all fields)
- Product fields: name, slug, brand, manufacturer, composition, category, form, dosage, mrp, sellingPrice, discount, rxType (OTC/H/NRX/H1), stock, lowStockThreshold (default 10), expiryDate, batchNumber, hsnCode, gstRate (5/12/18), images (max 3 Cloudinary URLs), description, sideEffects, storageInstructions, rackLocation, isActive, isHidden, substitutes (refs to other products), tags, createdBy
- MongoDB text index on: name, composition, brand, tags
- All product CRUD APIs (public GET, admin-only POST/PUT/DELETE)
- Search API with text index + debounced auto-suggest
- Filter API: category, price range, brand, rxType, inStock
- OpenFDA API integration for composition auto-fill when admin types medicine name
- Bulk CSV import: preview (first 10 rows + counts), confirm, import, skip invalid rows, downloadable error report
- Match existing products by name + brand (case-insensitive) on re-import — update price/stock/expiry, preserve images
- Downloadable CSV template endpoint
- Expiry management: daily cron job at midnight IST updates isHidden flag
  - Past expiry → isHidden: true
  - Within 30 days → isHidden: true
  - 31–90 days → isHidden: false but flagged
- Low stock alert trigger when stock <= lowStockThreshold (sends to admin + staff with manageInventory permission)
- Substitute linking: products with same composition auto-suggested, admin manually confirms links

### Frontend
- Public product listing page (no login required — for SEO)
- Product detail page (public)
- Search bar with auto-suggest dropdown (300ms debounce)
- Filter sidebar: category, price range, brand, Rx type, in-stock toggle
- "Substitute available" message when product is out of stock
- "Expiring Soon" badge on products 31–90 days from expiry (visible to customers)
- Admin: add product form with OpenFDA auto-fill on name input
- Admin: edit/delete product
- Admin: bulk CSV import page with drag-drop upload, preview table, confirm button, error report download
- Admin: downloadable CSV template button
- Staff + Admin: expiry management page at `/staff/expiry` and `/admin/expiry`
  - Three tabs: Expired | Near Expiry (within 30 days) | Expiring Soon (31–90 days)
  - Each product shows: name, batch number, expiry date, stock quantity, days remaining
  - Admin actions: mark disposed, override visibility
  - Staff: view only, no actions

### Categories (8 default, admin can add more)
Tablets & Capsules, Syrups & Liquids, Injections, Surgical & Devices, Vitamins & Supplements, Baby Care, Personal Care, Ayurvedic & Herbal

### CSV template columns
```
name*, brand*, manufacturer, composition, category*, form*, dosage,
mrp*, sellingPrice*, rxType*, stock*, expiryDate, batchNumber,
hsnCode, gstRate*, rackLocation, description, sideEffects, storageInstructions
```
`*` = required. rxType valid values: OTC, H, NRX, H1. Date format: MM/YYYY.

---

## Important Rules (apply to all phases)

1. **JavaScript only** — no TypeScript anywhere
2. **Mobile-first** — every page must work at 375px minimum width
3. **Flat teal/white UI** — no glassmorphism, no blur, no heavy shadows
4. **Consistent API responses** — every endpoint must use the format defined above
5. **Prescription images** — always Cloudinary private folder, always signed URLs, never public (Phase 3)
6. **Stock operations** — reservation and release must be atomic (MongoDB transactions)
7. **bcrypt** — always 12 salt rounds, never 10
8. **Skeleton routes** — always return JSON, never Express default HTML
9. **Environment variables** — never hardcoded, always from .env files
10. **Build iteratively** — complete and verify Phase 2 fully before starting Phase 3

---

## Deferred — Do Not Build in Any Current Phase

WhatsApp notifications, loyalty points, wallet/store credit, delivery agent management, supplier/purchase order management, partial order fulfilment, blog/CMS, "frequently bought together", React Native app, Play Store, multi-branch support, delivery slot scheduling, barcode scanner, AI prescription reading, full drug interaction database, super admin role.
