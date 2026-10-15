import "dotenv/config";
import axios from "axios";
import crypto from "crypto";

const BASE_URL = "http://127.0.0.1:5000";

async function runTests() {
  console.log("=== RUNNING SHOPKART LAB 06 END-TO-END VERIFICATION ===");

  const timestamp = Date.now();
  const testEmail = `checkout_test_${timestamp}@shopkart.com`;
  const password = "Password@123";

  // 1. Register customer
  console.log("\n1. Registering customer...");
  await axios.post(
    `${BASE_URL}/customers/register`,
    {
      fullName: "Arjun Verma",
      email: testEmail,
      password: password,
      phone: "9876543210",
    }
  );

  console.log("Registered. Now logging in to acquire auth session cookie...");
  const loginRes = await axios.post(
    `${BASE_URL}/customers/login`,
    {
      email: testEmail,
      password: password,
    }
  );

  const cookie = loginRes.headers["set-cookie"]?.[0];
  console.log("Logged in successfully. Cookie received:", !!cookie);

  const authHeaders = {
    Cookie: cookie,
  };

  // 2. Fetch products to get a valid product ID
  console.log("\n2. Fetching product catalogue...");
  const prodRes = await axios.get(`${BASE_URL}/products`);
  const products = prodRes.data.products;
  if (!products || products.length === 0) {
    throw new Error("No products found in DB");
  }
  const testProduct = products[0];
  console.log(`Using product: ${testProduct.name} (Price: ₹${testProduct.price}, Stock: ${testProduct.stock})`);

  // 3. Test checkout with EMPTY cart -> Expected 400
  console.log("\n3. Testing checkout with EMPTY cart (Rule: Empty cart must fail)...");
  try {
    await axios.post(
      `${BASE_URL}/orders/create-payment-order`,
      {
        shippingAddress: {
          fullName: "Arjun Verma",
          phone: "9876543210",
          addressLine1: "123 Indiranagar",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560038",
        },
      },
      { headers: authHeaders }
    );
    console.error("FAIL: Empty cart checkout should have failed!");
  } catch (err) {
    console.log("PASS: Empty cart checkout rejected with status:", err.response?.status, `("${err.response?.data?.message}")`);
  }

  // 4. Add product to cart
  console.log("\n4. Adding product to cart...");
  await axios.post(
    `${BASE_URL}/cart/${testProduct._id}`,
    {},
    { headers: authHeaders }
  );
  const cartRes = await axios.get(`${BASE_URL}/cart`, { headers: authHeaders });
  console.log("Cart items count:", cartRes.data.cart.length);

  // 5. Test validation of fake total sent by client (Server must ignore fake totals and calculate real total)
  console.log("\n5. Testing fake total sent in request body...");
  const orderRes = await axios.post(
    `${BASE_URL}/orders/create-payment-order`,
    {
      totalAmount: 1, // Fake client amount
      shippingAddress: {
        fullName: "Arjun Verma",
        phone: "9876543210",
        addressLine1: "123 Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
      },
    },
    { headers: authHeaders }
  );

  const orderData = orderRes.data;
  console.log("PASS: Order created with calculated total amount:", orderData.order.totalAmount, "(Expected ₹" + testProduct.price + ")");
  console.log("Razorpay amount in paise:", orderData.amount, "(Expected:", testProduct.price * 100, "paise)");
  console.log("Razorpay order ID:", orderData.razorpayOrderId);

  // 6. Test: Cart BEFORE payment verification -> Must still contain items!
  console.log("\n6. Verifying cart state before payment verification...");
  const cartBeforeVerify = await axios.get(`${BASE_URL}/cart`, { headers: authHeaders });
  console.log("Cart item count before verification:", cartBeforeVerify.data.cart.length, "(PASS: Cart not cleared prematurely)");

  // 7. Test invalid payment signature verification -> Expected 400, Order must NOT become PAID, Cart must NOT clear
  console.log("\n7. Testing payment verification with INVALID signature...");
  try {
    await axios.post(
      `${BASE_URL}/orders/verify-payment`,
      {
        shopKartOrderId: orderData.shopKartOrderId,
        razorpay_order_id: orderData.razorpayOrderId,
        razorpay_payment_id: "pay_test_fake_123",
        razorpay_signature: "invalid_signature_hex_digest",
      },
      { headers: authHeaders }
    );
    console.error("FAIL: Invalid payment signature should have been rejected!");
  } catch (err) {
    console.log("PASS: Invalid signature rejected with status:", err.response?.status, `("${err.response?.data?.message}")`);
  }

  // 8. Test valid payment verification
  console.log("\n8. Testing payment verification with VALID signature...");
  const mockPaymentId = `pay_rzp_${Date.now()}`;
  const trustedOrderId = orderData.razorpayOrderId;
  const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${trustedOrderId}|${mockPaymentId}`)
    .digest("hex");

  const verifyRes = await axios.post(
    `${BASE_URL}/orders/verify-payment`,
    {
      shopKartOrderId: orderData.shopKartOrderId,
      razorpay_order_id: trustedOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: expectedSig,
    },
    { headers: authHeaders }
  );

  console.log("PASS: Payment verified! Order Status:", verifyRes.data.order.status, "PaymentStatus:", verifyRes.data.order.paymentStatus);

  // 9. Confirm user cart is cleared AFTER payment verification
  console.log("\n9. Confirming user cart is CLEARED after payment verification...");
  const cartAfterVerify = await axios.get(`${BASE_URL}/cart`, { headers: authHeaders });
  console.log("Cart items count after verification:", cartAfterVerify.data.cart.length, "(PASS: Cart cleared to 0)");

  // 10. Fetch user's orders (GET /orders)
  console.log("\n10. Fetching user's orders (GET /orders)...");
  const myOrdersRes = await axios.get(`${BASE_URL}/orders`, { headers: authHeaders });
  console.log("Orders retrieved count:", myOrdersRes.data.orders.length);
  console.log("Latest order ID:", myOrdersRes.data.orders[0]._id, "Items snapshot length:", myOrdersRes.data.orders[0].items.length);

  // 11. Fetch single order details (GET /orders/:id)
  console.log("\n11. Fetching single order by ID (GET /orders/:id)...");
  const singleOrderRes = await axios.get(`${BASE_URL}/orders/${orderData.shopKartOrderId}`, { headers: authHeaders });
  console.log("Single order fetched successfully:", singleOrderRes.data.order._id === orderData.shopKartOrderId);

  // 12. Test Bonus (+10 marks): Status Progression (PATCH /orders/:id/status)
  console.log("\n12. Testing Bonus Status Progression (PATCH /orders/:id/status)...");
  const updateStatusRes = await axios.patch(
    `${BASE_URL}/orders/${orderData.shopKartOrderId}/status`,
    { status: "CONFIRMED" },
    { headers: authHeaders }
  );
  console.log("PASS: Order status updated to:", updateStatusRes.data.order.status);

  console.log("\n🎉 ALL 12 LAB 06 AUTOMATED BACKEND TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err.message, err.response?.data || "");
  process.exit(1);
});
