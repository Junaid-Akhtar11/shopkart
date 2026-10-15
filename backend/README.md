# Engineering Lab 01 — ShopKart: Customer Authentication Service

Backend authentication service for ShopKart built using Node.js, Express.js, MongoDB, Mongoose, bcrypt, jsonwebtoken, and cookie-parser.

---

## 📁 Project Structure

```text
backend/
│
├── controllers/
│   └── customer.controller.js      # Business logic: register, login, profile, logout, changePassword
│
├── models/
│   └── customer.model.js           # Mongoose Customer schema with bcrypt hash & validations
│
├── routes/
│   └── customer.routes.js          # Express Router mapping HTTP verbs/endpoints to controllers
│
├── middlewares/
│   └── auth.middleware.js          # JWT verification & HttpOnly cookie extraction middleware
│
├── utils/
│   └── generateToken.js            # JWT signing helper and secure cookie options
│
├── index.js                        # App setup, middleware pipeline, DB connection, & server bootstrap
├── .env                            # Environment configurations (Port, DB URI, JWT secret)
├── package.json                    # Project dependencies and lifecycle scripts
├── test.js                         # Comprehensive automated integration test suite (21/21 assertions)
└── ShopKart_Lab01.postman_collection.json # Ready-to-import Postman collection for TA evaluation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher (tested on Node v26)
- **MongoDB**: Running instance locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI

### 2. Installation
Navigate into the `backend/` folder:
```bash
cd backend
npm install
```

### 3. Environment Variables
Verify or edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=shopkart_super_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 4. Running the Server
To start the production server:
```bash
npm start
```
To run in development mode (auto-reload on code change):
```bash
npm run dev
```

### 5. Running the Automated Test Suite
To execute all 21 automated tests covering every acceptance criterion and failure case:
```bash
npm test
```

---

## 📡 API Reference & Endpoints

| Method | Endpoint | Access | Description | Status Code |
| :--- | :--- | :--- | :--- | :---: |
| **POST** | `/customers/register` | Public | Register a new customer | `201` / `400` / `409` |
| **POST** | `/customers/login` | Public | Authenticate customer & set HttpOnly cookie | `200` / `400` / `401` |
| **GET** | `/customers/me` | Protected | Fetch current customer profile | `200` / `401` |
| **POST** | `/customers/logout` | Protected | Clear auth cookie | `200` / `401` |
| **PATCH** | `/customers/change-password` | Protected | **(Bonus)** Change password with old password verification | `200` / `400` / `401` |

---

### Task 1: Customer Registration
- **Endpoint**: `POST /customers/register`
- **Request Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "password": "john123",
    "phone": "9876543210"
  }
  ```
- **Validation**:
  - Missing field: `400 Bad Request` -> `{"success": false, "message": "All fields are required"}`
  - Password < 6 chars: `400 Bad Request` -> `{"success": false, "message": "Password must contain at least 6 characters"}`
  - Duplicate email: `409 Conflict` -> `{"success": false, "message": "Email already exists"}`
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Customer registered successfully",
    "customer": {
      "_id": "6704b2b...",
      "fullName": "John Doe",
      "email": "john@gmail.com",
      "phone": "9876543210"
    }
  }
  ```

---

### Task 2: Customer Login
- **Endpoint**: `POST /customers/login`
- **Request Body**:
  ```json
  {
    "email": "john@gmail.com",
    "password": "john123"
  }
  ```
- **Behavior**:
  - Compares password hash using `bcrypt.compare`.
  - Signs JWT containing `{ id: customer._id }`.
  - Stores JWT in an `HttpOnly` cookie named `token`.
- **Failure (`401 Unauthorized`)**:
  - Does not leak whether email or password failed:
    `{"success": false, "message": "Invalid credentials"}`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "customer": {
      "_id": "6704b2b...",
      "fullName": "John Doe",
      "email": "john@gmail.com",
      "phone": "9876543210"
    }
  }
  ```

---

### Task 3: My Profile
- **Endpoint**: `GET /customers/me`
- **Headers / Cookie**: Requires `token` cookie (HttpOnly)
- **Failure (`401 Unauthorized`)**:
  `{"success": false, "message": "Unauthorized: Access denied, no token provided"}`
- **Success Response (`200 OK`)**:
  ```json
  {
    "_id": "6704b2b...",
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "phone": "9876543210"
  }
  ```

---

### Task 4: Logout
- **Endpoint**: `POST /customers/logout`
- **Headers / Cookie**: Requires `token` cookie
- **Behavior**: Calls `res.clearCookie('token')` with identical options.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### Bonus Challenge (+10 Marks): Change Password
- **Endpoint**: `PATCH /customers/change-password`
- **Headers / Cookie**: Requires `token` cookie
- **Request Body**:
  ```json
  {
    "oldPassword": "john123",
    "newPassword": "newjohn456"
  }
  ```
- **Behavior**:
  - Verifies old password with bcrypt.
  - Validates new password length $\ge 6$.
  - Hashes new password before saving to database.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

## 🎓 TA Viva Preparation Guide (Answers to All 5 Questions)

### Q1: Why do we use bcrypt instead of encrypting passwords?
> **Answer**:
> - **Encryption is two-way**: If data is encrypted, there is a decryption key. If a server or key is compromised, attackers can decrypt every password back to plaintext.
> - **Hashing with bcrypt is one-way**: Passwords can never be decrypted or converted back to plaintext. Authentication is verified by hashing the incoming password with the stored salt and comparing hashes.
> - **Built-in Salt**: bcrypt automatically generates a random salt per password, protecting against Rainbow Table attacks (precomputed hash lookups).
> - **Key-stretching & Adaptive Work Factor**: bcrypt uses a configurable cost factor (e.g. 10 rounds), making brute-force and GPU dictionary attacks computationally infeasible.

### Q2: What information is typically stored inside a JWT payload?
> **Answer**:
> - **Non-sensitive identity claims**: Typically unique non-sensitive identifiers such as the user's ID (`id: customer._id`), user role (`role: 'customer'`), and token metadata like issued-at (`iat`) and expiration time (`exp`).
> - **What NOT to store**: Passwords, hashes, credit card numbers, or personally identifiable information (PII) should **never** be stored in a JWT payload, because JWT payloads are only Base64Url-encoded (not encrypted) and can be easily decoded and read by anyone who sees the token.

### Q3: Why is the HttpOnly flag important for cookies?
> **Answer**:
> - The `HttpOnly` flag prevents client-side scripts (such as `document.cookie` in JavaScript) from accessing the cookie.
> - This serves as a vital defense against **Cross-Site Scripting (XSS)** attacks. Even if malicious JavaScript is injected into the client application, the attacker cannot read or steal the session JWT stored in an HttpOnly cookie.

### Q4: Why should passwords never be returned to the frontend?
> **Answer**:
> - Even if stored as bcrypt hashes, exposing password hashes over API responses exposes them to offline brute-force and rainbow table attacks.
> - It violates the principle of least privilege and zero-trust security. The frontend never needs the password or hash for UI rendering or application logic. Exposing it increases the attack surface in browser memory, logs, caching proxies, and network monitors.

### Q5: What is the purpose of authentication middleware?
> **Answer**:
> - **Separation of Concerns & Reusability**: Instead of duplicating token extraction and validation logic in every route controller, middleware intercepts incoming requests centrally before they reach route handlers.
> - **Access Control**: It inspects cookies or headers, validates the signature and expiration of the JWT, queries the database to confirm the user still exists, attaches the authenticated user object to `req.user`, and invokes `next()`. If invalid or missing, it blocks unauthorized requests immediately with HTTP 401.
