import "dotenv/config";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Customer from "./models/customer.model.js";
import Product from "./models/product.model.js";
import app, { connectDB } from "./index.js";

const PORT = 5002;
let server;
let testCustomer;
let testProduct1;
let testProduct2;
let authToken;

const runTests = async () => {
  console.log("==================================================");
  console.log("🧪 SHOPKART LAB 04 - WISHLIST API TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = "") => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} ${details ? "- " + details : ""}`);
      failed++;
    }
  };

  try {
    await connectDB();

    server = app.listen(PORT);
    const BASE_URL = `http://127.0.0.1:${PORT}`;

    // Clean up previous test customer if present
    await Customer.deleteMany({ email: "wishlist_test@shopkart.com" });

    // Ensure we have products in database
    let products = await Product.find().limit(2);
    if (products.length < 2) {
      console.log("Creating temporary products for testing...");
      testProduct1 = await Product.create({
        name: "Test Mechanical Keyboard",
        description: "Compact wireless mechanical keyboard with hot-swappable switches",
        price: 2999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
        stock: 10,
      });
      testProduct2 = await Product.create({
        name: "Test Noise Cancelling Headphones",
        description: "Over-ear Bluetooth headphones with active noise cancellation",
        price: 4999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        stock: 5,
      });
    } else {
      testProduct1 = products[0];
      testProduct2 = products[1];
    }

    // Create test customer
    testCustomer = await Customer.create({
      fullName: "Wishlist Test User",
      email: "wishlist_test@shopkart.com",
      password: "hashedpassword123",
      phone: "+919876543210",
      wishlist: [],
    });

    // Generate JWT token
    const secret = process.env.JWT_SECRET || "shopkart_super_secret_jwt_key_2026_secure";
    authToken = jwt.sign({ id: testCustomer._id }, secret, { expiresIn: "1h" });

    console.log("1. Running Test 1 — Add Product to Wishlist (POST /wishlist/:productId)");
    const addRes = await fetch(`${BASE_URL}/wishlist/${testProduct1._id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const addData = await addRes.json();
    assert(
      (addRes.status === 200 || addRes.status === 201) && addData.success === true,
      "Add product returns 200/201 success",
      `Status: ${addRes.status}, data: ${JSON.stringify(addData)}`
    );

    // Verify in database that Product ObjectId was saved
    const userInDb = await Customer.findById(testCustomer._id);
    assert(
      userInDb.wishlist.some((id) => id.toString() === testProduct1._id.toString()),
      "Product ObjectId persisted in user.wishlist in MongoDB"
    );

    console.log("\n2. Running Test 2 — Duplicate Prevention (POST /wishlist/:productId)");
    const dupRes = await fetch(`${BASE_URL}/wishlist/${testProduct1._id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 && dupData.success === false,
      "Duplicate addition returns 409 Conflict",
      `Status: ${dupRes.status}, message: ${dupData.message}`
    );

    console.log("\n3. Running Test 3 — Get Current User's Wishlist with populate (GET /wishlist)");
    const getRes = await fetch(`${BASE_URL}/wishlist`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const getData = await getRes.json();
    assert(
      getRes.status === 200 &&
        getData.success === true &&
        getData.count === 1 &&
        Array.isArray(getData.wishlist) &&
        getData.wishlist[0]._id.toString() === testProduct1._id.toString() &&
        getData.wishlist[0].name === testProduct1.name &&
        typeof getData.wishlist[0].price === "number",
      "Get wishlist returns populated product details and correct count",
      `Status: ${getRes.status}, count: ${getData.count}`
    );

    console.log("\n4. Running Test 4 — Remove Product from Wishlist (DELETE /wishlist/:productId)");
    const delRes = await fetch(`${BASE_URL}/wishlist/${testProduct1._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const delData = await delRes.json();
    assert(
      delRes.status === 200 && delData.success === true,
      "Remove product returns 200 success",
      `Status: ${delRes.status}, message: ${delData.message}`
    );

    // Verify in DB that it is removed
    const userAfterDel = await Customer.findById(testCustomer._id);
    assert(
      !userAfterDel.wishlist.some((id) => id.toString() === testProduct1._id.toString()),
      "Product ObjectId removed from user.wishlist in MongoDB"
    );

    console.log("\n5. Running Test 4b — Remove Non-wishlisted Product (DELETE /wishlist/:productId)");
    const delAgainRes = await fetch(`${BASE_URL}/wishlist/${testProduct1._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const delAgainData = await delAgainRes.json();
    assert(
      delAgainRes.status === 404 && delAgainData.success === false,
      "Removing item not in wishlist returns 404 Not Found",
      `Status: ${delAgainRes.status}, message: ${delAgainData.message}`
    );

    console.log("\n6. Running Test 5 — Unauthenticated Access (GET /wishlist without token)");
    const unauthRes = await fetch(`${BASE_URL}/wishlist`, {
      method: "GET",
    });
    assert(
      unauthRes.status === 401,
      "Unauthenticated request returns 401 Unauthorized",
      `Status: ${unauthRes.status}`
    );

    console.log("\n7. Running Test 6 — Invalid Product ID validation (POST /wishlist/invalidId)");
    const invalidIdRes = await fetch(`${BASE_URL}/wishlist/invalid-id-xyz`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    assert(
      invalidIdRes.status === 400,
      "Invalid product ID returns 400 Bad Request",
      `Status: ${invalidIdRes.status}`
    );

    console.log("\n8. Running Test 7 — Non-existent Product ID (POST /wishlist/<randomId>)");
    const fakeObjectId = new mongoose.Types.ObjectId();
    const missingRes = await fetch(`${BASE_URL}/wishlist/${fakeObjectId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    assert(
      missingRes.status === 404,
      "Non-existent product returns 404 Not Found",
      `Status: ${missingRes.status}`
    );

    console.log("\n9. Running Bonus Test 23 — Wishlist Toggle (PATCH /wishlist/:productId/toggle)");
    // First toggle: adds item
    const toggleAddRes = await fetch(`${BASE_URL}/wishlist/${testProduct2._id}/toggle`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const toggleAddData = await toggleAddRes.json();
    assert(
      toggleAddRes.status === 200 && toggleAddData.saved === true,
      "Toggle on adds product and returns saved: true",
      `Status: ${toggleAddRes.status}, saved: ${toggleAddData.saved}`
    );

    // Second toggle: removes item
    const toggleRemRes = await fetch(`${BASE_URL}/wishlist/${testProduct2._id}/toggle`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const toggleRemData = await toggleRemRes.json();
    assert(
      toggleRemRes.status === 200 && toggleRemData.saved === false,
      "Toggle off removes product and returns saved: false",
      `Status: ${toggleRemRes.status}, saved: ${toggleRemData.saved}`
    );

    console.log("\n10. Running Bonus Test 24 — Wishlist Count (GET /wishlist/count)");
    // Add product 1 again to test count
    await fetch(`${BASE_URL}/wishlist/${testProduct1._id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const countRes = await fetch(`${BASE_URL}/wishlist/count`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const countData = await countRes.json();
    assert(
      countRes.status === 200 && countData.count === 1,
      "Wishlist count returns correct count: 1",
      `Status: ${countRes.status}, count: ${countData.count}`
    );

    // Clean up test customer
    await Customer.deleteMany({ email: "wishlist_test@shopkart.com" });

    console.log("\n==================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
};

runTests();
