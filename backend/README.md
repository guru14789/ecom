# ShopYNG API Reference

Base URL: `http://localhost:5000/api`

---

## Public Routes

### Auth — `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/send-otp` | Send OTP to phone number |
| POST | `/verify-otp` | Verify OTP and login |
| POST | `/refresh` | Refresh access token |

### Auth (Cognito) — `/api/auth/cognito`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Sign up with email & password |
| POST | `/signin` | Sign in with email & password |
| POST | `/admin-create` | Admin creates a Cognito user |

### Products — `/api/products`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List products (supports `?category=`, `?search=`, `?page=`, `?limit=`) |
| GET | `/search` | Full-text search |
| GET | `/categories` | List all categories |
| GET | `/:id` | Get product by ID |

### Groups — `/api/groups`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List group sessions (`?productId=`, `?status=`) |
| GET | `/live` | Live group counts |
| GET | `/:id` | Get group session by ID |

### Webhook — `/api/webhook`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/razorpay` | Razorpay webhook (payment.captured, payment.failed) |

---

## Authenticated Routes (JWT Required)

### Auth — `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/logout` | Logout (invalidate refresh token) |

### Cart — `/api/cart`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get user's cart |
| POST | `/items` | Add item to cart |
| PUT | `/items/:productId` | Update cart item |
| DELETE | `/items/:productId` | Remove item from cart |
| DELETE | `/` | Clear cart |
| POST | `/coupon` | Apply coupon to cart |

### Orders — `/api/orders`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List user's orders |
| GET | `/:id` | Get order by ID |
| POST | `/` | Create order |
| POST | `/:id/cancel` | Cancel order |
| POST | `/:id/return` | Request return |
| GET | `/:id/invoice` | Get order invoice |

### Users — `/api/users`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Get current user profile |
| PUT | `/me` | Update profile |
| GET | `/me/addresses` | List addresses |
| POST | `/me/addresses` | Add address |
| PUT | `/me/addresses/:id` | Update address |
| DELETE | `/me/addresses/:id` | Delete address |
| GET | `/me/wishlist` | Get wishlist |
| POST | `/me/wishlist/:productId` | Add to wishlist |
| DELETE | `/me/wishlist/:productId` | Remove from wishlist |
| GET | `/me/wallet` | Get wallet balance & transactions |

### Groups — `/api/groups`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/start` | Start a group session |
| POST | `/:id/join` | Join a group session |

---

## Vendor Routes — `/api/vendor`

Auth: JWT + `vendor` / `vendor_admin` / `platform_admin` role

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Vendor dashboard stats |
| GET | `/subscription` | Get subscription details + tier info |
| POST | `/subscription` | Create/update subscription tier |
| POST | `/subscription/cancel` | Cancel subscription |
| GET | `/payouts` | Get pending payouts |
| GET | `/shipments` | List vendor shipments |
| POST | `/shipments` | Create shipment (Delhivery) |
| GET | `/groups` | List group sessions for vendor's products |
| POST | `/groups` | Create a group deal |
| POST | `/groups/:id/cancel` | Cancel a group session |
| GET | `/breakdown` | Transaction fee breakdown (`?amount=`) |

---

## Admin Routes — `/api/admin`

Auth: JWT + `platform_admin` / `super_admin` role

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Platform dashboard with stats |
| GET | `/vendors` | List vendors (`?page=`, `?limit=`) |
| PUT | `/vendors/:id/status` | Update vendor status (active/suspended/cancelled) |
| GET | `/products/pending` | List all active products |
| PUT | `/products/:id/featured` | Toggle product featured status |
| GET | `/orders` | List orders (`?page=`, `?limit=`, `?status=`) |
| PUT | `/orders/:id/status` | Update order status (auto-releases escrow on delivered) |
| GET | `/activity-log` | System activity log (`?page=`, `?limit=`) |

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "statusCode": 400
  }
}
```

## Common Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request body |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `CONFIG_ERROR` | 500 | Missing service configuration (e.g. Cognito not set up) |
