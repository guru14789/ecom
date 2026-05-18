# SHOPYNG — MASTER BUILD PROMPT
> Feed this entire prompt to Claude Code, Cursor, or any AI coding agent to scaffold the complete production-ready project.

---

## PROJECT IDENTITY

You are building **Shopyng** — a production-ready, group-buying social commerce marketplace built on the MERN stack (MongoDB, Express, React, Node.js) with AWS services for infrastructure.

**Core innovation:** Shopyng introduces **Group Buying** — buyers can team up with friends to unlock lower "group prices" on products. A vendor sets an individual price (₹100) and a lower group price (₹80 unlocked when 5+ people join). Buyers share a link, friends join, the group price activates, and everyone benefits.

**Business model:** Subscription-based for vendors (no per-sale commission). Payments go into Escrow and are released to vendors 5 days after delivery confirmation.

---

## ABSOLUTE RULES — NEVER VIOLATE THESE

1. **MERN Stack only** — MongoDB (via Mongoose), Express.js, React 18 + Vite, Node.js 20
2. **AWS for all infrastructure** — S3, SES, ElastiCache (Redis), EC2/ECS, CloudFront
3. **Mock data everywhere** — No feature should show an empty state. Every page must render with realistic mock/seeded data
4. **Three separate React apps** — buyer-app (port 3000), vendor-panel (port 3001), admin-panel (port 3002)
5. **Production-ready code** — proper error handling, loading states, validation, auth guards on every protected route
6. **Group Buying is the star feature** — it must be prominent, beautifully designed, and fully functional with real-time Socket.IO updates
7. **TypeScript** — use TypeScript throughout (`.ts` for backend, `.tsx` for React)
8. **Tailwind CSS + shadcn/ui** — all UI components styled with Tailwind; use shadcn/ui for complex components (Dialog, Sheet, Tabs, etc.)
9. **Redux Toolkit + RTK Query** — global state and all API calls use RTK Query (not raw axios)
10. **Monorepo** — use a single repository with the structure defined below

---

## STEP 1 — SCAFFOLD MONOREPO

Create the following directory structure exactly:

```
shopyng/
├── packages/
│   ├── buyer-app/          (React + Vite + TypeScript)
│   ├── vendor-panel/       (React + Vite + TypeScript)
│   └── admin-panel/        (React + Vite + TypeScript)
├── backend/                (Express + TypeScript)
├── shared/                 (shared types, constants, utilities)
├── docker-compose.yml
├── .env.example
└── package.json            (root workspace)
```

Root `package.json` uses npm workspaces:
```json
{
  "name": "shopyng",
  "private": true,
  "workspaces": ["packages/*", "backend", "shared"]
}
```

---

## STEP 2 — BACKEND SETUP

### Initialize Express App

Install dependencies:
```
express cors helmet morgan express-rate-limit
mongoose
jsonwebtoken bcryptjs
socket.io
bull ioredis
multer @aws-sdk/client-s3
razorpay
nodemailer @aws-sdk/client-ses
firebase-admin
joi
dotenv
```

Dev dependencies:
```
typescript ts-node nodemon @types/express @types/node jest ts-jest supertest
```

### Create `backend/src/app.ts`
- Express app with cors, helmet, morgan, express-rate-limit
- Mount all route files under `/api/v1/`
- Global error handler middleware
- 404 handler
- Health check endpoint `GET /health`

### Create `backend/src/server.ts`
- Create HTTP server from express app
- Attach Socket.IO to HTTP server
- Connect MongoDB (show connection status)
- Connect Redis
- Start Bull queue processors
- Listen on PORT from env

### MongoDB Connection (`backend/src/config/db.ts`)
- Mongoose connect with retry logic (retry every 5 seconds if failed)
- Log connection status

### Redis Connection (`backend/src/config/redis.ts`)
- ioredis client
- Export `redisClient` and `pubSubClient` (two separate connections — one for commands, one for pub/sub)

### Socket.IO Setup (`backend/src/config/socket.ts`)
- Initialize Socket.IO with CORS
- JWT authentication middleware for socket connections
- Room-based events:
  - `group:{groupId}` — group session updates room
  - `vendor:{vendorId}` — vendor real-time orders room
  - `admin:platform` — admin dashboard room
- Export `io` instance

---

## STEP 3 — ALL MONGOOSE MODELS

Create every model with full TypeScript interfaces. Each model file exports:
1. The TypeScript interface (e.g., `IUser`)
2. The Mongoose schema
3. The Mongoose model (default export)

### Models to create (all in `backend/src/models/`):

**User.ts** — Fields: name, email, phone, passwordHash, role (buyer|vendor|admin), avatar (S3 URL), isVerified, isActive, referralCode, referredBy (ref: User), fcmToken, addresses (array with label/street/city/state/pincode/isDefault), timestamps

**Vendor.ts** — Fields: userId (ref: User), storeName, storeDescription, storeLogo, gstin, panNumber, bankDetails (accountNumber, ifscCode, bankName, accountHolderName), kycStatus (pending|approved|rejected), kycDocuments (array of {type, url}), subscriptionId (ref: Subscription), isActive, isSuspended, rating, totalReviews, timestamps

**Category.ts** — Fields: name, slug, icon (emoji or S3), parentId (ref: Category, for subcategories), isActive, sortOrder

**Product.ts** — Fields: vendorId (ref: Vendor), name, slug (auto-generated from name), description, images (array of S3 URLs), categoryId (ref: Category), tags, individualPrice, groupPrice, minGroupSize, groupDurationHours, stock, sku, weight, dimensions ({l,w,h}), deliveryOptions (array of {type, price, estimatedDays}), status (draft|pending_approval|active|rejected|archived), adminNote, approvedBy (ref: User), approvedAt, rating, totalReviews, totalSold, isFeatured, timestamps

**GroupSession.ts** — Fields: productId (ref: Product), vendorId (ref: Vendor), createdBy (ref: User), shareToken (unique, auto-generated uuid), shareUrl, minGroupSize, maxGroupSize, currentSize (default 0), individualPrice, groupPrice, status (waiting|active|completed|cancelled|expired), expiresAt, completedAt, cancelledAt, orderId (ref: Order), timestamps

**GroupMember.ts** — Fields: groupSessionId (ref: GroupSession), userId (ref: User), joinedAt, paymentStatus (pending|paid|refunded), paymentId, quantity, deliveryAddressId

**Order.ts** — Fields: orderNumber (auto-generated: SHY-YYYY-XXXXXX), userId (ref: User), vendorId (ref: Vendor), groupSessionId (ref: GroupSession, nullable), orderType (individual|group), items (array of {productId, name, image, quantity, unitPrice, totalPrice}), subtotal, shippingFee, discount, total, priceType (individual|group), deliveryAddress ({street, city, state, pincode}), status (placed|confirmed|packed|shipped|out_for_delivery|delivered|cancelled|return_requested|returned), paymentId, paymentStatus (pending|paid|in_escrow|released|refunded), escrowId (ref: EscrowWallet), trackingId, shippingLabelUrl, invoiceUrl, deliveredAt, escrowReleaseDue, timeline (array of {status, note, timestamp}), cancelReason, returnReason, timestamps

**EscrowWallet.ts** — Fields: orderId (ref: Order), vendorId (ref: Vendor), amount, status (holding|released|refunded), heldAt, releasedAt, razorpayTransferId

**UserWallet.ts** — Fields: userId (ref: User), balance (Number, default 0), transactions (array of {type: credit|debit, source: refund|cashback|referral|withdrawal, amount, note, referenceId, createdAt})

**VendorWallet.ts** — Fields: vendorId (ref: Vendor), balance (default 0), pendingBalance (default 0), transactions (array), withdrawalRequests (array of {amount, bankDetails, status: pending|processing|completed|failed, requestedAt, processedAt})

**SubscriptionPlan.ts** — Fields: name, price, billingCycle (monthly|yearly), features ({maxProducts, maxGroupSessions, analyticsAccess, prioritySupport, bulkUpload}), isActive

**Subscription.ts** — Fields: vendorId (ref: Vendor), planId (ref: SubscriptionPlan), status (active|expired|cancelled), startDate, endDate, razorpaySubscriptionId, autoRenew

**Review.ts** — Fields: productId (ref: Product), vendorId (ref: Vendor), userId (ref: User), orderId (ref: Order), rating (1-5), comment, images (array of S3 URLs), isApproved (default false), moderatedBy (ref: User)

**Notification.ts** — Fields: userId (ref: User), type (order_update|group_progress|deal|system), title, body, data (Mixed), isRead (default false), timestamps

---

## STEP 4 — ALL BACKEND SERVICES

Create service classes with full business logic. Services are called by controllers. Never put business logic in route handlers.

### `GroupBuyingService.ts`
```typescript
// Methods to implement:
createGroupSession(productId, userId, quantity): Promise<GroupSession>
  // Creates GroupSession, generates shareToken (nanoid), schedules expiry job in Bull

joinGroup(groupId, userId, quantity, addressId): Promise<GroupMember>
  // Creates GroupMember, increments currentSize
  // Calls checkGroupCompletion
  // Emits Socket.IO event to group:{groupId}: 'group:member_joined'

checkGroupCompletion(groupId): Promise<void>
  // If currentSize >= minGroupSize: call completeGroup()

completeGroup(groupId): Promise<void>
  // Sets status='completed'
  // Creates individual Order records for each GroupMember
  // Notifies all members via Socket.IO: 'group:completed'
  // Sends push notifications

handleGroupExpiry(groupId): Promise<void>
  // Sets status='expired'
  // Refunds any payments already made
  // Notifies all members

cancelGroup(groupId, reason): Promise<void>

getGroupByShareToken(shareToken): Promise<GroupSession>

getActiveGroupsForProduct(productId): Promise<GroupSession[]>
```

### `EscrowService.ts`
```typescript
holdPayment(orderId, amount, razorpayPaymentId): Promise<EscrowWallet>
releaseEscrow(orderId): Promise<void>
  // Triggers Razorpay transfer to vendor
  // Updates VendorWallet
  // Sends notification

refundEscrow(orderId): Promise<void>
  // Triggers Razorpay refund
  // Updates UserWallet if wallet credit preferred
```

### `PaymentService.ts`
```typescript
createRazorpayOrder(amount, currency, receipt): Promise<RazorpayOrder>
verifyPaymentSignature(paymentId, orderId, signature): boolean
createSubscription(planId, vendorId): Promise<RazorpaySubscription>
processRefund(paymentId, amount): Promise<void>
transferToVendor(vendorId, amount, orderId): Promise<void>
```

### `ShippingService.ts`
```typescript
generateLabel(orderId, vendorDetails, buyerDetails, packageDetails): Promise<{awb, labelUrl}>
trackShipment(awb): Promise<TrackingStatus>
cancelShipment(awb): Promise<void>
calculateRates(from, to, weight): Promise<ShippingRate[]>
```

### `NotificationService.ts`
```typescript
sendPush(userId, title, body, data): Promise<void>
sendEmail(to, template, data): Promise<void>
sendSMS(phone, message): Promise<void>
createInAppNotification(userId, type, title, body, data): Promise<Notification>
broadcastToRole(role, title, body): Promise<void>
```

---

## STEP 5 — ALL BULL QUEUES

Create `backend/src/queues/` with:

### `groupExpiry.queue.ts`
- Queue name: `group-expiry`
- Job: `handleExpiry` — called with `{ groupId }`, runs `GroupBuyingService.handleGroupExpiry(groupId)`
- When scheduling: `queue.add('handleExpiry', { groupId }, { delay: msUntilExpiry })`

### `escrowRelease.queue.ts`
- Queue name: `escrow-release`
- Job: `releasePayment` — called with `{ orderId }`, runs `EscrowService.releaseEscrow(orderId)`
- Scheduled when order is marked delivered: delay = 5 days in ms

### `notification.queue.ts`
- Queue name: `notifications`
- Jobs: `sendPush`, `sendEmail`, `sendSMS`
- All notification sends go through this queue (non-blocking for API responses)

---

## STEP 6 — ALL ROUTE FILES & CONTROLLERS

### File per domain in `backend/src/routes/`:

For each route file:
1. Create the router
2. Apply middleware (authenticate, authorize, validate)
3. Call controller method
4. Controller methods are thin — they call service and return `apiResponse(res, data)`

**Implement every route listed in the architecture document.** Full list:

**auth.routes.ts:** register, login, refresh, logout, send-otp, verify-otp, forgot-password, reset-password

**user.routes.ts:** profile (GET/PUT), addresses (POST/PUT/DELETE), wallet, notifications, wishlist

**product.routes.ts:** list (with pagination + filters: category, minPrice, maxPrice, hasGroupDeal, rating, sortBy), detail, search, categories, featured, reviews, trending, group-deals

**group.routes.ts:** create, join, status, get-by-token (public, no auth), active-groups, history, invite

**order.routes.ts:** create, list (with status filter), detail, cancel, return, tracking, invoice

**payment.routes.ts:** initiate, verify (Razorpay webhook), group-pay, history, refund

**vendor.routes.ts:** (all vendor-facing endpoints)

**admin.routes.ts:** (all admin endpoints)

**shipping.routes.ts:** label, track, cancel, rates

### Middleware:
```typescript
// authenticate.ts — verify JWT, attach req.user
// authorize(...roles) — check req.user.role is in allowed roles
// validate(schema) — Joi/Zod schema validation, returns 400 on failure
// upload.ts — multer with S3 storage (multer-s3)
// errorHandler.ts — global error handler
```

### apiResponse utility:
```typescript
// utils/apiResponse.ts
export const success = (res, data, message?, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data })

export const error = (res, message, statusCode = 400, errors?) =>
  res.status(statusCode).json({ success: false, message, errors })
```

---

## STEP 7 — MOCK DATA SEEDERS

Create `backend/seeds/` with comprehensive mock data. Use `faker-js` for realistic data.

### `seed.ts` (master seeder, runs all in order):
```
1. seedCategories()     — 10 categories with icons and slugs
2. seedSubscriptionPlans() — 3 plans
3. seedAdmins()         — 3 admin users
4. seedVendors()        — 20 vendors (mix of KYC statuses, subscription plans)
5. seedProducts()       — 200 products across categories
6. seedUsers()          — 100 buyer accounts
7. seedGroupSessions()  — 50 group sessions (various states and fill levels)
8. seedOrders()         — 300 orders
9. seedReviews()        — 200 reviews
10. seedWallets()       — wallet balances and transaction history
```

### Mock data details:

**Categories** (hardcoded, realistic Indian e-commerce):
Electronics, Fashion, Home & Kitchen, Beauty & Health, Sports & Fitness, Books, Toys & Games, Grocery, Automotive, Pet Supplies

**Products** (use Unsplash CDN for images — free, no API key needed):
`https://images.unsplash.com/photo-{id}?w=600&q=80`
- Always set individualPrice between ₹99 and ₹9999
- groupPrice = individualPrice * 0.75-0.85 (15-25% discount)
- minGroupSize between 3 and 10
- Make 30% of products pending approval, 60% active, 5% rejected, 5% draft

**Group Sessions** (realistic states):
- 20% waiting (freshly created, 1-2 members)
- 30% active (half-filled, e.g., 3/5 or 4/8)
- 30% completed (led to orders)
- 10% expired
- 10% cancelled
- All with realistic expiresAt (some in the next few hours, some next day)

**Orders** — mix of statuses, realistic Indian addresses (Chennai, Mumbai, Delhi, Bangalore, Hyderabad, Pune)

### Run command:
```
npm run seed          # in backend/
```

---

## STEP 8 — BUYER APP (buyer-app)

### Install:
```
react react-dom react-router-dom
@reduxjs/toolkit react-redux
tailwindcss @tailwindcss/vite
@shadcn/ui
socket.io-client
axios
react-hook-form zod @hookform/resolvers
framer-motion
react-hot-toast
recharts
date-fns
react-countdown
react-share
lucide-react
```

### Setup:
- Tailwind CSS with custom theme (primary: deep purple #6B21A8, accent: orange #F97316, success: green #16A34A)
- shadcn/ui initialized
- React Router v6 with route guards
- Redux store with RTK Query base API pointing to backend
- Socket.IO client connected on login, disconnected on logout

### Route Structure:
```typescript
// All routes in App.tsx
<Routes>
  {/* Public */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/verify-otp" element={<VerifyOTP />} />
  <Route path="/groups/join/:shareToken" element={<GroupJoinLanding />} /> {/* PUBLIC — no auth */}

  {/* Protected — buyer auth required */}
  <Route element={<AuthGuard role="buyer" />}>
    <Route element={<MainLayout />}> {/* with Header + BottomNav */}
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/categories/:slug" element={<CategoryProducts />} />
      <Route path="/deals" element={<GroupDeals />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/groups/:id" element={<GroupPage />} />
      <Route path="/groups/active" element={<ActiveGroups />} />
      <Route path="/groups/history" element={<GroupHistory />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout/success" element={<OrderSuccess />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/edit" element={<EditProfile />} />
      <Route path="/profile/addresses" element={<Addresses />} />
      <Route path="/profile/wishlist" element={<Wishlist />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/referral" element={<Referral />} />
    </Route>
  </Route>
</Routes>
```

### Page-by-page implementation:

**Home Page (`/`)**
- Full-width hero banner carousel (3 slides: "Group Deals Today", "Save More Together", "Invite & Save")
- "🔥 Active Group Deals" horizontal scroll strip — shows GroupSessionCard components with countdown timers
- "Browse Categories" grid (2x5, with category icon and name)
- "Trending Products" grid (3 columns on mobile)
- "Smart Picks For You" section (AI recommendations — static for now)
- Bottom sticky bar showing most recent active group: "Your group: 3/5 joined! ⏰ 2h left"

**Product Detail Page (`/products/:id`)**
- Image carousel (swipeable)
- Product name, vendor name (clickable)
- **PRICING SECTION** (this is the most important UI element):
  ```
  ┌─────────────────────────────────────────────┐
  │  Individual Price    │    Group Price         │
  │  ₹1,000             │    ₹750 🔥             │
  │  Buy now, pay full  │    Min 5 members        │
  │                     │    Save ₹250 (25%)      │
  └─────────────────────────────────────────────┘
  ```
- **Active Groups for this product** — list of group sessions with:
  - Members: [avatars] 3/5 joined
  - Time left: countdown timer
  - "Join This Group" button
- "Start New Group" button (creates group session)
- Share section: WhatsApp, Facebook, Instagram, Copy Link buttons
- Product description
- Delivery options
- Reviews section with star breakdown
- Seller info card

**Group Join Landing (`/groups/join/:shareToken`) — PUBLIC**
- Works without login
- Shows product image, name, savings info
- Shows current group progress: "3 of 5 members have joined"
- Countdown timer
- "Join Group & Save ₹250" CTA button
- If not logged in: clicking CTA → redirect to register/login, then back to this page
- Social proof: "🎉 Priya from Chennai just joined!"

**Group Page (`/groups/:id`)**
- Group status header (waiting/active/completed)
- Product card (mini)
- **Progress section** (this is the hero of this page):
  ```
  ┌─────────────────────────────────────────────┐
  │     Members Joined: 3 / 5                    │
  │     [●●●○○]  ← visual fill indicator        │
  │     2 more needed to unlock ₹750 price       │
  │                                              │
  │     ⏰ Time Left: 23:45:12                   │
  │                                              │
  │     [avatar] [avatar] [avatar] + 0 more      │
  └─────────────────────────────────────────────┘
  ```
- REAL-TIME: this page subscribes to Socket.IO `group:{id}` room
- When a member joins: animate the progress bar, show toast "Rahul just joined!"
- Invite section: "Invite 2 more friends to unlock group price!"
  - WhatsApp share button (pre-filled message with product name and savings)
  - Copy link button
  - Instagram story share (open link)
- Wait for group instructions
- If group completes: confetti animation + "Group Complete! Proceed to checkout"

**Cart & Checkout**
- Cart: items list, quantity controls, price summary, "Proceed to Checkout" button
- Checkout: delivery address selector, payment method (Razorpay or Wallet balance), order summary, Place Order
- For group orders: show "Group Price Applied ✓ You save ₹250"

**OrderSuccess (`/checkout/success`)**
- Celebration animation (confetti or similar)
- "Order Confirmed! 🎉"
- **If group order**: "You saved ₹250 by group buying! 🏆"
- Order number
- Track Order button
- Share your savings (WhatsApp button: "I just saved ₹250 shopping with friends on Shopyng!")

**Orders Page**
- Tabs: All | Active | Delivered | Cancelled
- Each order card: product image, name, status badge (colored), total, date
- Status badges with colors: placed(blue), confirmed(indigo), shipped(orange), delivered(green), cancelled(red)

**Order Detail**
- Status timeline (vertical stepper):
  Placed ✓ → Confirmed ✓ → Packed → Shipped → Delivered
- Live tracking button (opens Delhivery tracking)
- Download Invoice button
- Cancel Order (if not shipped yet)
- Request Return (if delivered, within 7 days)
- "Rate this product" CTA (if delivered)

**Wallet Page**
- Balance card: "₹1,250 Available"
- Pending rewards breakdown: cashback, referral, refund credits
- Transaction history list with icons by type
- Refer & Earn section

---

## STEP 9 — VENDOR PANEL (vendor-panel)

### Route Structure:
```typescript
<Routes>
  <Route path="/login" element={<VendorLogin />} />
  <Route path="/register" element={<VendorRegister />} />
  <Route path="/kyc" element={<KYC />} />
  <Route path="/kyc/pending" element={<KYCPending />} />
  <Route path="/subscription" element={<ChoosePlan />} />

  <Route element={<VendorAuthGuard />}>
    <Route element={<VendorLayout />}> {/* Sidebar layout */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/add" element={<AddProduct />} />
      <Route path="/products/:id/edit" element={<EditProduct />} />
      <Route path="/products/bulk-upload" element={<BulkUpload />} />
      <Route path="/groups" element={<GroupSessions />} />
      <Route path="/groups/:id" element={<GroupDetail />} />
      <Route path="/orders" element={<VendorOrders />} />
      <Route path="/orders/:id" element={<VendorOrderDetail />} />
      <Route path="/wallet" element={<VendorWallet />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/subscription/manage" element={<SubscriptionManage />} />
      <Route path="/profile" element={<StoreProfile />} />
      <Route path="/notifications" element={<VendorNotifications />} />
    </Route>
  </Route>
</Routes>
```

### Page implementations:

**Vendor Dashboard**
- 4 stat cards: Total Revenue (₹), Pending Orders, Active Groups, Products Listed
- Revenue chart (Recharts AreaChart, last 30 days, group vs individual split shown)
- Recent Orders table (last 10, with quick Accept/Ship actions)
- Low Stock Alerts (products with stock < 10)
- Active Group Sessions widget (live progress bars)
- Subscription status banner (days remaining + upgrade CTA)

**Add Product Form** — this is complex, multi-step:
- Step 1: Basic Info (name, description, category, tags)
- Step 2: Images (drag-drop upload, preview, reorder, min 1 max 8)
- Step 3: Pricing & Group Settings:
  ```
  Individual Price: [₹____]
  Enable Group Buying: [toggle]
    Group Price: [₹____]      (auto-shows: X% discount)
    Min Group Size: [____]    (members needed)
    Group Duration: [__] hours
  ```
- Step 4: Inventory (stock qty, SKU, weight, dimensions)
- Step 5: Delivery (add delivery options, pricing, days)
- Review & Submit

**Group Sessions Page**
- Tabs: Active | Waiting | Completed | Expired
- Each group card: product image, progress bar, member count, timer, revenue if completed
- Real-time updates via Socket.IO (`vendor:{vendorId}` room)

**Vendor Order Detail**
- Order info: buyer name (anonymized initially), quantity, price, delivery address
- Status: current status with update controls
- Actions:
  - "Accept Order" button (if placed)
  - "Mark as Packed" button (if confirmed)
  - "Add Tracking Number" form (shows after accepting, Delhivery AWB input)
  - "Mark as Shipped" (after AWB added)
- Invoice: auto-generated PDF download
- Shipping label: download button

**Vendor Wallet**
- Balance card: Available ₹ | Pending (Escrow) ₹
- Withdrawal form: amount input, bank details confirm, request payout
- Escrow timeline: orders in escrow with release dates
- Transaction history table with filters

**Analytics Page**
- Date range picker
- Revenue breakdown: total, group revenue %, individual revenue %
- Orders chart (Recharts LineChart)
- Top 5 products by revenue (bar chart)
- Group session conversion rate (groups started vs completed)
- Order fulfillment rate pie chart

---

## STEP 10 — ADMIN PANEL (admin-panel)

### Route Structure:
```typescript
<Routes>
  <Route path="/login" element={<AdminLogin />} />

  <Route element={<AdminAuthGuard />}>
    <Route element={<AdminLayout />}> {/* Sidebar with collapsible nav */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<AdminDashboard />} />

      {/* Vendors */}
      <Route path="/vendors" element={<VendorList />} />
      <Route path="/vendors/:id" element={<VendorProfile />} />

      {/* Products */}
      <Route path="/products" element={<AllProducts />} />
      <Route path="/products/pending" element={<PendingApproval />} />
      <Route path="/products/:id" element={<AdminProductDetail />} />

      {/* Orders */}
      <Route path="/orders" element={<AllOrders />} />
      <Route path="/orders/disputes" element={<Disputes />} />
      <Route path="/orders/:id" element={<AdminOrderDetail />} />

      {/* Groups */}
      <Route path="/groups" element={<AllGroups />} />
      <Route path="/groups/:id" element={<AdminGroupDetail />} />

      {/* Payments */}
      <Route path="/payments" element={<AllPayments />} />
      <Route path="/escrow" element={<EscrowDashboard />} />
      <Route path="/payouts" element={<Payouts />} />

      {/* Subscriptions */}
      <Route path="/subscriptions" element={<AllSubscriptions />} />
      <Route path="/subscriptions/plans" element={<ManagePlans />} />

      {/* Users */}
      <Route path="/users" element={<AllUsers />} />
      <Route path="/users/:id" element={<UserProfile />} />

      {/* Reviews */}
      <Route path="/reviews/pending" element={<PendingReviews />} />

      {/* Notifications */}
      <Route path="/notifications/send" element={<SendNotification />} />

      {/* Settings */}
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
  </Route>
</Routes>
```

### Page implementations:

**Admin Dashboard**
- Platform KPI row (6 cards): Total GMV Today, Active Users, Active Groups, Pending Approvals, Escrow Held, Monthly Subscription Revenue
- Real-time activity feed (right panel): recent orders, new vendor registrations, group completions
- Charts: Orders trend (7 days), User growth (30 days), Revenue by category (pie)
- Action queues: "5 vendors need KYC review", "12 products need approval" — clickable banners

**Vendor List & KYC Review**
- Sortable, filterable table: vendor name, store, KYC status badge, subscription, join date, actions
- Filter by: KYC status, subscription plan, joined date
- Vendor profile page:
  - Store details
  - KYC documents viewer (image/pdf preview from S3)
  - "Approve" (green) / "Reject" (red, requires note) buttons
  - Suspend/Activate toggle
  - Subscription and billing info
  - All orders from this vendor
  - Wallet balance

**Product Approval Queue** (most time-sensitive admin page)
- Products sorted by submission date (oldest first)
- Product card with images, pricing (individual + group), description, vendor info
- "Approve" and "Reject" buttons on each card
- Reject requires text reason (sent to vendor as notification)
- Bulk approve option (checkboxes)

**Escrow Dashboard**
- Total held: ₹X
- Due for release this week: ₹X (list of orders)
- Released this month: ₹X
- Table: orderId, vendor, amount, order delivered date, release date, status
- Manual release button (with confirmation modal + reason required)

**All Groups Admin View**
- Table: group ID, product, vendor, progress (3/5), status, expires, total value if completed
- Filter by status
- Admin can manually cancel any group

**Review Moderation**
- Reviews grid: product image, buyer name (anonymized), rating stars, comment, photos
- Approve / Delete buttons
- Flag count for reported reviews

---

## STEP 11 — SHARED COMPONENTS LIBRARY

### In `shared/` package, create:

**Types** (`shared/src/types/`):
- `api.types.ts` — All API request/response TypeScript interfaces
- `models.types.ts` — Mirror of all MongoDB model interfaces
- `socket.types.ts` — Socket.IO event payloads

**Constants** (`shared/src/constants/`):
- `orderStatuses.ts` — status enums with labels and colors
- `groupStatuses.ts`
- `routes.ts` — all API route strings

---

## STEP 12 — REAL-TIME FEATURES

### In buyer-app, create `useGroupSession` hook:
```typescript
// hooks/useGroupSession.ts
// Subscribes to Socket.IO group:{groupId} room
// Returns: { currentSize, maxSize, timeLeft, members, status }
// Auto-updates when server emits group:member_joined or group:completed
// Shows toast on new member join
// Triggers confetti on group:completed
```

### In vendor-panel, create `useVendorRealtime` hook:
```typescript
// Subscribes to vendor:{vendorId} room
// Updates order list when new order arrives
// Updates group progress in real-time
```

---

## STEP 13 — CRITICAL UX DETAILS

Implement these micro-interactions:

1. **Group countdown timer** — shows "23:45:12" with red coloring when < 1 hour left; pulsing animation
2. **Member joined animation** — when Socket.IO fires `group:member_joined`, the progress bar animates smoothly, a toast appears: "🎉 [Name] just joined!"
3. **Group complete celebration** — confetti (use `canvas-confetti` npm package), full-screen overlay: "🏆 Group Complete! You saved ₹X"
4. **Price toggle animation** — on product page, when user switches between Individual and Group price view, animate the price change
5. **Social share** — use `react-share` for WhatsApp/Facebook/Instagram/Copy. Pre-filled WhatsApp message: "Hey! Join our group on Shopyng and we both get [Product] for ₹[groupPrice] instead of ₹[individualPrice]! Only [X] spots left ⏰ [shareUrl]"
6. **Loading skeletons** — every data-fetching page must show skeleton loaders (not spinners)
7. **Empty states** — every list must have a meaningful empty state with illustration (use inline SVG emoji-based illustrations)
8. **Pull to refresh** — buyer app on mobile supports pull-to-refresh on order list and group list

---

## STEP 14 — DOCKER COMPOSE

Create `docker-compose.yml` for local development:
```yaml
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo-data:/data/db]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build: ./backend
    ports: ["5000:5000"]
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/shopyng
      - REDIS_URL=redis://redis:6379
    depends_on: [mongodb, redis]
    volumes: [./backend:/app, /app/node_modules]

  buyer-app:
    build: ./packages/buyer-app
    ports: ["3000:3000"]
    environment: [VITE_API_URL=http://localhost:5000/api/v1]

  vendor-panel:
    build: ./packages/vendor-panel
    ports: ["3001:3001"]
    environment: [VITE_API_URL=http://localhost:5000/api/v1]

  admin-panel:
    build: ./packages/admin-panel
    ports: ["3002:3002"]
    environment: [VITE_API_URL=http://localhost:5000/api/v1]

volumes:
  mongo-data:
```

---

## STEP 15 — IMPLEMENTATION ORDER

Build in this exact order to avoid blockers:

```
Phase 1 — Foundation (do this first)
  1. Monorepo setup, package.json, tsconfigs
  2. Backend: app.ts, server.ts, db.ts, redis.ts
  3. All Mongoose models
  4. Auth routes (register, login, JWT)
  5. Seed script with mock data

Phase 2 — Core Backend
  6. Group buying service + queue
  7. Escrow service
  8. All product routes
  9. All order routes
  10. All group routes
  11. Payment routes (mock Razorpay)
  12. Socket.IO events

Phase 3 — Buyer App
  13. Setup: Vite, Tailwind, shadcn, Redux, Router
  14. Auth pages (Login, Register, OTP)
  15. Layout (Header, BottomNav)
  16. Home page
  17. Product listing and search
  18. Product detail (with group pricing UI)
  19. Group join landing (public)
  20. Group session page (real-time)
  21. Cart and checkout
  22. Orders pages
  23. Profile, Wallet, Notifications

Phase 4 — Vendor Panel
  24. Setup + Layout
  25. Auth + KYC + Plan selection
  26. Dashboard
  27. Product CRUD (add/edit/list)
  28. Group sessions management
  29. Order management
  30. Wallet + Analytics

Phase 5 — Admin Panel
  31. Setup + Layout
  32. Dashboard
  33. Vendor management + KYC review
  34. Product approval queue
  35. Order management + disputes
  36. Escrow dashboard
  37. Subscriptions management
  38. Reviews moderation
  39. Reports
```

---

## QUALITY CHECKLIST

Before marking any page complete, verify:
- [ ] Page renders with mock data (no empty states)
- [ ] Loading skeleton shown during data fetch
- [ ] Error state handled (API failure shows toast + error message)
- [ ] Mobile responsive (buyer-app), desktop optimized (vendor/admin panels)
- [ ] All buttons have loading states (disabled + spinner when submitting)
- [ ] All forms have validation with inline error messages
- [ ] All protected routes redirect to login if unauthenticated
- [ ] TypeScript: no `any` types (use `unknown` with type guards if needed)
- [ ] Console: no errors or warnings
- [ ] Real-time: Socket.IO events update UI without page refresh where specified

---

## DESIGN SYSTEM

**Colors:**
```css
--primary: #6B21A8;        /* Deep Purple — brand primary */
--primary-light: #A855F7;  /* Purple 500 */
--accent: #F97316;         /* Orange — CTAs, urgency, timers */
--success: #16A34A;        /* Green — delivered, complete, savings */
--warning: #D97706;        /* Amber — pending, waiting */
--danger: #DC2626;         /* Red — cancelled, error, expired */
--surface: #F8F7FF;        /* Slight purple tint on white bg */
```

**Typography:** Inter font (Google Fonts)

**Group Price Card** — always show group savings in green: "Save ₹250 (25%)" with a fire emoji 🔥 when discount > 20%

**Countdown Timer** — always in orange (#F97316), monospace font, format: HH:MM:SS. When < 1 hour: pulse animation + red color

**Status Badges** — pill shaped, color-coded:
- Waiting: purple, Active: blue, Completed: green, Expired: gray, Cancelled: red
- Orders: Placed(blue), Confirmed(indigo), Packed(amber), Shipped(orange), Delivered(green), Cancelled(red)

---

*End of Master Build Prompt — Shopyng v1.0*
*Stack: MERN + AWS | Group Buying Commerce | Production Ready*
