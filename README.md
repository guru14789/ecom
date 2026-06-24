# 🛍️ Shopsyy

> **Enterprise Group-Buy E-Commerce Platform** — Built for the Indian market.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](./docs)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## What is Shopsyy?

Shopsyy is a **mobile-first group-buy marketplace** where buyers save money by purchasing together. When enough buyers join a "group session" for a product, everyone pays a deeply discounted group price instead of the individual retail price.

Think: Pinduoduo meets Blinkit for India.

---

## Quick Start

```bash
# Install dependencies
npm install && cd packages/buyer-app && npm install

# Start the buyer app
npm run dev
# → http://localhost:3000
```

---

## Documentation

📚 **Full documentation lives in [`/docs`](./docs/)**

| Document | Description |
|----------|-------------|
| [Project Overview](./docs/01-project-overview.md) | Vision, features, business model |
| [Architecture](./docs/02-architecture.md) | System design and monorepo infrastructure |
| [Frontend Guide](./docs/03-frontend-guide.md) | React app, layout components, custom hooks |
| [State Management](./docs/04-state-management.md) | Redux slices and data contracts |
| [Backend API](./docs/05-backend-api.md) | REST API specification |
| [Database Schema](./docs/06-database-schema.md) | MongoDB collections and indexes |
| [Authentication](./docs/07-authentication.md) | OTP auth, JWT, RBAC permissions |
| [UI/UX System](./docs/08-ui-ux-system.md) | Design tokens, typography, custom animations, components |
| [Pages Reference](./docs/09-pages-reference.md) | Detailed specification of all 9 active buyer pages |
| [Group Buy Engine](./docs/10-group-buy-engine.md) | Core real-time social buy sessions and states |
| [Order & Payment Flow](./docs/11-order-payment-flow.md) | Checkout, Razorpay webhook, order status machine |
| [Vendor Panel](./docs/12-vendor-panel.md) | Dashboard, inventory, logistics (Shiprocket), payouts |
| [Roadmap](./docs/13-roadmap.md) | 5-phase implementation plan and week-by-week actions |
| [Dev Setup](./docs/14-dev-setup.md) | Local development guide, scripts, environment setup |
| [Deployment](./docs/15-deployment.md) | AWS ECS production tier, CI/CD pipelines, Docker, CDN |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| State | Redux Toolkit + TanStack Query |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Express + Node.js + TypeScript |
| Database | MongoDB + Mongoose |
| Cache | Redis |
| Auth | JWT + OTP (MSG91/Twilio) |
| Payment | Razorpay |
| Realtime | Socket.io |
| Infra | AWS ECS + Vercel + Cloudflare |

---

## Current Status

Phase 1 (Frontend) — ✅ **Complete**  
Phase 2 (Backend Integration) — 🔧 **In Progress**

See the full [roadmap →](./docs/13-roadmap.md)

---

*Made with ❤️ for the Indian e-commerce ecosystem*
