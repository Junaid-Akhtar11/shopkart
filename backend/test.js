import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "./index.js";
import Customer from "./models/customer.model.js";

const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Test Runner Helper
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   ShopKart Lab 01: Comprehensive Test Suite");
  console.log("=======================================================\n");

  // Wait for MongoDB to connect
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once("connected", resolve);
    });
  }

  // Start test server
  const server = app.listen(TEST_PORT);
  await new Promise((resolve) => server.once("listening", resolve));

  try {
    const testEmail = "john.doe.lab1@example.com";
    await Customer.deleteMany({ email: testEmail });

    // ----------------------------------------------------
    // TEST GROUP 1: Registration API (Task 1)
    // ----------------------------------------------------
    console.log("\x1b[34m--- Task 1: Registration API ---\x1b[0m");

    // 1.1 Missing fields -> 400
    const resMissing = await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "John Doe", email: testEmail }),
    });
    const bodyMissing = await resMissing.json();
    assert(
      resMissing.status === 400 && bodyMissing.success === false,
      "POST /customers/register returns 400 when required fields are missing"
    );

    // 1.2 Password too short (< 6 chars) -> 400
    const resShortPass = await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "John Doe",
        email: testEmail,
        password: "123",
        phone: "9876543210",
      }),
    });
    const bodyShortPass = await resShortPass.json();
    assert(
      resShortPass.status === 400 &&
        bodyShortPass.message.includes("6 characters"),
      "POST /customers/register returns 400 when password is < 6 characters"
    );

    // 1.3 Successful registration -> 201
    const resReg = await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "John Doe",
        email: testEmail,
        password: "password123",
        phone: "9876543210",
      }),
    });
    const bodyReg = await resReg.json();
    assert(
      resReg.status === 201 &&
        bodyReg.success === true &&
        bodyReg.customer &&
        bodyReg.customer.email === testEmail &&
        bodyReg.customer.fullName === "John Doe" &&
        bodyReg.customer.phone === "9876543210" &&
        !bodyReg.customer.password,
      "POST /customers/register returns 201 with created customer info (excluding password)"
    );

    // 1.4 Database Check: Bcrypt Hash verification
    const dbCustomer = await Customer.findOne({ email: testEmail }).select(
      "+password"
    );
    const isBcryptHash =
      dbCustomer &&
      dbCustomer.password.startsWith("$2") &&
      dbCustomer.password !== "password123";
    assert(
      isBcryptHash,
      "Database validation: Password is stored strictly as a bcrypt hash ($2...)"
    );

    // 1.5 Duplicate email -> 409
    const resDup = await fetch(`${BASE_URL}/customers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Duplicate User",
        email: testEmail,
        password: "password123",
        phone: "9123456789",
      }),
    });
    const bodyDup = await resDup.json();
    assert(
      resDup.status === 409 && bodyDup.success === false,
      "POST /customers/register returns 409 Conflict when email already exists"
    );

    // ----------------------------------------------------
    // TEST GROUP 2: Login API (Task 2)
    // ----------------------------------------------------
    console.log("\n\x1b[34m--- Task 2: Login API ---\x1b[0m");

    // 2.1 Missing credentials -> 400
    const resLoginMissing = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    assert(
      resLoginMissing.status === 400,
      "POST /customers/login returns 400 when password is missing"
    );

    // 2.2 Wrong password -> 401 (generic message)
    const resWrongPass = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "wrongPassword!",
      }),
    });
    const bodyWrongPass = await resWrongPass.json();
    assert(
      resWrongPass.status === 401 &&
        bodyWrongPass.message === "Invalid credentials",
      "POST /customers/login returns 401 'Invalid credentials' on incorrect password"
    );

    // 2.3 Wrong email -> 401 (generic message)
    const resWrongEmail = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@example.com",
        password: "password123",
      }),
    });
    const bodyWrongEmail = await resWrongEmail.json();
    assert(
      resWrongEmail.status === 401 &&
        bodyWrongEmail.message === "Invalid credentials",
      "POST /customers/login returns 401 'Invalid credentials' on non-existent email"
    );

    // 2.4 Successful login -> 200 & HttpOnly Cookie with JWT
    const resLogin = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "password123",
      }),
    });
    const bodyLogin = await resLogin.json();
    const setCookieHeader = resLogin.headers.get("set-cookie") || "";

    const hasTokenCookie = setCookieHeader.includes("token=");
    const isHttpOnly = setCookieHeader.toLowerCase().includes("httponly");

    // Extract cookie value for subsequent requests
    const cookieMatch = setCookieHeader.match(/token=([^;]+)/);
    const authCookie = cookieMatch ? `token=${cookieMatch[1]}` : "";
    const rawToken = cookieMatch ? cookieMatch[1] : "";

    assert(
      resLogin.status === 200 &&
        bodyLogin.success === true &&
        bodyLogin.message === "Login successful" &&
        bodyLogin.customer &&
        !bodyLogin.customer.password,
      "POST /customers/login returns 200 with customer info excluding password"
    );

    assert(
      hasTokenCookie && isHttpOnly,
      "POST /customers/login sets HttpOnly cookie with JWT token"
    );

    // Verify JWT payload
    const decodedJwt = jwt.verify(rawToken, process.env.JWT_SECRET);
    assert(
      decodedJwt && decodedJwt.id === String(dbCustomer._id),
      "JWT verification: Token payload correctly stores customer ID"
    );

    // ----------------------------------------------------
    // TEST GROUP 3: My Profile API (Task 3)
    // ----------------------------------------------------
    console.log("\n\x1b[34m--- Task 3: My Profile API ---\x1b[0m");

    // 3.1 Unauthenticated access -> 401
    const resUnauthProfile = await fetch(`${BASE_URL}/customers/me`);
    assert(
      resUnauthProfile.status === 401,
      "GET /customers/me without cookie returns 401 Unauthorized"
    );

    // 3.2 Invalid/tampered token -> 401
    const resTamperedProfile = await fetch(`${BASE_URL}/customers/me`, {
      headers: { Cookie: "token=invalid_tampered_token_string" },
    });
    assert(
      resTamperedProfile.status === 401,
      "GET /customers/me with invalid token returns 401 Unauthorized"
    );

    // 3.3 Authenticated profile access -> 200
    const resAuthProfile = await fetch(`${BASE_URL}/customers/me`, {
      headers: { Cookie: authCookie },
    });
    const bodyAuthProfile = await resAuthProfile.json();
    assert(
      resAuthProfile.status === 200 &&
        bodyAuthProfile._id === String(dbCustomer._id) &&
        bodyAuthProfile.fullName === "John Doe" &&
        bodyAuthProfile.email === testEmail &&
        bodyAuthProfile.phone === "9876543210" &&
        bodyAuthProfile.password === undefined,
      "GET /customers/me with valid cookie returns customer profile with exact required fields and no password"
    );

    // ----------------------------------------------------
    // TEST GROUP 4: Bonus Challenge - Change Password
    // ----------------------------------------------------
    console.log("\n\x1b[34m--- Bonus Challenge: Change Password API ---\x1b[0m");

    // 4.1 Unauthenticated -> 401
    const resUnauthChange = await fetch(`${BASE_URL}/customers/change-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldPassword: "password123",
        newPassword: "newpassword456",
      }),
    });
    assert(
      resUnauthChange.status === 401,
      "PATCH /customers/change-password without auth returns 401 Unauthorized"
    );

    // 4.2 Incorrect old password -> 401
    const resWrongOld = await fetch(`${BASE_URL}/customers/change-password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        oldPassword: "wrongOldPassword",
        newPassword: "newpassword456",
      }),
    });
    assert(
      resWrongOld.status === 401,
      "PATCH /customers/change-password with incorrect old password returns 401"
    );

    // 4.3 New password too short -> 400
    const resShortNew = await fetch(`${BASE_URL}/customers/change-password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        oldPassword: "password123",
        newPassword: "123",
      }),
    });
    assert(
      resShortNew.status === 400,
      "PATCH /customers/change-password with short new password returns 400"
    );

    // 4.4 Successful change password -> 200
    const resChangeSuccess = await fetch(
      `${BASE_URL}/customers/change-password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: authCookie,
        },
        body: JSON.stringify({
          oldPassword: "password123",
          newPassword: "newpassword456",
        }),
      }
    );
    const bodyChangeSuccess = await resChangeSuccess.json();
    assert(
      resChangeSuccess.status === 200 &&
        bodyChangeSuccess.message === "Password changed successfully",
      "PATCH /customers/change-password returns 200 'Password changed successfully'"
    );

    // 4.5 Login with old password fails -> 401
    const resLoginOld = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "password123",
      }),
    });
    assert(
      resLoginOld.status === 401,
      "Login with old password fails with 401 after change"
    );

    // 4.6 Login with new password succeeds -> 200
    const resLoginNew = await fetch(`${BASE_URL}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "newpassword456",
      }),
    });
    const newCookieHeader = resLoginNew.headers.get("set-cookie") || "";
    const newCookieMatch = newCookieHeader.match(/token=([^;]+)/);
    const newAuthCookie = newCookieMatch ? `token=${newCookieMatch[1]}` : "";

    assert(
      resLoginNew.status === 200,
      "Login with new password succeeds with 200"
    );

    // ----------------------------------------------------
    // TEST GROUP 5: Logout API (Task 4)
    // ----------------------------------------------------
    console.log("\n\x1b[34m--- Task 4: Logout API ---\x1b[0m");

    // 5.1 Successful logout -> 200 & clears cookie
    const resLogout = await fetch(`${BASE_URL}/customers/logout`, {
      method: "POST",
      headers: { Cookie: newAuthCookie },
    });
    const bodyLogout = await resLogout.json();
    const logoutCookieHeader = resLogout.headers.get("set-cookie") || "";

    const clearsCookie =
      logoutCookieHeader.includes("token=;") ||
      logoutCookieHeader.includes("Expires=") ||
      logoutCookieHeader.includes("Max-Age=0");

    assert(
      resLogout.status === 200 &&
        bodyLogout.message === "Logged out successfully" &&
        clearsCookie,
      "POST /customers/logout returns 200 'Logged out successfully' and clears token cookie"
    );

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log("\n=======================================================");
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================\n");

    // Cleanup test user
    await Customer.deleteMany({ email: testEmail });

    server.close();
    await mongoose.disconnect();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
