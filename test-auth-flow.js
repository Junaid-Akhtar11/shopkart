/**
 * ShopKart Frontend Lab 02: End-to-End Integration Test Suite
 * Tests frontend Vite proxy on http://127.0.0.1:5173 connected to backend on port 5000.
 */

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:5173';

const log = (msg, pass = null) => {
  if (pass === true) console.log(`  \x1b[32m✔ PASS:\x1b[0m ${msg}`);
  else if (pass === false) console.log(`  \x1b[31m✘ FAIL:\x1b[0m ${msg}`);
  else console.log(msg);
};

async function runTestSuite() {
  console.log('\n=======================================================');
  console.log('   ShopKart Lab 02: Frontend Integration Test Suite');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  const testUser = {
    fullName: 'Jane Miller',
    email: `jane.miller.${Date.now()}@shopkart.com`,
    password: 'securePass123',
    phone: '9876543210',
  };

  let sessionCookie = '';

  // --- Task 1: Registration API & Validation ---
  console.log('--- Task 1: Registration API Tests ---');

  // Test 1: Missing Fields Validation
  try {
    const res = await fetch(`${BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Only Name' }),
    });
    if (res.status === 400) {
      log('POST /customers/register returns 400 when fields are missing', true);
      passed++;
    } else {
      log(`POST /customers/register returned status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Registration missing fields test error: ${e.message}`, false);
    failed++;
  }

  // Test 2: Short Password Validation
  try {
    const res = await fetch(`${BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testUser, password: '123' }),
    });
    if (res.status === 400) {
      log('POST /customers/register returns 400 when password is < 6 characters', true);
      passed++;
    } else {
      log(`POST /customers/register short password status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Registration short password test error: ${e.message}`, false);
    failed++;
  }

  // Test 3: Successful Registration
  try {
    const res = await fetch(`${BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.customer.email === testUser.email) {
      log('POST /customers/register returns 201 with created customer info', true);
      passed++;
    } else {
      log(`POST /customers/register failed: status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Registration success test error: ${e.message}`, false);
    failed++;
  }

  // Test 4: Duplicate Email Validation
  try {
    const res = await fetch(`${BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    if (res.status === 409) {
      log('POST /customers/register returns 409 Conflict when email already exists', true);
      passed++;
    } else {
      log(`POST /customers/register duplicate email status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Registration duplicate email test error: ${e.message}`, false);
    failed++;
  }

  // --- Task 2: Login API & Cookie Verification ---
  console.log('\n--- Task 2: Login API Tests ---');

  // Test 5: Invalid Password Failure
  try {
    const res = await fetch(`${BASE_URL}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'wrongPassword' }),
    });
    const data = await res.json();
    if (res.status === 401 && data.message === 'Invalid credentials') {
      log("POST /customers/login returns 401 'Invalid credentials' on incorrect password", true);
      passed++;
    } else {
      log(`POST /customers/login invalid password returned status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Login invalid password test error: ${e.message}`, false);
    failed++;
  }

  // Test 6: Successful Login & HttpOnly Cookie Issuance
  try {
    const res = await fetch(`${BASE_URL}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const data = await res.json();
    const rawCookie = res.headers.get('set-cookie');
    if (res.status === 200 && data.success && rawCookie && rawCookie.includes('token=')) {
      sessionCookie = rawCookie;
      log('POST /customers/login returns 200 and issues HttpOnly JWT cookie', true);
      passed++;
    } else {
      log(`POST /customers/login status ${res.status}, cookie: ${rawCookie}`, false);
      failed++;
    }
  } catch (e) {
    log(`Login success test error: ${e.message}`, false);
    failed++;
  }

  // --- Task 3: Protected Home Route (/customers/me) ---
  console.log('\n--- Task 3: Protected Route (/customers/me) Tests ---');

  // Test 7: Unauthorized Request without Cookie
  try {
    const res = await fetch(`${BASE_URL}/customers/me`);
    if (res.status === 401) {
      log('GET /customers/me without cookie is denied with 401 Unauthorized', true);
      passed++;
    } else {
      log(`GET /customers/me without cookie returned status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Protected route without cookie test error: ${e.message}`, false);
    failed++;
  }

  // Test 8: Authorized Request with HttpOnly Cookie
  try {
    const res = await fetch(`${BASE_URL}/customers/me`, {
      headers: { Cookie: sessionCookie },
    });
    const profile = await res.json();
    if (
      res.status === 200 &&
      profile.fullName === testUser.fullName &&
      profile.email === testUser.email &&
      profile.phone === testUser.phone &&
      !profile.password
    ) {
      log('GET /customers/me with cookie returns full customer profile (excluding password)', true);
      passed++;
    } else {
      log(`GET /customers/me with cookie returned status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Protected route with cookie test error: ${e.message}`, false);
    failed++;
  }

  // --- Task 4: Logout API & Session Invalidation ---
  console.log('\n--- Task 4: Logout API Tests ---');

  // Test 9: Successful Logout & Cookie Clearing
  let clearedCookieHeader = '';
  try {
    const res = await fetch(`${BASE_URL}/customers/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const data = await res.json();
    clearedCookieHeader = res.headers.get('set-cookie');
    if (res.status === 200 && data.success && clearedCookieHeader) {
      log('POST /customers/logout returns 200 and clears authentication cookie', true);
      passed++;
    } else {
      log(`POST /customers/logout returned status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Logout test error: ${e.message}`, false);
    failed++;
  }

  // Test 10: Accessing /customers/me with Cleared Cookie
  try {
    const res = await fetch(`${BASE_URL}/customers/me`, {
      headers: { Cookie: clearedCookieHeader || '' },
    });
    if (res.status === 401) {
      log('GET /customers/me after logout correctly fails with 401 Unauthorized', true);
      passed++;
    } else {
      log(`GET /customers/me after logout returned status ${res.status}`, false);
      failed++;
    }
  } catch (e) {
    log(`Post-logout access test error: ${e.message}`, false);
    failed++;
  }

  // Summary
  console.log('\n=======================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
