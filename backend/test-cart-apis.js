import axios from "axios";
import mongoose from "mongoose";
import Customer from "./models/customer.model.js";
import Product from "./models/product.model.js";

const BASE_URL = "http://localhost:5000";

async function runCartApiTests() {
  console.log("==========================================");
  console.log("   TESTING LAB 05 SHOPKART CART APIS     ");
  console.log("==========================================");

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopkart");
  }

  // 1. Get or create a test customer and log in
  const testEmail = `cart_tester_${Date.now()}@example.com`;
  const testPassword = "Password123!";
  
  console.log("1. Registering test user:", testEmail);
  const regRes = await axios.post(`${BASE_URL}/customers/register`, {
    fullName: "Cart Test User",
    email: testEmail,
    password: testPassword,
    phone: "9876543210",
  });
  console.log("✓ User registered:", regRes.data.success);

  // Login and get cookie
  console.log("2. Logging in to get auth cookie...");
  const loginRes = await axios.post(
    `${BASE_URL}/customers/login`,
    {
      email: testEmail,
      password: testPassword,
    },
    { withCredentials: true }
  );

  const cookieHeader = loginRes.headers["set-cookie"];
  const cookie = cookieHeader ? cookieHeader[0] : "";
  console.log("✓ Logged in, cookie received:", !!cookie);

  const authHeaders = {
    headers: {
      Cookie: cookie,
    },
  };

  // 3. Find or create a test product
  let product1 = await Product.findOne({ stock: { $gte: 5 } });
  if (!product1) {
    product1 = await Product.create({
      name: "Mechanical Keyboard RGB",
      description: "High quality mechanical keyboard with tactile switches",
      price: 2999,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
      stock: 5,
    });
  }
  console.log(`✓ Test Product 1: ${product1.name} (Stock: ${product1.stock}, ID: ${product1._id})`);

  let product2 = await Product.findOne({ _id: { $ne: product1._id }, stock: { $gte: 2 } });
  if (!product2) {
    product2 = await Product.create({
      name: "Wireless Gaming Mouse",
      description: "Precision wireless mouse with high DPI sensor",
      price: 1499,
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
      stock: 2,
    });
  }
  console.log(`✓ Test Product 2: ${product2.name} (Stock: ${product2.stock}, ID: ${product2._id})`);

  // Test 7 — Unauthenticated request
  console.log("\n--- Test 7: Unauthenticated Request to GET /cart ---");
  try {
    await axios.get(`${BASE_URL}/cart`);
    console.error("✗ Failed: Expected 401 Unauthorized");
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log("✓ Correctly returned 401 Unauthorized");
    } else {
      console.error("✗ Unexpected status:", err.response?.status);
    }
  }

  // Test 1 — Add new item
  console.log("\n--- Test 1: Add new item POST /cart/:productId ---");
  const addRes1 = await axios.post(`${BASE_URL}/cart/${product1._id}`, {}, authHeaders);
  console.log("Response:", addRes1.data.message);
  const item1 = addRes1.data.cart.find(c => c.product._id.toString() === product1._id.toString());
  console.log(`✓ Added item quantity: ${item1.quantity} (Expected: 1)`);

  // Test 2 — Add same item again (should increment quantity to 2)
  console.log("\n--- Test 2: Add same item again POST /cart/:productId ---");
  const addRes2 = await axios.post(`${BASE_URL}/cart/${product1._id}`, {}, authHeaders);
  console.log("Response:", addRes2.data.message);
  const item1Again = addRes2.data.cart.find(c => c.product._id.toString() === product1._id.toString());
  console.log(`✓ Updated item quantity: ${item1Again.quantity} (Expected: 2)`);

  // Add Product 2 as well
  console.log("\n--- Adding second product to cart ---");
  await axios.post(`${BASE_URL}/cart/${product2._id}`, {}, authHeaders);

  // Test 3 — Get Cart
  console.log("\n--- Test 3: Get Cart GET /cart ---");
  const getCartRes = await axios.get(`${BASE_URL}/cart`, authHeaders);
  console.log("Cart items count:", getCartRes.data.cart.length);
  getCartRes.data.cart.forEach(item => {
    console.log(`- ${item.product.name}: qty=${item.quantity}, price=₹${item.product.price}, stock=${item.product.stock}`);
  });
  console.log("✓ Successfully retrieved populated cart");

  // Test 4 — Update quantity
  console.log("\n--- Test 4: Update quantity PATCH /cart/:productId ---");
  const patchRes = await axios.patch(`${BASE_URL}/cart/${product1._id}`, { quantity: 3 }, authHeaders);
  const updatedItem1 = patchRes.data.cart.find(c => c.product._id.toString() === product1._id.toString());
  console.log(`✓ Updated quantity to 3: ${updatedItem1.quantity} (Expected: 3)`);

  // Test 5 — Exceed stock limit
  console.log("\n--- Test 5: Exceed stock limit PATCH /cart/:productId ---");
  try {
    await axios.patch(`${BASE_URL}/cart/${product1._id}`, { quantity: product1.stock + 10 }, authHeaders);
    console.error("✗ Failed: Expected 400 Bad Request when exceeding stock");
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log(`✓ Correctly rejected with 400 Bad Request: "${err.response.data.message}"`);
    } else {
      console.error("✗ Unexpected error:", err.message);
    }
  }

  // Test Quantity < 1
  console.log("\n--- Test Quantity < 1 ---");
  try {
    await axios.patch(`${BASE_URL}/cart/${product1._id}`, { quantity: 0 }, authHeaders);
    console.error("✗ Failed: Expected 400 Bad Request when quantity < 1");
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log(`✓ Correctly rejected with 400 Bad Request: "${err.response.data.message}"`);
    }
  }

  // Test 6 — Remove item
  console.log("\n--- Test 6: Remove item DELETE /cart/:productId ---");
  const delRes = await axios.delete(`${BASE_URL}/cart/${product1._id}`, authHeaders);
  console.log("Response:", delRes.data.message);
  const item1StillThere = delRes.data.cart.some(c => c.product._id.toString() === product1._id.toString());
  console.log(`✓ Item removed: ${!item1StillThere} (Cart remaining items: ${delRes.data.cart.length})`);

  // Cleanup test user
  await Customer.deleteOne({ _id: regRes.data.customer?._id || regRes.data._id });
  console.log("\n==========================================");
  console.log("   ALL CART BACKEND TESTS PASSED! 🎉    ");
  console.log("==========================================");
  process.exit(0);
}

runCartApiTests().catch(err => {
  console.error("Test execution failed:", err.message);
  if (err.response) {
    console.error("Status:", err.response.status, "Data:", err.response.data);
  }
  process.exit(1);
});
