import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';

async function runE2ETests() {
  console.log('====================================================');
  console.log('🧪 RUNNING FULL LAB 03 PRODUCT DISCOVERY TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} ${details}`);
      failed++;
    }
  };

  try {
    // 1. Task 3: Get All Products
    console.log('--- Task 3: Get All Products API ---');
    const allRes = await axios.get(`${BASE_URL}/products`);
    assert(allRes.status === 200, 'GET /products returns 200 OK');
    assert(allRes.data.success === true, 'Response contains success: true');
    assert(typeof allRes.data.count === 'number', 'Response contains count property');
    assert(Array.isArray(allRes.data.products), 'Response contains products array');
    assert(allRes.data.products.length > 0, `Returned ${allRes.data.products.length} products`);

    const sampleProduct = allRes.data.products[0];
    assert(Boolean(sampleProduct._id), 'Product has _id');
    assert(Boolean(sampleProduct.name), 'Product has name');
    assert(typeof sampleProduct.price === 'number', 'Product has numeric price');
    assert(Boolean(sampleProduct.category), 'Product has category');
    assert(Boolean(sampleProduct.image), 'Product has image URL');
    assert(typeof sampleProduct.stock === 'number', 'Product has numeric stock');

    // 2. Task 4: Get Single Product API
    console.log('\n--- Task 4: Get Single Product API ---');
    const singleRes = await axios.get(`${BASE_URL}/products/${sampleProduct._id}`);
    assert(singleRes.status === 200, 'GET /products/:id returns 200 OK');
    const retrievedProduct = singleRes.data.product || singleRes.data;
    assert(retrievedProduct._id === sampleProduct._id, 'Product _id matches requested ID');
    assert(Boolean(retrievedProduct.description), 'Product contains description');

    // Test Task 4 Error Cases
    try {
      await axios.get(`${BASE_URL}/products/invalid-object-id-123`);
      assert(false, 'GET /products/:id returns 400 for invalid ObjectID');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'GET /products/:id returns 400 for invalid ObjectId');
    }

    try {
      await axios.get(`${BASE_URL}/products/507f1f77bcf86cd799439011`);
      assert(false, 'GET /products/:id returns 404 for non-existent product');
    } catch (err) {
      assert(err.response && err.response.status === 404, 'GET /products/:id returns 404 for non-existent product');
    }

    // 3. Task 5: Search & Category Filtering
    console.log('\n--- Task 5: Search & Category Filtering ---');
    const searchRes = await axios.get(`${BASE_URL}/products`, {
      params: { search: 'keyboard' },
    });
    assert(searchRes.status === 200, 'GET /products?search=keyboard returns 200');
    assert(
      searchRes.data.products.every((p) => p.name.toLowerCase().includes('keyboard')),
      'All returned products contain search term "keyboard"'
    );

    const categoryRes = await axios.get(`${BASE_URL}/products`, {
      params: { category: 'Fashion' },
    });
    assert(categoryRes.status === 200, 'GET /products?category=Fashion returns 200');
    assert(
      categoryRes.data.products.every((p) => p.category.toLowerCase() === 'fashion'),
      'All returned products have category "Fashion"'
    );

    const combinedRes = await axios.get(`${BASE_URL}/products`, {
      params: { search: 'sneakers', category: 'Fashion' },
    });
    assert(combinedRes.status === 200, 'GET /products?search=sneakers&category=Fashion returns 200');
    assert(
      combinedRes.data.products.every(
        (p) => p.category.toLowerCase() === 'fashion' && p.name.toLowerCase().includes('sneakers')
      ),
      'Combined query correctly applies both filters'
    );

    // Empty search query
    const emptyRes = await axios.get(`${BASE_URL}/products`, {
      params: { search: 'nonexistentproductterm9999' },
    });
    assert(emptyRes.status === 200 && emptyRes.data.products.length === 0, 'Non-matching query returns empty array');

    // 4. Bonus Challenge: Sorting
    console.log('\n--- Bonus Challenge: Sorting Query Parameter ---');
    const ascRes = await axios.get(`${BASE_URL}/products`, {
      params: { sort: 'price_asc' },
    });
    assert(ascRes.status === 200, 'GET /products?sort=price_asc returns 200');
    const pricesAsc = ascRes.data.products.map((p) => p.price);
    const isSortedAsc = pricesAsc.every((val, idx, arr) => idx === 0 || arr[idx - 1] <= val);
    assert(isSortedAsc, 'Products sorted by price ascending');

    const descRes = await axios.get(`${BASE_URL}/products`, {
      params: { sort: 'price_desc' },
    });
    assert(descRes.status === 200, 'GET /products?sort=price_desc returns 200');
    const pricesDesc = descRes.data.products.map((p) => p.price);
    const isSortedDesc = pricesDesc.every((val, idx, arr) => idx === 0 || arr[idx - 1] >= val);
    assert(isSortedDesc, 'Products sorted by price descending');

    // 5. Task 2: Create Product API
    console.log('\n--- Task 2: Create Product API ---');
    const newProductPayload = {
      name: '__E2E_TEST__ Wireless Gaming Mouse',
      description: 'High precision wireless gaming mouse with 26K DPI optical sensor.',
      price: 3499,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
      stock: 14,
    };
    const createRes = await axios.post(`${BASE_URL}/products`, newProductPayload);
    assert(createRes.status === 201, 'POST /products returns 201 Created');
    const createdId = (createRes.data.product && createRes.data.product._id) || createRes.data._id;
    assert(Boolean(createdId), 'Created product returns new _id');

    // Missing field validation
    try {
      await axios.post(`${BASE_URL}/products`, { name: 'Incomplete' });
      assert(false, 'Missing required fields should fail');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'POST /products returns 400 on missing required fields');
    }

    // Invalid price
    try {
      await axios.post(`${BASE_URL}/products`, { ...newProductPayload, price: -500 });
      assert(false, 'Negative price should fail');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'POST /products returns 400 on price <= 0');
    }

    // Invalid stock
    try {
      await axios.post(`${BASE_URL}/products`, { ...newProductPayload, stock: -5 });
      assert(false, 'Negative stock should fail');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'POST /products returns 400 on stock < 0');
    }

    console.log('\n====================================================');
    console.log(`🏁 E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Test execution error:', error.message);
  }
}

runE2ETests();
