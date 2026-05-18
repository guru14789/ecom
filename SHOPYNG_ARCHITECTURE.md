# SHOPYNG — Complete System Architecture
> Group-Buying Social Commerce Platform | MERN Stack | AWS | Production-Ready

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Folder Structure](#4-folder-structure)
5. [Database Schema (MongoDB)](#5-database-schema-mongodb)
6. [API Architecture](#6-api-architecture)
7. [All Pages & Views](#7-all-pages--views)
8. [Group Buying Flow — Core Logic](#8-group-buying-flow--core-logic)
9. [Escrow Payment System](#9-escrow-payment-system)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [AWS Infrastructure](#11-aws-infrastructure)
12. [Third-Party Integrations](#12-third-party-integrations)
13. [Real-Time System (Socket.IO)](#13-real-time-system-socketio)
14. [Notification System](#14-notification-system)
15. [Security Architecture](#15-security-architecture)
16. [Environment Variables](#16-environment-variables)
17. [Deployment Pipeline](#17-deployment-pipeline)
18. [Mock Data Strategy](#18-mock-data-strategy)

---

## 1. Project Overview

**Shopyng** is a subscription-based, group-buying social commerce marketplace with:
- No commission model (sellers pay flat subscription)
- Group buying discount system (dynamic pricing unlocked when group fills)
- Escrow payment with early release on delivery confirmation
- Social viral sharing to grow groups
- Three portals: **Buyer App**, **Vendor Panel**, **Admin Panel**

### Key Concepts
| Concept | Description |
|---|---|
| Individual Price | Standard single-buyer price |
| Group Price | Discounted price unlocked when N members join (set by vendor) |
| Group Session | A timed group buy event (e.g., 24h window, 5 slots) |
| Escrow | Payment held until delivery confirmed; auto-released in 5 days |
| Vendor Subscription | Sellers pay monthly/yearly; no per-sale commission |

---

## 2. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| State Management | Redux Toolkit + RTK Query |
| UI Library | Tailwind CSS + shadcn/ui |
| Real-time | Socket.IO Client |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Animation | Framer Motion |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 4 |
| Database | MongoDB Atlas (AWS-hosted) |
| ODM | Mongoose 8 |
| Auth | JWT (Access + Refresh tokens) |
| Real-time | Socket.IO |
| Queue | Bull (Redis-backed) |
| File Storage | AWS S3 |
| Cache | AWS ElastiCache (Redis) |
| Email | AWS SES |
| SMS/Push | Firebase Cloud Messaging |

### AWS Infrastructure
| Service | Purpose |
|---|---|
| EC2 (or ECS Fargate) | API server hosting |
| S3 | Product images, invoices, documents |
| CloudFront | CDN for static assets |
| ElastiCache (Redis) | Session cache, queues, pub/sub |
| DocumentDB / MongoDB Atlas | Primary database |
| SES | Transactional emails |
| SNS | Push/SMS notifications |
| Route 53 | DNS |
| ACM | SSL certificates |
| ALB | Load balancer |
| CloudWatch | Logging & monitoring |
| Secrets Manager | API keys & credentials |

---

## 3. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS (React Apps)                         │
│   ┌─────────────┐   ┌──────────────────┐   ┌───────────────────┐   │
│   │  Buyer App  │   │   Vendor Panel   │   │   Admin Panel     │   │
│   │ (Port 3000) │   │   (Port 3001)    │   │   (Port 3002)     │   │
│   └──────┬──────┘   └────────┬─────────┘   └────────┬──────────┘   │
└──────────┼───────────────────┼──────────────────────┼──────────────┘
           │                   │                      │
           └───────────────────┼──────────────────────┘
                               │ HTTPS / WSS
                    ┌──────────▼──────────┐
                    │   AWS ALB (HTTPS)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Express API Server  │
                    │    (Node.js 20)      │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │  REST API v1   │  │
                    │  ├────────────────┤  │
                    │  │  Socket.IO     │  │
                    │  ├────────────────┤  │
                    │  │  Bull Queues   │  │
                    │  └────────────────┘  │
                    └──┬───────────────┬───┘
                       │               │
          ┌────────────▼──┐    ┌───────▼────────────┐
          │  MongoDB Atlas │    │  AWS ElastiCache   │
          │  (Primary DB)  │    │  (Redis Cache +    │
          │                │    │   Bull Queues)     │
          └────────────────┘    └────────────────────┘
                       │
          ┌────────────▼────────────────────────────┐
          │            AWS Services                  │
          │  S3 (Files)  │  SES (Email)  │  SNS     │
          └─────────────────────────────────────────┘
                       │
          ┌────────────▼────────────────────────────┐
          │        Third-Party APIs                  │
          │  Razorpay (Payments)  │  Delhivery       │
          └─────────────────────────────────────────┘
```

---

## 4. Folder Structure

```
shopyng/
├── packages/
│   ├── buyer-app/                    # React app for customers
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Reusable UI (Button, Card, Modal...)
│   │   │   │   ├── layout/           # Header, Footer, BottomNav
│   │   │   │   └── shared/           # ProductCard, GroupTimer, PriceTag
│   │   │   ├── pages/
│   │   │   │   ├── auth/             # Login, Register, OTP
│   │   │   │   ├── home/             # Home, Discovery, Categories
│   │   │   │   ├── product/          # ProductList, ProductDetail
│   │   │   │   ├── group/            # GroupPage, GroupJoin, GroupCreate
│   │   │   │   ├── cart/             # Cart, Checkout
│   │   │   │   ├── orders/           # OrderList, OrderDetail, Tracking
│   │   │   │   ├── profile/          # Profile, Wallet, Wishlist
│   │   │   │   └── notifications/    # Notifications
│   │   │   ├── store/                # Redux slices
│   │   │   ├── hooks/                # Custom hooks
│   │   │   ├── services/             # API calls (RTK Query)
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── vendor-panel/                 # React app for vendors
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── auth/             # Login, Register, KYC
│   │   │   │   ├── dashboard/        # Overview, Analytics
│   │   │   │   ├── products/         # ProductList, AddProduct, EditProduct
│   │   │   │   ├── groups/           # GroupSettings, ActiveGroups
│   │   │   │   ├── orders/           # OrderList, OrderDetail, Shipping
│   │   │   │   ├── wallet/           # Earnings, Withdraw, History
│   │   │   │   ├── subscription/     # Plans, Billing
│   │   │   │   └── profile/          # Store Profile, Settings
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── admin-panel/                  # React app for admins
│       ├── src/
│       │   ├── pages/
│       │   │   ├── auth/             # Admin Login
│       │   │   ├── dashboard/        # Platform Overview
│       │   │   ├── vendors/          # Vendor Management, KYC Review
│       │   │   ├── products/         # Product Approval Queue
│       │   │   ├── orders/           # All Orders, Disputes
│       │   │   ├── groups/           # All Group Sessions
│       │   │   ├── payments/         # Escrow, Payouts, Refunds
│       │   │   ├── subscriptions/    # Plans Management
│       │   │   ├── users/            # User Management
│       │   │   ├── reviews/          # Review Moderation
│       │   │   └── settings/         # Platform Settings
│       │   └── ...
│       └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB connection
│   │   │   ├── redis.js              # Redis connection
│   │   │   ├── s3.js                 # AWS S3 config
│   │   │   └── socket.js             # Socket.IO setup
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Vendor.js
│   │   │   ├── Product.js
│   │   │   ├── GroupSession.js
│   │   │   ├── GroupMember.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── EscrowWallet.js
│   │   │   ├── UserWallet.js
│   │   │   ├── VendorWallet.js
│   │   │   ├── Subscription.js
│   │   │   ├── SubscriptionPlan.js
│   │   │   ├── Notification.js
│   │   │   ├── Review.js
│   │   │   ├── Category.js
│   │   │   └── ShippingLabel.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── vendor.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── group.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── wallet.routes.js
│   │   │   ├── subscription.routes.js
│   │   │   ├── notification.routes.js
│   │   │   ├── review.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── shipping.routes.js
│   │   ├── controllers/              # Route handlers (thin)
│   │   ├── services/                 # Business logic
│   │   │   ├── GroupBuyingService.js # Core group logic
│   │   │   ├── EscrowService.js      # Payment holding & release
│   │   │   ├── NotificationService.js
│   │   │   ├── ShippingService.js    # Delhivery integration
│   │   │   └── PaymentService.js     # Razorpay integration
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification
│   │   │   ├── rbac.js               # Role-based access
│   │   │   ├── rateLimiter.js
│   │   │   ├── upload.js             # Multer + S3
│   │   │   └── errorHandler.js
│   │   ├── queues/
│   │   │   ├── groupExpiry.queue.js  # Auto-cancel expired groups
│   │   │   ├── payoutRelease.queue.js # Auto-release escrow
│   │   │   └── notification.queue.js
│   │   ├── utils/
│   │   │   ├── apiResponse.js
│   │   │   ├── generateInvoice.js
│   │   │   └── mockData.js           # Seeder utilities
│   │   └── app.js
│   ├── seeds/                        # Mock data seeders
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. Database Schema (MongoDB)

### User
```js
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  passwordHash: String,
  role: { type: String, enum: ['buyer', 'vendor', 'admin'] },
  avatar: String,           // S3 URL
  isVerified: Boolean,
  isActive: Boolean,
  referralCode: String,
  referredBy: ObjectId,     // ref: User
  fcmToken: String,         // for push notifications
  addresses: [{
    label: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: Boolean
  }],
  createdAt, updatedAt
}
```

### Vendor
```js
{
  _id: ObjectId,
  userId: ObjectId,         // ref: User
  storeName: String,
  storeDescription: String,
  storeLogo: String,        // S3 URL
  gstin: String,
  panNumber: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
  kycDocuments: [{ type: String, url: String }],  // S3 URLs
  subscriptionId: ObjectId, // ref: Subscription
  isActive: Boolean,
  isSuspended: Boolean,
  rating: Number,           // aggregated
  totalReviews: Number,
  createdAt, updatedAt
}
```

### Product
```js
{
  _id: ObjectId,
  vendorId: ObjectId,       // ref: Vendor
  name: String,
  slug: String,
  description: String,
  images: [String],         // S3 URLs
  categoryId: ObjectId,     // ref: Category
  tags: [String],
  individualPrice: Number,  // ₹100
  groupPrice: Number,       // ₹80 (unlocked at minGroupSize)
  minGroupSize: Number,     // e.g., 5 members to unlock group price
  groupDurationHours: Number, // e.g., 24 hours
  stock: Number,
  sku: String,
  weight: Number,
  dimensions: { l: Number, w: Number, h: Number },
  deliveryOptions: [{ type: String, price: Number, estimatedDays: Number }],
  status: { type: String, enum: ['draft', 'pending_approval', 'active', 'rejected', 'archived'] },
  adminNote: String,
  approvedBy: ObjectId,
  approvedAt: Date,
  rating: Number,
  totalReviews: Number,
  totalSold: Number,
  isFeatured: Boolean,
  createdAt, updatedAt
}
```

### GroupSession
```js
{
  _id: ObjectId,
  productId: ObjectId,      // ref: Product
  vendorId: ObjectId,       // ref: Vendor
  createdBy: ObjectId,      // ref: User (who started the group)
  shareToken: String,       // unique token for share link
  shareUrl: String,
  minGroupSize: Number,     // e.g., 5
  maxGroupSize: Number,     // optional cap
  currentSize: Number,      // members joined so far
  individualPrice: Number,
  groupPrice: Number,
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled', 'expired']
  },
  expiresAt: Date,          // createdAt + groupDurationHours
  completedAt: Date,
  cancelledAt: Date,
  orderId: ObjectId,        // ref: Order (created when group completes)
  createdAt, updatedAt
}
```

### GroupMember
```js
{
  _id: ObjectId,
  groupSessionId: ObjectId, // ref: GroupSession
  userId: ObjectId,         // ref: User
  joinedAt: Date,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'] },
  paymentId: String,        // Razorpay payment ID
  quantity: Number,
  deliveryAddressId: ObjectId
}
```

### Order
```js
{
  _id: ObjectId,
  orderNumber: String,      // e.g., SHY-2024-001234
  userId: ObjectId,         // ref: User (buyer)
  vendorId: ObjectId,       // ref: Vendor
  groupSessionId: ObjectId, // ref: GroupSession (null for individual)
  orderType: { type: String, enum: ['individual', 'group'] },
  items: [{
    productId: ObjectId,
    name: String,
    image: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  shippingFee: Number,
  discount: Number,
  total: Number,
  priceType: { type: String, enum: ['individual', 'group'] },
  deliveryAddress: { street, city, state, pincode },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned']
  },
  paymentId: String,        // Razorpay
  paymentStatus: { type: String, enum: ['pending', 'paid', 'in_escrow', 'released', 'refunded'] },
  escrowId: ObjectId,
  trackingId: String,       // Delhivery
  shippingLabelUrl: String, // S3
  invoiceUrl: String,       // S3
  deliveredAt: Date,
  escrowReleaseDue: Date,   // deliveredAt + 5 days
  timeline: [{
    status: String,
    note: String,
    timestamp: Date
  }],
  cancelReason: String,
  returnReason: String,
  createdAt, updatedAt
}
```

### EscrowWallet
```js
{
  _id: ObjectId,
  orderId: ObjectId,
  vendorId: ObjectId,
  amount: Number,
  status: { type: String, enum: ['holding', 'released', 'refunded'] },
  heldAt: Date,
  releasedAt: Date,
  razorpayTransferId: String,
  createdAt, updatedAt
}
```

### UserWallet
```js
{
  _id: ObjectId,
  userId: ObjectId,
  balance: Number,          // in paise (₹1 = 100 paise)
  transactions: [{
    type: { type: String, enum: ['credit', 'debit'] },
    source: { type: String, enum: ['refund', 'cashback', 'referral', 'withdrawal'] },
    amount: Number,
    note: String,
    referenceId: String,
    createdAt: Date
  }],
  updatedAt
}
```

### VendorWallet
```js
{
  _id: ObjectId,
  vendorId: ObjectId,
  balance: Number,
  pendingBalance: Number,   // in escrow
  transactions: [{
    type: { type: String, enum: ['credit', 'debit'] },
    source: { type: String, enum: ['sale', 'withdrawal', 'refund_deduction'] },
    amount: Number,
    orderId: ObjectId,
    note: String,
    createdAt: Date
  }],
  withdrawalRequests: [{
    amount: Number,
    bankDetails: Object,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'] },
    requestedAt: Date,
    processedAt: Date
  }],
  updatedAt
}
```

### SubscriptionPlan
```js
{
  _id: ObjectId,
  name: String,             // Basic, Pro, Enterprise
  price: Number,
  billingCycle: { type: String, enum: ['monthly', 'yearly'] },
  features: {
    maxProducts: Number,
    maxGroupSessions: Number,
    analyticsAccess: Boolean,
    prioritySupport: Boolean,
    bulkUpload: Boolean
  },
  isActive: Boolean,
  createdAt, updatedAt
}
```

### Subscription
```js
{
  _id: ObjectId,
  vendorId: ObjectId,
  planId: ObjectId,
  status: { type: String, enum: ['active', 'expired', 'cancelled'] },
  startDate: Date,
  endDate: Date,
  razorpaySubscriptionId: String,
  autoRenew: Boolean,
  createdAt, updatedAt
}
```

### Review
```js
{
  _id: ObjectId,
  productId: ObjectId,
  vendorId: ObjectId,
  userId: ObjectId,
  orderId: ObjectId,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  images: [String],
  isApproved: Boolean,
  moderatedBy: ObjectId,
  createdAt, updatedAt
}
```

### Notification
```js
{
  _id: ObjectId,
  userId: ObjectId,
  type: String,             // 'order_update', 'group_progress', 'deal', 'system'
  title: String,
  body: String,
  data: Object,             // metadata
  isRead: Boolean,
  createdAt
}
```

---

## 6. API Architecture

### Base URL
```
https://api.shopyng.com/v1
```

### Auth Routes (`/auth`)
```
POST   /auth/register              - Buyer/Vendor registration
POST   /auth/login                 - Login (returns access + refresh token)
POST   /auth/refresh               - Refresh access token
POST   /auth/logout                - Invalidate refresh token
POST   /auth/send-otp              - Send OTP to phone/email
POST   /auth/verify-otp            - Verify OTP
POST   /auth/forgot-password       - Send reset link
POST   /auth/reset-password        - Reset with token
```

### User Routes (`/users`) — Buyer
```
GET    /users/profile              - Get my profile
PUT    /users/profile              - Update profile
POST   /users/addresses            - Add address
PUT    /users/addresses/:id        - Update address
DELETE /users/addresses/:id        - Delete address
GET    /users/wallet               - Get wallet balance & history
GET    /users/notifications        - Get notifications
PUT    /users/notifications/:id/read
GET    /users/wishlist             - Get wishlist
POST   /users/wishlist/:productId  - Add to wishlist
DELETE /users/wishlist/:productId  - Remove from wishlist
```

### Product Routes (`/products`)
```
GET    /products                   - List products (paginated, filtered, sorted)
GET    /products/:id               - Product detail
GET    /products/search            - Search products
GET    /products/categories        - Browse categories
GET    /products/featured          - Featured products
GET    /products/:id/reviews       - Product reviews
GET    /products/trending          - Trending products
GET    /products/group-deals       - Active group deals
```

### Group Routes (`/groups`)
```
POST   /groups/create              - Create group session (buyer or auto on product page)
GET    /groups/:shareToken         - Get group by share token (public)
POST   /groups/:id/join            - Join existing group
GET    /groups/:id/status          - Group status & members count
GET    /groups/active              - User's active groups
GET    /groups/history             - User's past groups
POST   /groups/:id/invite          - Generate shareable link
```

### Order Routes (`/orders`)
```
POST   /orders                     - Place order (individual or after group completes)
GET    /orders                     - My orders list
GET    /orders/:id                 - Order detail
POST   /orders/:id/cancel          - Cancel order
POST   /orders/:id/return          - Request return
GET    /orders/:id/tracking        - Live tracking (Delhivery)
GET    /orders/:id/invoice         - Download invoice (PDF from S3)
```

### Payment Routes (`/payments`)
```
POST   /payments/initiate          - Create Razorpay order
POST   /payments/verify            - Verify payment signature
POST   /payments/group-pay         - Pay for group slot
GET    /payments/history           - Payment history
POST   /payments/refund/:orderId   - Request refund
```

### Vendor Routes (`/vendor`)
```
POST   /vendor/register            - Vendor registration + KYC docs
GET    /vendor/dashboard           - Dashboard stats
GET    /vendor/products            - My products list
POST   /vendor/products            - Add product
PUT    /vendor/products/:id        - Edit product
DELETE /vendor/products/:id        - Delete product
POST   /vendor/products/bulk       - Bulk upload (CSV)
GET    /vendor/orders              - Vendor order list
PUT    /vendor/orders/:id/accept   - Accept order
PUT    /vendor/orders/:id/ship     - Mark as shipped (add tracking)
GET    /vendor/groups              - My group sessions
PUT    /vendor/groups/:id/settings - Update group settings
GET    /vendor/wallet              - Wallet balance
POST   /vendor/wallet/withdraw     - Request withdrawal
GET    /vendor/analytics           - Sales analytics
GET    /vendor/subscription        - My subscription status
POST   /vendor/subscription        - Subscribe to plan
```

### Admin Routes (`/admin`)
```
GET    /admin/dashboard            - Platform overview stats
GET    /admin/vendors              - All vendors list
PUT    /admin/vendors/:id/approve  - Approve vendor
PUT    /admin/vendors/:id/suspend  - Suspend vendor
GET    /admin/vendors/:id/kyc      - View KYC docs
GET    /admin/products/pending     - Products pending approval
PUT    /admin/products/:id/approve - Approve product
PUT    /admin/products/:id/reject  - Reject with reason
GET    /admin/orders               - All orders
GET    /admin/orders/disputes      - Disputed orders
PUT    /admin/orders/:id/resolve   - Resolve dispute
GET    /admin/groups               - All group sessions
GET    /admin/payments             - All payments
GET    /admin/escrow               - Escrow wallet overview
PUT    /admin/escrow/:id/release   - Manual escrow release
GET    /admin/subscriptions        - All subscriptions
POST   /admin/subscriptions/plans  - Create plan
PUT    /admin/subscriptions/plans/:id
DELETE /admin/subscriptions/plans/:id
GET    /admin/users                - All users
PUT    /admin/users/:id/block      - Block user
GET    /admin/reviews/pending      - Reviews pending moderation
PUT    /admin/reviews/:id/approve  - Approve review
DELETE /admin/reviews/:id          - Remove review
GET    /admin/analytics            - Platform analytics
GET    /admin/notifications/send   - Broadcast notification
```

### Shipping Routes (`/shipping`)
```
POST   /shipping/label             - Generate Delhivery shipping label
GET    /shipping/track/:awb        - Track shipment by AWB
POST   /shipping/cancel/:awb       - Cancel shipment
GET    /shipping/rates             - Calculate shipping rates
```

---

## 7. All Pages & Views

### 7.1 Buyer App Pages

#### Auth
- `/login` — Login with phone/email + OTP
- `/register` — Sign up (name, phone, email, password)
- `/verify-otp` — OTP verification screen
- `/forgot-password` — Password reset

#### Home & Discovery
- `/` (Home) — Hero banner, featured deals, trending group buys, smart recommendations, categories strip
- `/search` — Search with filters (category, price range, group price toggle, rating, sort)
- `/categories` — Browse all categories grid
- `/categories/:slug` — Category product listing with filters
- `/deals` — Active group deals marketplace

#### Product
- `/products/:id` — Product detail page:
  - Images carousel
  - Individual price vs Group price comparison
  - Group Buy CTA ("Join Group" or "Start Group")
  - Active groups list for this product
  - Reviews & rating
  - Seller info
  - Delivery estimate
  - Share buttons (WhatsApp, Facebook, Instagram, Copy Link)

#### Group
- `/groups/join/:shareToken` — Public group join page (shareable link landing)
- `/groups/:id` — Group status page:
  - Members joined counter (e.g., 3/5)
  - Timer countdown
  - Slots remaining
  - Member avatars
  - Invite friends buttons
  - Progress bar
- `/groups/active` — My active groups list
- `/groups/history` — Past groups

#### Cart & Checkout
- `/cart` — Cart page with items, quantity, price summary
- `/checkout` — Checkout:
  - Select delivery address
  - Select payment method (Razorpay / Wallet)
  - Apply offers/wallet credits
  - Order summary
  - Place Order button
- `/checkout/success` — Order confirmed screen (savings badge: "You saved ₹120 by group buying!")

#### Orders
- `/orders` — My orders list (tabs: All, Active, Delivered, Cancelled)
- `/orders/:id` — Order detail:
  - Status timeline
  - Track shipment (Delhivery)
  - Invoice download
  - Cancel / Return request
  - Rate & Review CTA (after delivery)

#### Profile
- `/profile` — User profile
- `/profile/edit` — Edit profile
- `/profile/addresses` — Manage addresses
- `/profile/wishlist` — Saved products
- `/wallet` — User wallet (balance, transaction history, referral earnings)
- `/notifications` — All notifications
- `/referral` — Referral program dashboard

---

### 7.2 Vendor Panel Pages

#### Auth & Onboarding
- `/login` — Vendor login
- `/register` — Vendor registration (store name, contact, GSTIN)
- `/kyc` — KYC document upload (PAN, Aadhaar, bank details)
- `/kyc/pending` — Waiting for admin approval screen
- `/subscription` — Choose subscription plan (Basic/Pro/Enterprise)

#### Dashboard
- `/dashboard` — Overview:
  - Revenue today / this week / this month
  - Pending orders count
  - Active groups count
  - Low stock alerts
  - Recent orders table
  - Revenue chart (last 30 days)
  - Top performing products

#### Products
- `/products` — Product list (status badges: Draft, Pending, Active, Rejected)
- `/products/add` — Add product form:
  - Basic info (name, description, category)
  - Images upload (up to 8)
  - Pricing (individual price, group price, min group size)
  - Group duration (hours)
  - Stock & SKU
  - Dimensions & weight
  - Delivery options
- `/products/:id/edit` — Edit product
- `/products/bulk-upload` — CSV bulk upload

#### Group Sessions
- `/groups` — All my group sessions (waiting, active, completed, expired)
- `/groups/:id` — Group session detail (members, timer, status)
- `/groups/settings` — Default group settings for my products

#### Orders
- `/orders` — All vendor orders (filters: status, date range)
- `/orders/:id` — Order detail:
  - Customer info
  - Product & quantity
  - Delivery address
  - Accept / Reject order
  - Update shipping (add AWB tracking)
  - Mark as packed / shipped
  - Print invoice button

#### Wallet & Finance
- `/wallet` — Earnings wallet:
  - Available balance
  - Pending (in escrow)
  - Withdrawal request form
  - Transaction history
  - Escrow timeline per order

#### Analytics
- `/analytics` — Sales analytics:
  - Revenue chart (daily/weekly/monthly)
  - Group vs Individual sales split
  - Top products by revenue
  - Order fulfillment rate
  - Customer geography map

#### Settings
- `/profile` — Store profile (name, logo, description, bank details)
- `/subscription/manage` — Current plan, billing, upgrade/downgrade
- `/notifications` — Notification preferences

---

### 7.3 Admin Panel Pages

#### Auth
- `/login` — Admin login (email + password, 2FA)

#### Dashboard
- `/dashboard` — Platform KPIs:
  - Total GMV today / MTD / YTD
  - Active group sessions
  - New vendors (pending approval)
  - Pending product approvals
  - Escrow balance total
  - Platform revenue (subscriptions)
  - Charts: orders trend, user growth, top categories

#### Vendor Management
- `/vendors` — All vendors (status: pending KYC, active, suspended)
- `/vendors/:id` — Vendor profile:
  - Store details
  - KYC documents (approve/reject buttons)
  - Subscription status
  - Order history
  - Wallet balance
  - Suspend / Activate controls

#### Product Management
- `/products` — All products list
- `/products/pending` — Approval queue (most critical)
- `/products/:id` — Product detail + Approve / Reject with note

#### Order Management
- `/orders` — All platform orders
- `/orders/disputes` — Disputed orders requiring resolution
- `/orders/:id` — Full order detail:
  - Both buyer and vendor perspectives
  - Escrow status
  - Communication thread
  - Admin actions (force cancel, escalate, release escrow)

#### Group Sessions
- `/groups` — All active / expired groups across platform
- `/groups/:id` — Group session detail + admin override options

#### Payments & Escrow
- `/payments` — All platform payments
- `/escrow` — Escrow wallet dashboard:
  - Total held amount
  - Due for release
  - Released this month
  - Manual release controls (with reason logging)
- `/payouts` — Vendor payout history

#### Subscriptions
- `/subscriptions` — All vendor subscriptions
- `/subscriptions/plans` — Manage plans (create, edit, deactivate)
- `/subscriptions/revenue` — Subscription MRR/ARR charts

#### User Management
- `/users` — All buyers list
- `/users/:id` — User profile, order history, wallet, block/unblock

#### Reviews
- `/reviews/pending` — Reviews awaiting moderation
- `/reviews/:id` — Review detail + Approve / Delete

#### Notifications
- `/notifications/send` — Send broadcast notifications (all users / vendors / by segment)

#### Reports & Settings
- `/reports` — Downloadable reports (orders, revenue, vendor performance)
- `/settings` — Platform settings (commission-free toggles, escrow period, etc.)

---

## 8. Group Buying Flow — Core Logic

### State Machine
```
GroupSession States:
  waiting → active → completed → [order created]
  waiting → expired → [auto-cancel, no charge]
  active → cancelled → [refunds issued]
```

### Flow
```
1. Buyer opens Product Page
2. Sees Individual Price (₹100) and Group Price (₹80 for 5+ members)
3. Clicks "Start Group Buy" OR "Join Existing Group"

   [Start Group]
   - POST /groups/create { productId, quantity }
   - GroupSession created with status='waiting', expiresAt=now+24h
   - shareToken generated → share URL: https://shopyng.com/join/ABC123
   - Buyer shares via WhatsApp/Instagram/Copy Link

   [Join Group]
   - GET /groups/join/:shareToken → shows group status
   - POST /groups/:id/join
   - GroupMember record created
   - currentSize++
   - Socket.IO broadcasts to all members: "New member joined! (3/5)"

4. When currentSize >= minGroupSize:
   - GroupSession status → 'completed'
   - Bull Queue: notifyAllMembers("Group complete! Proceed to checkout")
   - All members have 2 hours to pay at group price

5. After all members pay:
   - Orders created for each member at groupPrice
   - Payments go to Escrow
   - Vendor notified

6. If expiresAt reached and size < minGroupSize:
   - Bull Queue (scheduled): GroupSession status → 'expired'
   - Any pre-payments refunded to UserWallet
   - All members notified: "Group expired. You were not charged."
```

### GroupBuyingService.js Key Methods
```js
createGroupSession(productId, userId, quantity)
joinGroup(groupId, userId, quantity, addressId)
checkGroupCompletion(groupId)          // called on every join
handleGroupExpiry(groupId)             // called by Bull queue on expiresAt
completeGroup(groupId)                 // creates orders, sends notifications
cancelGroup(groupId, reason)           // refund all members
getGroupShareUrl(shareToken)           // public endpoint for landing page
```

---

## 9. Escrow Payment System

### Flow
```
Customer Pays (Razorpay)
       ↓
Payment Verified (webhook)
       ↓
EscrowWallet record created (status: 'holding')
       ↓
Order status: 'paid' / VendorWallet.pendingBalance++
       ↓
Vendor ships → adds Delhivery tracking ID
       ↓
Delhivery webhook: delivery confirmed
       ↓
Order status → 'delivered', deliveredAt = now
escrowReleaseDue = deliveredAt + 5 days
       ↓
Bull Queue scheduled for escrowReleaseDue
       ↓
EscrowService.releaseEscrow(orderId):
  - EscrowWallet status → 'released'
  - Razorpay Transfer API → vendor bank account
  - VendorWallet.balance += amount
  - VendorWallet.pendingBalance -= amount
  - Vendor notified: "Payment of ₹XX released"
```

### Refund Flow
```
Order cancelled (before shipping)
       ↓
EscrowService.refundEscrow(orderId)
  - Razorpay Refund API
  - EscrowWallet status → 'refunded'
  - User notified: "Refund of ₹XX credited within 5-7 days"
  OR
  - Credit to UserWallet instantly (platform credit)
```

---

## 10. Authentication & Authorization

### JWT Strategy
```
Access Token:  15 minutes expiry (stored in memory / httpOnly cookie)
Refresh Token: 7 days expiry (stored in httpOnly cookie + Redis blacklist)
```

### Roles & Permissions
```
buyer:  Own profile, orders, groups, wallet
vendor: Own products, orders, wallet, groups, analytics
admin:  Full platform access (all resources read/write)
```

### Middleware Stack
```
rateLimiter → cors → helmet → jwtVerify → rbac → controller
```

---

## 11. AWS Infrastructure

```
Production Setup:

Route 53 (DNS)
    ↓
CloudFront (CDN - serves buyer-app, vendor-panel, admin-panel static builds)
    ↓
ALB (Application Load Balancer)
    ↓
ECS Fargate (API containers, auto-scaling)
    ↓
MongoDB Atlas (M10 cluster, AWS ap-south-1)
ElastiCache Redis (cache.t3.small)
S3 (shopyng-uploads bucket + shopyng-assets bucket)
SES (transactional email)
SNS (push/SMS)
CloudWatch (logs, metrics, alarms)
Secrets Manager (all API keys)
```

---

## 12. Third-Party Integrations

| Service | Purpose | Integration Point |
|---|---|---|
| Razorpay | Payments, subscriptions, escrow transfers | PaymentService.js |
| Delhivery | Shipping labels, tracking, webhooks | ShippingService.js |
| Firebase FCM | Push notifications | NotificationService.js |
| AWS SES | Emails (OTP, order, invoice) | NotificationService.js |
| WhatsApp Business API | Group share messages | Social share util |

---

## 13. Real-Time System (Socket.IO)

### Events
```
// Server → Client
group:member_joined     { groupId, currentSize, maxSize, memberAvatar }
group:completed         { groupId, message }
group:expired           { groupId, message }
order:status_update     { orderId, status, message }
notification:new        { title, body, type }

// Client → Server
group:subscribe         { groupId }   // join room for real-time updates
group:unsubscribe       { groupId }
```

### Rooms
```
group:{groupId}         - All members watching a group session
vendor:{vendorId}       - Vendor's real-time order/group updates
admin:platform          - Admin real-time dashboard feed
```

---

## 14. Notification System

### Triggers
| Event | Buyer | Vendor | Admin |
|---|---|---|---|
| New order placed | ✅ confirmation | ✅ new order | — |
| Order shipped | ✅ tracking added | — | — |
| Order delivered | ✅ delivered | ✅ payment pending | — |
| Escrow released | — | ✅ payment released | — |
| Group member joined | ✅ progress update | — | — |
| Group completed | ✅ group complete | ✅ orders incoming | — |
| Group expired | ✅ group expired | — | — |
| Low stock (< 10) | — | ✅ alert | — |
| Subscription expiry (3 days) | — | ✅ reminder | — |
| KYC approved | — | ✅ approved | — |
| Product approved/rejected | — | ✅ result + note | — |
| New dispute | — | ✅ dispute raised | ✅ needs resolution |

---

## 15. Security Architecture

- All API endpoints rate-limited (express-rate-limit + Redis)
- Helmet.js for HTTP security headers
- Input validation with Joi / Zod on all routes
- MongoDB injection prevention (mongoose schema + sanitize-html)
- File uploads: type validation (mime-type), size limits, virus scan on S3
- Razorpay webhook signature verification on all payment webhooks
- Delhivery webhook IP whitelist
- AWS WAF on ALB for DDoS protection
- All secrets in AWS Secrets Manager (never in .env in production)
- Admin panel: 2FA required
- CORS: strict origin whitelist per environment
- Refresh token rotation + Redis blacklist on logout

---

## 16. Environment Variables

```env
# App
NODE_ENV=production
PORT=5000
API_BASE_URL=https://api.shopyng.com/v1
BUYER_APP_URL=https://shopyng.com
VENDOR_APP_URL=https://vendor.shopyng.com
ADMIN_APP_URL=https://admin.shopyng.com

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# MongoDB
MONGODB_URI=mongodb+srv://...

# Redis
REDIS_URL=redis://...

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_UPLOADS=shopyng-uploads
S3_BUCKET_ASSETS=shopyng-assets
SES_FROM_EMAIL=noreply@shopyng.com

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Delhivery
DELHIVERY_API_KEY=
DELHIVERY_BASE_URL=https://track.delhivery.com

# Firebase
FCM_SERVER_KEY=
```

---

## 17. Deployment Pipeline

```
Developer Push → GitHub
       ↓
GitHub Actions CI:
  - Lint (ESLint)
  - Unit tests (Jest)
  - Build Docker image
  - Push to ECR
       ↓
Deploy to ECS Fargate (staging)
       ↓
E2E tests (Playwright)
       ↓
Manual approval gate
       ↓
Deploy to ECS Fargate (production)
       ↓
CloudWatch alarms monitor health
```

---

## 18. Mock Data Strategy

### Seed Script covers:
- 5 admin users
- 20 vendors (mix of KYC statuses)
- 200 products across 10 categories (mix of approval statuses)
- 50 active group sessions (various fill levels and timers)
- 300 buyer accounts
- 500 orders (mix of individual and group, various statuses)
- 100 reviews (mix of pending/approved)
- Subscription plans: Basic (₹499/mo), Pro (₹999/mo), Enterprise (₹1999/mo)
- Realistic Indian names, addresses, phone numbers
- All images from Unsplash CDN (free, no auth needed)

### Run Seeds
```bash
cd backend
npm run seed:all      # Seeds everything
npm run seed:vendors  # Only vendors
npm run seed:products # Only products
npm run seed:groups   # Only group sessions
npm run seed:orders   # Only orders
```

---

*Architecture Version: 1.0 | Stack: MERN + AWS | Built for: Shopyng Group-Commerce Platform*
