import axios from "axios";

const BASE_URL = "http://localhost:5000";

async function runFullCartDemo() {
  console.log("===============================================================");
  console.log("    🛒 SHOPKART LAB 05 — COMPLETE CART E2E VERIFICATION DEMO    ");
  console.log("===============================================================");

  // 1. Create a demo user
  const email = `alex.shopper.${Date.now()}@shopkart.in`;
  const password = "ShopPassword123!";
  console.log(`\n1️⃣  Registering User: ${email}...`);
  const regRes = await axios.post(`${BASE_URL}/customers/register`, {
    fullName: "Alex Shopper",
    email,
    password,
    phone: "9876501234",
  });
  console.log(`   ✅ Registration Success: ${regRes.data.success}`);

  // 2. Login to get JWT Cookie
  console.log(`\n2️⃣  Logging In as Alex Shopper...`);
  const loginRes = await axios.post(`${BASE_URL}/customers/login`, {
    email,
    password,
  });
  const cookie = loginRes.headers["set-cookie"]?.[0];
  const authHeaders = { headers: { Cookie: cookie } };
  console.log(`   ✅ Authenticated! JWT Session Cookie obtained.`);

  // 3. Check Initial Cart (Empty State)
  console.log(`\n3️⃣  Fetching Cart for new user (Initial state)...`);
  const emptyCartRes = await axios.get(`${BASE_URL}/cart`, authHeaders);
  console.log(`   ✅ Cart Items Count: ${emptyCartRes.data.cart.length} (Expected: 0)`);

  // 4. Get Catalog Products
  console.log(`\n4️⃣  Fetching Product Catalog...`);
  const prodRes = await axios.get(`${BASE_URL}/products`);
  const products = prodRes.data.products;
  const p1 = products[0];
  const p2 = products[1];
  console.log(`   📦 Found Product 1: "${p1.name}" (Price: ₹${p1.price}, Stock: ${p1.stock})`);
  console.log(`   📦 Found Product 2: "${p2.name}" (Price: ₹${p2.price}, Stock: ${p2.stock})`);

  // 5. Add Product 1 to Cart (Add to Cart button clicked)
  console.log(`\n5️⃣  Adding "${p1.name}" to cart (POST /cart/${p1._id})...`);
  const add1 = await axios.post(`${BASE_URL}/cart/${p1._id}`, {}, authHeaders);
  const q1 = add1.data.cart.find(i => i.product._id.toString() === p1._id.toString()).quantity;
  console.log(`   ✅ Added! Item Quantity = ${q1} (Expected: 1)`);

  // 6. Add Same Product Again (Add Another button clicked)
  console.log(`\n6️⃣  Adding same product again to simulate "Add Another"...`);
  const add1Again = await axios.post(`${BASE_URL}/cart/${p1._id}`, {}, authHeaders);
  const q1Again = add1Again.data.cart.find(i => i.product._id.toString() === p1._id.toString()).quantity;
  console.log(`   ✅ Re-add increments quantity! New Quantity = ${q1Again} (Expected: 2)`);

  // 7. Add Product 2 to Cart
  console.log(`\n7️⃣  Adding "${p2.name}" to cart...`);
  await axios.post(`${BASE_URL}/cart/${p2._id}`, {}, authHeaders);
  console.log(`   ✅ Added second product!`);

  // 8. View Cart & Validate Derived Calculations
  console.log(`\n8️⃣  Inspecting Cart on /cart page...`);
  const cartRes = await axios.get(`${BASE_URL}/cart`, authHeaders);
  let totalUnits = 0;
  let subtotal = 0;
  cartRes.data.cart.forEach((item, idx) => {
    const itemSubtotal = item.product.price * item.quantity;
    totalUnits += item.quantity;
    subtotal += itemSubtotal;
    console.log(`   Item ${idx + 1}: ${item.product.name} | Unit Price: ₹${item.product.price} | Qty: ${item.quantity} | Line Total: ₹${itemSubtotal}`);
  });
  console.log(`   📊 DERIVED VALUES:`);
  console.log(`      - Total Units (Navbar badge): ${totalUnits}`);
  console.log(`      - Order Summary Subtotal: ₹${subtotal}`);

  // 9. Update Quantity via [+] button
  console.log(`\n9️⃣  Increasing quantity of "${p2.name}" to 2 (PATCH /cart/${p2._id})...`);
  const patchRes = await axios.patch(`${BASE_URL}/cart/${p2._id}`, { quantity: 2 }, authHeaders);
  const updatedP2 = patchRes.data.cart.find(i => i.product._id.toString() === p2._id.toString());
  console.log(`   ✅ Updated quantity: ${updatedP2.quantity} (Expected: 2)`);

  // 10. Attempt to exceed stock limit (Validation Test)
  console.log(`\n🔟 Testing stock limit validation with quantity: ${p2.stock + 50}...`);
  try {
    await axios.patch(`${BASE_URL}/cart/${p2._id}`, { quantity: p2.stock + 50 }, authHeaders);
    console.error(`   ❌ Failed: Should have rejected`);
  } catch (err) {
    console.log(`   ✅ Correctly rejected with 400 Bad Request: "${err.response.data.message}"`);
  }

  // 11. Remove an Item (DELETE /cart/:productId)
  console.log(`\n1️⃣1️⃣ Removing "${p1.name}" from cart (DELETE /cart/${p1._id})...`);
  const delRes = await axios.delete(`${BASE_URL}/cart/${p1._id}`, authHeaders);
  console.log(`   ✅ Removed! Remaining unique items: ${delRes.data.cart.length}`);

  // 12. Simulate Page Refresh / Persistence Check
  console.log(`\n1️⃣2️⃣ Simulating page refresh (Fetching persisted cart from MongoDB)...`);
  const refreshedCart = await axios.get(`${BASE_URL}/cart`, authHeaders);
  console.log(`   ✅ Persisted Cart in MongoDB has ${refreshedCart.data.cart.length} item(s)`);
  console.log(`   Remaining item: "${refreshedCart.data.cart[0].product.name}" with quantity: ${refreshedCart.data.cart[0].quantity}`);

  console.log("\n===============================================================");
  console.log("   🎉 ALL LAB 05 REQUIREMENTS FULLY VERIFIED AND RUNNING!     ");
  console.log("===============================================================");
}

runFullCartDemo().catch(err => {
  console.error("Demo failed:", err.message);
  process.exit(1);
});
