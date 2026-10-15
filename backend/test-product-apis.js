process.env.NODE_ENV = 'test';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/product.model.js';

dotenv.config();

let server;
let baseUrl = '';

const runTests = async () => {
  const { default: app, connectDB } = await import('./index.js');
  await connectDB();
  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // Start temporary test server on random port or 5055
    const PORT = 5055;
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        baseUrl = `http://127.0.0.1:${PORT}`;
        console.log(`\n🚀 Test server running on ${baseUrl}`);
        resolve();
      });
    });

    console.log('\n========================================');
    console.log('🧪 SHOPKART LAB 03 - BACKEND TEST SUITE');
    console.log('========================================\n');

    // Clean up test products
    await Product.deleteMany({ name: { $regex: /__TEST__/ } });

    // ----------------------------------------------------
    // TASK 1: Product Schema & Validation Tests
    // ----------------------------------------------------
    console.log('--- TASK 1: Product Model Schema & Validation ---');
    try {
      const validProduct = new Product({
        name: '__TEST__ Valid Product',
        description: 'Test description for valid product',
        price: 999,
        category: 'Electronics',
        image: 'https://example.com/test.jpg',
        stock: 10,
      });
      await validProduct.validate();
      assert(true, 'Valid product passes Mongoose schema validation');
      assert(validProduct.createdAt instanceof Date, 'createdAt is automatically generated Date');
    } catch (err) {
      assert(false, `Valid product failed validation: ${err.message}`);
    }

    try {
      const invalidPriceProduct = new Product({
        name: '__TEST__ Zero Price',
        description: 'Invalid price test',
        price: 0,
        category: 'Electronics',
        image: 'https://example.com/test.jpg',
        stock: 5,
      });
      await invalidPriceProduct.validate();
      assert(false, 'Price = 0 should have failed validation');
    } catch {
      assert(true, 'Price = 0 correctly rejected (must be greater than 0)');
    }

    try {
      const negativeStockProduct = new Product({
        name: '__TEST__ Negative Stock',
        description: 'Negative stock test',
        price: 199,
        category: 'Electronics',
        image: 'https://example.com/test.jpg',
        stock: -1,
      });
      await negativeStockProduct.validate();
      assert(false, 'Stock = -1 should have failed validation');
    } catch {
      assert(true, 'Negative stock correctly rejected (cannot be negative)');
    }

    try {
      const missingFieldProduct = new Product({
        name: '__TEST__ Incomplete',
        price: 500,
      });
      await missingFieldProduct.validate();
      assert(false, 'Missing required fields should have failed validation');
    } catch {
      assert(true, 'Missing mandatory fields correctly rejected');
    }

    // ----------------------------------------------------
    // TASK 2: Create Product API (POST /products)
    // ----------------------------------------------------
    console.log('\n--- TASK 2: Create Product API (POST /products) ---');
    let createdProduct1 = null;
    let createdProduct2 = null;

    // 2.1 Valid creation
    const resCreate1 = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '__TEST__ Mechanical Keyboard Pro',
        description: 'RGB mechanical keyboard with blue switches.',
        price: 2999,
        category: 'Electronics',
        image: 'https://example.com/keyboard.jpg',
        stock: 15,
      }),
    });
    const dataCreate1 = await resCreate1.json();
    assert(resCreate1.status === 201, 'POST /products returns 201 Created');
    assert(
      (dataCreate1.product && dataCreate1.product.name === '__TEST__ Mechanical Keyboard Pro') ||
        dataCreate1.name === '__TEST__ Mechanical Keyboard Pro',
      'Created product contains submitted name'
    );
    createdProduct1 = dataCreate1.product || dataCreate1;

    // Create second test product for search & category tests
    const resCreate2 = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '__TEST__ Cotton Casual Hoodie',
        description: 'Comfortable premium cotton hoodie.',
        price: 1499,
        category: 'Fashion',
        image: 'https://example.com/hoodie.jpg',
        stock: 8,
      }),
    });
    const dataCreate2 = await resCreate2.json();
    createdProduct2 = dataCreate2.product || dataCreate2;

    // 2.2 Missing required field -> 400
    const resMissing = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '__TEST__ Missing Price',
        category: 'Electronics',
      }),
    });
    assert(resMissing.status === 400, 'POST /products returns 400 on missing required fields');

    // 2.3 Invalid price <= 0 -> 400
    const resBadPrice = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '__TEST__ Free Item',
        description: 'Zero price item',
        price: 0,
        category: 'Books',
        image: 'https://example.com/book.jpg',
        stock: 10,
      }),
    });
    assert(resBadPrice.status === 400, 'POST /products returns 400 on price <= 0');

    // 2.4 Invalid stock < 0 -> 400
    const resBadStock = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '__TEST__ Bad Stock Item',
        description: 'Negative stock item',
        price: 500,
        category: 'Home',
        image: 'https://example.com/lamp.jpg',
        stock: -5,
      }),
    });
    assert(resBadStock.status === 400, 'POST /products returns 400 on negative stock');

    // ----------------------------------------------------
    // TASK 3: Get All Products API (GET /products)
    // ----------------------------------------------------
    console.log('\n--- TASK 3: Get All Products API (GET /products) ---');
    const resGetAll = await fetch(`${baseUrl}/products`);
    const dataGetAll = await resGetAll.json();
    assert(resGetAll.status === 200, 'GET /products returns 200 OK');
    assert(dataGetAll.success === true, 'Response contains success: true');
    assert(typeof dataGetAll.count === 'number', 'Response contains count property');
    assert(Array.isArray(dataGetAll.products), 'Response contains products array');
    assert(dataGetAll.products.length >= 2, 'Products array contains created items');

    // ----------------------------------------------------
    // TASK 4: Get Single Product API (GET /products/:id)
    // ----------------------------------------------------
    console.log('\n--- TASK 4: Get Single Product API (GET /products/:id) ---');
    // 4.1 Valid existing ID
    const resGetSingle = await fetch(`${baseUrl}/products/${createdProduct1._id}`);
    const dataGetSingle = await resGetSingle.json();
    assert(resGetSingle.status === 200, 'GET /products/:id returns 200 for valid ID');
    assert(
      (dataGetSingle.product && dataGetSingle.product._id.toString() === createdProduct1._id.toString()) ||
        dataGetSingle._id.toString() === createdProduct1._id.toString(),
      'Returns the matching product document'
    );

    // 4.2 Invalid MongoDB ID -> 400
    const resBadId = await fetch(`${baseUrl}/products/invalid-id-format-123`);
    assert(resBadId.status === 400, 'GET /products/:id returns 400 for invalid ObjectId format');

    // 4.3 Non-existent MongoDB ID -> 404
    const fakeObjectId = new mongoose.Types.ObjectId();
    const resNotFound = await fetch(`${baseUrl}/products/${fakeObjectId}`);
    assert(resNotFound.status === 404, 'GET /products/:id returns 404 for non-existent product');

    // ----------------------------------------------------
    // TASK 5: Search & Category Filtering
    // ----------------------------------------------------
    console.log('\n--- TASK 5: Search & Category Filtering ---');
    // 5.1 Case-insensitive search on name
    const resSearch = await fetch(`${baseUrl}/products?search=mEcHaNiCaL`);
    const dataSearch = await resSearch.json();
    assert(resSearch.status === 200, 'GET /products?search=... returns 200');
    assert(
      dataSearch.products.some((p) => p.name.includes('Mechanical Keyboard')),
      'Search filters by product name case-insensitively'
    );
    assert(
      !dataSearch.products.some((p) => p.name.includes('Cotton Casual Hoodie')),
      'Search excludes non-matching products'
    );

    // 5.2 Category filter
    const resCategory = await fetch(`${baseUrl}/products?category=Fashion`);
    const dataCategory = await resCategory.json();
    assert(resCategory.status === 200, 'GET /products?category=Fashion returns 200');
    assert(
      dataCategory.products.every((p) => p.category === 'Fashion'),
      'Category filter returns only products in requested category'
    );

    // 5.3 Combined search + category filter
    const resCombined = await fetch(
      `${baseUrl}/products?search=keyboard&category=Electronics`
    );
    const dataCombined = await resCombined.json();
    assert(resCombined.status === 200, 'GET /products?search=...&category=... returns 200');
    assert(
      dataCombined.products.some((p) => p.name.includes('Mechanical Keyboard')) &&
        dataCombined.products.every((p) => p.category === 'Electronics'),
      'Combined query applies both search and category filters'
    );

    // ----------------------------------------------------
    // BONUS: Sorting
    // ----------------------------------------------------
    console.log('\n--- BONUS CHALLENGE: Sorting with query parameters ---');
    const resAsc = await fetch(`${baseUrl}/products?sort=price_asc`);
    const dataAsc = await resAsc.json();
    let isAscSorted = true;
    for (let i = 0; i < dataAsc.products.length - 1; i++) {
      if (dataAsc.products[i].price > dataAsc.products[i + 1].price) {
        isAscSorted = false;
        break;
      }
    }
    assert(isAscSorted, 'sort=price_asc sorts products in ascending price order');

    const resDesc = await fetch(`${baseUrl}/products?sort=price_desc`);
    const dataDesc = await resDesc.json();
    let isDescSorted = true;
    for (let i = 0; i < dataDesc.products.length - 1; i++) {
      if (dataDesc.products[i].price < dataDesc.products[i + 1].price) {
        isDescSorted = false;
        break;
      }
    }
    assert(isDescSorted, 'sort=price_desc sorts products in descending price order');

    // Clean up test products
    await Product.deleteMany({ name: { $regex: /__TEST__/ } });

    console.log('\n========================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
};

runTests();
