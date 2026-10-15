# 🛒 ShopKart — Full Stack MERN E-Commerce Platform

A production-ready, feature-rich Full Stack E-Commerce platform built with the **MERN** stack (MongoDB, Express.js, React 19, Node.js). This repository consolidates all engineering lab milestones (**Lab 1 through Lab 6**) into a unified, modular monorepo project.

---

## 📑 Table of Contents

- [Overview & Lab Progression](#-overview--lab-progression)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Folder Structure](#-folder-structure)
- [Core Features](#-core-features)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation & Running](#installation--running)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Postman Collections](#-postman-collections)
- [Author & License](#-author--license)

---

## 🌟 Overview & Lab Progression

ShopKart represents the incremental engineering of an enterprise-grade e-commerce application across 6 labs:

| Lab | Milestone | Key Deliverables |
|:---|:---|:---|
| **Lab 01** | Customer Authentication Backend | Express backend, MongoDB schemas, JWT authentication via HttpOnly cookies, bcrypt hashing, automated integration tests. |
| **Lab 02** | Customer Authentication UI | React 19 SPA, Vite, Axios with cookie credentials, authentication flow (Login, Register, Dashboard, Logout). |
| **Lab 03** | Product Catalog & Discovery | Product REST API, MongoDB pagination, category & price filters, search, Product Grid and Details pages. |
| **Lab 04** | Customer Wishlist Service | Wishlist data model & routes, add/remove favorites, wishlist badge indicator, instant UI state synchronization. |
| **Lab 05** | Persistent Shopping Cart | Cart CRUD API with stock validation, real-time quantity controls, subtotal/tax/shipping breakdown calculation. |
| **Lab 06** | Checkout & Order Lifecycle with Razorpay | Multi-step checkout, Razorpay payment gateway integration, order creation & verification, order history page, invoice download. |

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/) (`withCredentials: true`)
- **Styling**: Vanilla CSS design system with custom variables, glassmorphism, responsive grids, and micro-interactions
- **Linting**: [Oxlint](https://oxc-project.github.io/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Security**: [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing, [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) for token generation, [cookie-parser](https://github.com/expressjs/cookie-parser) for HttpOnly cookies
- **Payment Processing**: [Razorpay](https://razorpay.com/) Node SDK & Webhooks

---

## 📁 Folder Structure

```text
shopkart/
├── backend/                       # Express.js REST API & Database layer
│   ├── config/                    # DB connection & external service configurations
│   ├── controllers/               # Business logic
│   │   ├── auth.controller.js     # Authentication (Register, Login, Me, Logout)
│   │   ├── customer.controller.js # Customer profile & credentials management
│   │   ├── product.controller.js  # Catalog, search, filters & details
│   │   ├── wishlist.controller.js # Wishlist management
│   │   ├── cart.controller.js     # Shopping cart operations & stock validations
│   │   └── order.controller.js    # Razorpay orders, verification & order history
│   ├── middlewares/               # Authentication guard & error handlers
│   ├── models/                    # Mongoose Data Models (Customer, Product, Wishlist, Cart, Order)
│   ├── routes/                    # API Route definitions
│   ├── seeds/                     # Database seeders (product inventory)
│   ├── utils/                     # JWT helpers & cookie configuration
│   ├── test.js                    # Auth integration test suite
│   ├── test-product-apis.js       # Product catalog test suite
│   ├── test-wishlist-apis.js      # Wishlist test suite
│   ├── test-cart-apis.js          # Cart test suite
│   ├── test-order-apis.js         # Order & checkout test suite
│   ├── index.js                   # Server entrypoint
│   └── package.json               # Backend dependencies and scripts
│
├── src/                           # React frontend application
│   ├── components/                # Reusable UI components (Navbar, ProductCard, CartItem, etc.)
│   ├── pages/                     # Full-page views
│   │   ├── Home.jsx               # Landing page & featured showcase
│   │   ├── Products.jsx           # Filterable & searchable product catalog
│   │   ├── ProductDetails.jsx     # Detailed product view with gallery & reviews
│   │   ├── Cart.jsx               # Shopping cart & cost calculation
│   │   ├── Wishlist.jsx           # User saved items
│   │   ├── Checkout.jsx           # Multi-step checkout with Razorpay gateway
│   │   ├── Orders.jsx             # Order history and status tracking
│   │   ├── OrderSuccess.jsx       # Post-payment confirmation receipt
│   │   ├── Login.jsx              # Customer sign in
│   │   └── Register.jsx           # Customer registration
│   ├── services/                  # Axios API client & Razorpay script loader
│   ├── App.jsx                    # Routing & global auth/cart/wishlist state
│   ├── main.jsx                   # React root entry
│   └── index.css                  # Modern CSS design system
│
├── postman/                       # Ready-to-import Postman collections
│   ├── ShopKart_Lab01.postman_collection.json
│   └── ShopKart_Lab04_Wishlist.postman_collection.json
│
├── test-auth-flow.js              # Frontend E2E authentication test script
├── test-e2e-catalog.js            # Frontend E2E catalog test script
├── vite.config.js                 # Vite development proxy configuration
├── package.json                   # Root workspace scripts & client dependencies
└── README.md                      # Comprehensive project documentation
```

---

## 🚀 Core Features

1. **Authentication & User Management**:
   - Secure sign up & sign in using bcrypt-hashed passwords.
   - JWT tokens stored strictly in HttpOnly, SameSite cookies for robust XSS/CSRF defense.
   - Profile updating and password change functionality.

2. **Catalog & Product Discovery**:
   - Full product listing with category filtering, price sliders, sorting, and live text search.
   - Pagination and responsive product cards with badge indicators.
   - Detailed product view with high-res images, stock status, ratings, and descriptions.

3. **Customer Wishlist**:
   - One-click toggle to save favorite products.
   - Dedicated Wishlist view with quick "Move to Cart" actions.

4. **Cart & Inventory Management**:
   - Real-time quantity adjustment with stock limit protection.
   - Dynamic order summary calculation (subtotal, shipping, estimated tax, final total).

5. **Checkout & Razorpay Payments**:
   - Shipping address validation.
   - Seamless checkout popup modal using the official Razorpay Checkout SDK.
   - Cryptographic server-side HMAC signature verification before order confirmation.
   - Detailed order invoice and status timeline (Pending, Placed, Shipped, Delivered).

---

## 📡 API Endpoints

### Authentication (`/auth` & `/customers`)
- `POST /auth/register` — Create new customer account
- `POST /auth/login` — Sign in and obtain HttpOnly session cookie
- `GET /auth/me` — Retrieve active session profile
- `POST /auth/logout` — Invalidate session and clear cookies
- `PUT /customers/profile` — Update customer information
- `PUT /customers/password` — Change password

### Products (`/products`)
- `GET /products` — Query products (supports `page`, `limit`, `search`, `category`, `sort`, `minPrice`, `maxPrice`)
- `GET /products/:id` — Fetch single product by ID

### Wishlist (`/wishlist`)
- `GET /wishlist` — Get logged-in user's wishlist
- `POST /wishlist/toggle` — Add or remove product from wishlist

### Cart (`/cart`)
- `GET /cart` — Get active user's cart
- `POST /cart/add` — Add item to cart
- `PUT /cart/update` — Update item quantity
- `DELETE /cart/remove/:productId` — Remove specific item
- `DELETE /cart/clear` — Clear entire cart

### Orders (`/orders`)
- `POST /orders/checkout` — Initialize order & generate Razorpay order ID
- `POST /orders/verify` — Verify Razorpay signature & finalize purchase
- `GET /orders/my-orders` — List authenticated user's order history
- `GET /orders/:id` — Get specific order details

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance running on port `27017` or a MongoDB Atlas connection string
- **npm** or **yarn**

### Environment Variables

Both root and backend include a `.env.example`. Create a `.env` in `backend/`:

```bash
cp backend/.env.example backend/.env
```

Set the values in `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Installation & Running

1. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Seed Initial Products**:
   ```bash
   npm run seed
   ```

3. **Start the Backend Server**:
   ```bash
   npm run dev
   # Server runs on http://127.0.0.1:5000
   ```

4. **Install & Start the Frontend** (in a separate terminal):
   ```bash
   # From root directory
   npm install
   npm run dev
   # Client runs on http://localhost:5173
   ```

---

## 🧪 Testing & Quality Assurance

Run any of the automated test suites to verify functionality:

### Backend Tests
```bash
# Run from backend directory:
cd backend

# All backend tests
npm run test:all

# Specific test suites
npm run test:auth
npm run test:products
npm run test:wishlist
npm run test:cart
npm run test:orders
```

### Frontend Tests
```bash
# Run from root directory:
npm run test:auth
npm run test:catalog
```

---

## 📬 Postman Collections

Pre-configured Postman collections are included in the `postman/` directory:
- `postman/ShopKart_Lab01.postman_collection.json` (Auth endpoints)
- `postman/ShopKart_Lab04_Wishlist.postman_collection.json` (Wishlist & Catalog endpoints)

To test:
1. Open Postman.
2. Click **Import** and select the JSON files from `postman/`.
3. Ensure the backend server is running on `http://127.0.0.1:5000`.

---

## 📄 License
This project is developed for educational and engineering evaluation purposes under the **ISC License**.
