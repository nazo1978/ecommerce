# 🚀 E-Commerce Platform Project

**Client:** Sidki Hayzaran  
**Project:** Multi-Platform E-Commerce + Auction + Lottery System   


---

## 🎯 **Project Overview**

### **What We're Building:**
A comprehensive e-commerce platform with three core systems:
- 🛒 **E-Commerce Marketplace** (Products, Orders, Payments)
- 🏺 **Auction System** (Live bidding, Auto-bidding)
- 🎲 **Lottery System** (Ticket sales, Drawings, Prizes)

### **Platform Coverage:**
- 🌐 **Web Application** (Vue.js 3 + Nuxt.js)
- 📱 **Mobile App** (NativeScript-Vue)
- 🎛️ **Admin Panel** (Quasar Framework)

---

## 🏗️ **Technology Stack**

### **Frontend Technologies:**
```javascript
// Web Platform
- Vue.js 3 (Composition API)
- Nuxt.js 3 (SSR/SPA)
- TypeScript
- Quasar Framework
- Pinia (State Management)

// Mobile Platform  
- NativeScript-Vue
- Native iOS/Android features

// Admin Panel
- Quasar Framework
- Vue.js 3 + TypeScript


// Vendor Panel
- Quasar Framework
- Vue.js 3 + TypeScript

### **Backend Technologies:**
```javascript
// API & Database
- Node.js + Fastify/Express
- PostgreSQL + Prisma ORM
- Redis (Caching & Sessions)
- Docker + Docker Compose

// Authentication & Security
- Custom JWT Authentication
- Google OAuth 2.0
- TOTP 2FA (Time-based)
- Bcrypt Password Hashing

// Real-time Features
- Socket.io (WebSocket)
- Real-time notifications
- Live auction bidding
```

### **Payment & External Services:**
```javascript
// Payment Gateways
- Stripe Integration
- PayPal Integration
- Digital Wallet System

// Communication
- SendGrid (Email)
- Twilio (SMS/2FA)
- Firebase (Push Notifications)

// File Storage
- AWS S3 / Cloudinary
- CDN Integration
```

---

## 👥 User Roles & Permissions

### Roles Matrix
| Role | Permissions |
|-----|-------------|
| Visitor | View products |
| Customer | Orders, Auctions, Lottery, MLM/Referrals |
| Seller | Create/manage products, auctions, lotteries |
| Admin | Full system management, dashboard access control |

### Backend Authorization
- Model: primary role via `User.role`; optional multi-role/permission via RBAC tables below
- Enforcement: HTTP middleware and business services check permissions
- JWT: include role and permission claims
- Validation: Zod schemas enforce input; role-bound constraints in services

### Backend RBAC Tables (Prisma)
```prisma
model Role {
  id        String  @id @default(cuid())
  code      String  @unique // VISITOR, CUSTOMER, SELLER, ADMIN
  name      String
  createdAt DateTime @default(now())
}

model Permission {
  id        String  @id @default(cuid())
  code      String  @unique // e.g., PRODUCT_CREATE, ORDER_CREATE, AUCTION_BID
  name      String
  createdAt DateTime @default(now())
}

model RolePermission {
  roleId       String
  permissionId String

  role       Role       @relation(fields: [roleId], references: [id])
  permission Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}

model UserRole {
  userId String
  roleId String

  user User @relation(fields: [userId], references: [id])
  role Role @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}
```

Note: `User.role` enum remains for default role; `UserRole` enables multiple roles.

### Permission Mapping
- Visitor: `PRODUCT_VIEW`
- Customer: `PRODUCT_VIEW`, `CART_USE`, `ORDER_CREATE`, `PAYMENT_USE`, `AUCTION_BID`, `LOTTERY_TICKET_BUY`, `MLM_PARTICIPATE`
- Seller: `PRODUCT_CREATE`, `PRODUCT_UPDATE`, `INVENTORY_MANAGE`, `AUCTION_CREATE`, `LOTTERY_CREATE`, `ORDER_FULFILL`
- Admin: `ADMIN_READ`, `ADMIN_WRITE`, `USER_MANAGE`, `SELLER_APPROVE`, `PRODUCT_APPROVE`, `REPORT_VIEW`, `SYSTEM_CONFIG`

### Interactions
- Order: Customer with `ORDER_CREATE` → `OrderService.checkout`, stock reservation, payment capture
- Auction: Customer with `AUCTION_BID` → `AuctionService.placeBid`, wallet check, bid validation, auto-extend
- Lottery: Customer with `LOTTERY_TICKET_BUY` → `LotteryService.buyTicket`, draw scheduling, prize distribution
- Seller publishing: Seller with `PRODUCT_CREATE` → review → Admin with `PRODUCT_APPROVE`
- Admin dashboards: Admin with `ADMIN_READ`/`ADMIN_WRITE` via admin routes

### Frontend Authorization
- Route guards: check role and permissions from Pinia store decoded from JWT and verified via `/me`
- UI gating: hide actions without permission; show disabled state with tooltip
- Error handling: normalize 401/403, redirect to login or show access denied

### API Endpoints Examples
- `POST /api/v1/products` → requires `PRODUCT_CREATE` (Seller/Admin)
- `POST /api/v1/cart/checkout` → requires `ORDER_CREATE` (Customer)
- `WS /ws/auctions/:id` → `AUCTION_BID` to send, `PRODUCT_VIEW` to read
- `POST /api/v1/lottery/tickets` → `LOTTERY_TICKET_BUY` (Customer)
- `GET /api/v1/admin/users` → `ADMIN_READ` (Admin)

---

## 🗄️ **Database Design**

### **Core Data Models:**

```prisma
// User Authentication (Custom System)
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String?  // Hashed with bcrypt
  firstName     String?
  lastName      String?
  phone         String?
  avatar        String?
  role          UserRole @default(USER)
  emailVerified Boolean  @default(false)
  twoFactorEnabled Boolean @default(false)
  googleId      String? @unique
  createdAt     DateTime @default(now())
  
  // Relations
  wallet        Wallet?
  orders        Order[]
  auctionBids   AuctionBid[]
  lotteryTickets LotteryTicket[]
  products      Product[]
}

// E-Commerce
model Product {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Decimal
  stock       Int
  category    String
  images      String[]
  sellerId    String
  status      ProductStatus @default(PENDING)
  featured    Boolean @default(false)
  
  seller      User     @relation(fields: [sellerId], references: [id])
  auctions    Auction[]
}

// Auction System
model Auction {
  id          String      @id @default(cuid())
  productId   String
  startPrice  Decimal
  currentBid  Decimal
  buyNowPrice Decimal?
  startTime   DateTime
  endTime     DateTime
  status      AuctionStatus @default(SCHEDULED)
  winnerId    String?
  autoExtend  Boolean     @default(true)
  
  product     Product     @relation(fields: [productId], references: [id])
  bids        AuctionBid[]
}

// Lottery System
model LotteryDraw {
  id           String   @id @default(cuid())
  name         String
  drawDate     DateTime
  ticketPrice  Decimal
  winningNumbers String?
  prizeStructure Json
  totalPrize   Decimal
  status       LotteryStatus @default(SCHEDULED)
  
  tickets      LotteryTicket[]
  winners      LotteryWinner[]
}
```

---

## ⏱️ **Development Timeline**

### **Phase 1: Foundation (Weeks 1-5)**
- ✅ Vue.js 3 + Nuxt.js setup
- ✅ Docker environment (PostgreSQL + Redis)
- ✅ Custom authentication system
- ✅ User management
- ✅ Basic UI components

### **Phase 2: E-Commerce Core (Weeks 6-12)**
- 🛒 Product management system
- 🛒 Shopping cart functionality  
- 🛒 Order processing
- 💳 Payment integration (Stripe/PayPal)
- 💰 Digital wallet system

### **Phase 3: Auction System (Weeks 13-19)**
- 🏺 Real-time bidding (WebSocket)
- 🏺 Auto-bidding algorithms
- 🏺 Auction management
- 🏺 Live auction interface

### **Phase 4: Lottery System (Weeks 20-23)**
- 🎲 Ticket purchasing system
- 🎲 Drawing algorithms
- 🎲 Prize distribution
- 🎲 Winner notification system

### **Phase 5: Admin & Mobile (Weeks 24-30)**
- 🎛️ Quasar admin panel
- 📱 Mobile app development
- 📊 Analytics dashboard
- 📈 Reporting systems

### **Phase 6: Testing & Launch (Weeks 31-36)**
- 🧪 Comprehensive testing
- 🔒 Security auditing
- 🚀 Performance optimization
- 📚 Documentation

---

## 🛡️ **Security Features**

### **Authentication Security:**
- 🔐 JWT with refresh tokens
- 🔐 TOTP 2FA (Google Authenticator)
- 🔐 Account lockout protection
- 🔐 Password strength requirements
- 🔐 Session management

### **Application Security:**
- 🛡️ Rate limiting per user/IP
- 🛡️ SQL injection prevention
- 🛡️ XSS protection
- 🛡️ CSRF protection
- 🛡️ Data encryption at rest
- 🛡️ Audit logging

### **Payment Security:**
- 💳 PCI DSS compliance
- 💳 Encrypted payment processing
- 💳 Fraud detection
- 💳 Secure wallet transactions

---

## 📊 **Key Features**

### **E-Commerce Features:**
- Advanced product search & filtering
- Product recommendations
- Reviews and ratings system
- Inventory management
- Multi-category support
- SEO optimization

### **Auction Features:**
- Real-time bidding interface
- Auto-bidding with max limits
- Auction extension (last-minute bids)
- Buy-now option
- Bid history tracking
- Winner notification system

### **Lottery Features:**
- Multiple lottery types
- Automated drawings
- Multi-tier prize structure
- QR code ticket verification
- Statistical analysis
- Subscription-based lotteries

### **Admin Features:**
- Comprehensive dashboard
- User management
- Product approval workflow
- Financial reporting
- System monitoring
- Audit trails

---

## 💰 **Business Model**

### **Revenue Streams:**
1. **E-Commerce Commissions** (3-5% per sale)
2. **Auction House Fees** (8-12% per auction)
3. **Lottery Margins** (15-20% per ticket)
4. **Premium Seller Subscriptions**
5. **Featured Product Placements**
6. **Payment Processing Fees**

### **Projected Revenue (Month 6):**
- E-Commerce: $15,000-30,000/month
- Auctions: $10,000-20,000/month  
- Lottery: $7,500-15,000/month
- **Total: $32,500-65,000/month**

---

## 🎯 **Success Metrics**

### **Technical KPIs:**
- API response time < 300ms
- Web app load time < 1.5s
- Mobile app load time < 2.5s
- 99.95% uptime
- WebSocket latency < 50ms

### **Business KPIs:**
- 5,000+ registered users (Month 1)
- 1,500+ successful transactions
- 2,000+ auction participants
- 3,000+ lottery tickets sold
- 4.8+ user satisfaction rating

---

## 🚀 **Getting Started**

### **Immediate Next Steps:**
1. **Team Setup** (Week 1)
   - Development environment setup
   - Git repository creation
   - Docker environment configuration

2. **Sprint Planning** (Week 1)
   - Break down tasks into 2-week sprints
   - Assign team member specializations
   - Set up project management (Jira/Trello)

3. **Technology Deep Dive** (Week 1-2)
   - Vue.js 3 & Nuxt.js training
   - Database design review
   - API architecture planning

### **Team Responsibilities:**
- **Frontend Specialists:** Vue.js components, UI/UX
- **Backend Specialists:** API development, database
- **Full-Stack:** Integration, testing, deployment
- **Mobile Specialist:** NativeScript-Vue development
- **DevOps:** Docker, deployment, monitoring

---

## 📚 **Learning Opportunities**

This project offers hands-on experience with:
- ⚛️ Modern frontend frameworks (Vue.js 3, Nuxt.js)
- 🗄️ Database design and optimization
- 🔐 Authentication and security best practices
- 📱 Mobile app development
- 💳 Payment system integration
- 🌐 Real-time web applications
- 🐳 Containerization and deployment
- 🧪 Testing and quality assurance

---

## 🤝 **Client Commitment**

As your client, I provide:
- ✅ **Clear Requirements:** Detailed PRD and specifications
- ✅ **Regular Feedback:** Weekly review sessions
- ✅ **Technical Support:** Architecture guidance and mentoring
- ✅ **Real-World Context:** Industry best practices
- ✅ **Resource Access:** Cloud services, development tools
- ✅ **Career Guidance:** Professional development insights

---

## 📞 **Contact Information**

**Client:** Mejdi Sidki Hayzaran  
**Email:** shayzaran74@gmail.com  
**Project Repository:** [To be created]  
**Communication:** Weekly stand-ups + Slack/Discord  

---

## ❓ **Questions & Discussion**

Ready to discuss:
1. Technical implementation details
2. Team role assignments  
3. Development timeline adjustments
4. Technology preferences
5. Project scope clarifications

---

**Let's build something amazing together! 🚀**

*This project combines cutting-edge web technologies with real-world business requirements, providing an excellent learning experience and a portfolio-worthy application.*

---

## 🧱 Backend Architecture

### Directory Layout
```text
backend/
├── core/                 # Interfaces and abstractions
├── entities/             # Domain models (Prisma + DTOs)
├── business/             # Services and business rules
├── validation/           # Backend-focused Zod schemas
└── api/                  # HTTP/WS handlers and server actions
```

### Core Contracts (`core/`)
- `Repository<T>`: CRUD + query primitives (findMany with filters, pagination)
- `UnitOfWork`: transactional boundary across repositories
- `EventBus`: domain events (e.g., `OrderPaid`, `BidPlaced`)
- `Hasher`: bcrypt password hashing and verification
- `TokenService`: JWT access/refresh, TOTP operations
- `PaymentGateway`: `StripeGateway`, `PayPalGateway`
- `StorageService`: `S3Storage`, `CloudinaryStorage`
- `Cache`: Redis-backed caching primitives
- `Logger`: structured logging

### Domain Models (`entities/`)
Map to Prisma models with DTOs for API boundaries:
- `User`, `Wallet`, `Transaction`
- `Product`, `Category`
- `Order`, `OrderItem`, `Cart`
- `Auction`, `AuctionBid`
- `LotteryDraw`, `LotteryTicket`, `LotteryWinner`
- `Payment`, `Payout`
- `Notification`

Each entity has: id, timestamps, status enums, and invariants enforced in `business/`.

### Business Services (`business/`)
- `AuthService`: register/login/logout, refresh tokens, 2FA (TOTP), account lockout
- `UserService`: profile, avatar, preferences
- `WalletService`: deposits, withdrawals, internal transfers, ledger consistency
- `ProductService`: CRUD, approval workflow, inventory adjustments
- `OrderService`: cart → order, pricing, discounts, stock reservation, fulfillment
- `PaymentService`: charge/capture/refund, webhook processing, fraud checks
- `AuctionService`: create/schedule, bid validation, currentBid updates, winner selection, auto-extend
- `AutoBidService`: max-limit strategies, priority handling, anti-sniping
- `LotteryService`: ticket sales, draw execution, prize distribution, QR verification
- `NotificationService`: email/SMS/push dispatch, templates, retries

Rules live here, not in controllers. Services depend on `core` contracts, not concrete implementations.

### Validation (`validation/`)
Backend-centric Zod schemas for request/response with type inference.

Example:
```ts
import { z } from 'zod';

export const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  twoFactorEnabled: z.boolean().optional(),
});

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totp: z.string().length(6).optional(),
});

export const ProductCreateRequest = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  category: z.string(),
  images: z.array(z.string().url()).max(10),
});
```
Conventions: strict schemas, transform to DTOs, reusable partials, and shared enums.

### API Handlers (`api/`)
Fastify route modules (REST + WebSocket), server actions, and adapters.

Routes:
- `POST /api/v1/auth/register` → `AuthService.register` with `RegisterRequest`
- `POST /api/v1/auth/login` → `AuthService.login` with `LoginRequest`
- `POST /api/v1/auth/refresh` → `TokenService.refresh`
- `POST /api/v1/products` → `ProductService.create` with `ProductCreateRequest`
- `GET  /api/v1/products` → list with filters/pagination
- `POST /api/v1/cart/checkout` → `OrderService.checkout`
- `POST /api/v1/payments/stripe/webhook` → `PaymentService.onStripeWebhook`
- `WS   /ws/auctions/:id` → subscribe to bid updates

Handler pattern:
```ts
// api/products/create.ts
export default async function handler(req, reply) {
  const input = ProductCreateRequest.parse(req.body);
  const product = await productService.create(req.user.id, input);
  return reply.code(201).send({ data: product });
}
```

### API Conventions
- Pagination: `?page=1&limit=20`, response `{ data, meta: { page, limit, total } }`
- Filtering: `?q=search&category=...&priceMin=...&priceMax=...`
- Sorting: `?sort=createdAt:desc`
- Errors: `{ error: { code, message, details } }` with consistent codes
- Auth: Bearer JWT for access; HTTP-only cookie for refresh; CSRF for web forms
- Idempotency: `Idempotency-Key` header for POST payments/orders

### Real-time & Jobs
- WebSocket: auctions live updates, notifications channels per user
- Redis: pub/sub for auction rooms `auction:{id}`
- Job queues: payment retries, email/SMS, lottery drawings, auto-bid workers

### Security & Observability
- Rate limiting per IP/user, input sanitization, SQL injection/XSS protections
- Audit logs for critical actions (auth, payments, wallet, admin operations)
- Structured logs with correlation IDs, request tracing, and metrics (latency, error rates)

### Configuration
- `.env`: secrets and endpoints (DB, Redis, Stripe, PayPal, S3)
- Config module: typed access with defaults and schema validation

---

## 🎨 Frontend Architecture

### Applications
- Web (Nuxt 3 + TypeScript)
- Admin (Quasar + Vue 3 + TypeScript)
- Mobile (NativeScript-Vue)

### Shared Principles
- Strong typing, composition API, Pinia stores, file-based routing
- API client with JWT interceptors and refresh flow
- Real-time client for auctions/notifications

### Nuxt Web Structure
```text
apps/web/
├── components/
├── pages/
├── composables/
├── stores/                 # Pinia (e.g., `useUserStore`, `useCartStore`)
├── services/               # `apiClient`, `socketClient`
├── plugins/
├── middleware/             # auth/role guards
└── assets/ & layouts/
```

### Admin (Quasar)
```text
apps/admin/
├── src/components/
├── src/pages/
├── src/stores/
├── src/services/
└── src/router/
```
Focus: approvals, analytics, reporting, system monitoring.

### Mobile (NativeScript-Vue)
```text
apps/mobile/
├── app/components/
├── app/stores/
├── app/services/
└── app/app.vue
```
Focus: core shopping, wallet, auctions participation, notifications.

### Frontend Conventions
- State stores: `useUserStore`, `useCartStore`, `useProductStore`, `useAuctionStore`, `useLotteryStore`, `useWalletStore`
- API client: retries, exponential backoff, error normalization
- SSR auth: cookie-based refresh on server, client hydration preserves session
- Validation: light client-side checks; backend Zod is the source of truth
- Accessibility & i18n baseline

---
