import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

export const initialProducts = [
  {
    name: 'Noise Cancelling Headphones',
    description: 'Wireless over-ear headphones with active noise cancellation, 30-hour battery life, and high-fidelity acoustic drivers.',
    price: 4999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    stock: 25,
  },
  {
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with tactile blue switches, programmable macro keys, and aerospace-grade aluminum casing.',
    price: 2999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    stock: 10,
  },
  {
    name: 'Ultra-Crisp 4K Monitor',
    description: '27-inch 4K UHD IPS display with 144Hz refresh rate, HDR400 color precision, and ultra-thin bezel design.',
    price: 24999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    stock: 8,
  },
  {
    name: 'Ergonomic Wireless Mouse',
    description: 'Precision vertical wireless mouse engineered to reduce wrist strain, featuring customizable DPI and whisper-quiet clicks.',
    price: 1499,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    stock: 40,
  },
  {
    name: 'Classic Vintage Leather Jacket',
    description: 'Handcrafted genuine lambskin leather jacket with antique brass zippers, tailored slim fit, and satin interior lining.',
    price: 6499,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
    stock: 15,
  },
  {
    name: 'Minimalist Canvas Sneakers',
    description: 'Everyday breathable low-top sneakers featuring memory foam cushioning and durable vulcanized rubber soles.',
    price: 2299,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    stock: 30,
  },
  {
    name: 'Polarized Aviator Sunglasses',
    description: 'Classic lightweight metallic frame aviators with 100% UV400 polarized anti-glare lenses.',
    price: 1899,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
    stock: 22,
  },
  {
    name: 'Waterproof Commuter Backpack',
    description: 'Modern weatherproof roll-top backpack with a padded 16-inch laptop compartment and hidden anti-theft pockets.',
    price: 3199,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    stock: 18,
  },
  {
    name: 'Designing Data-Intensive Applications',
    description: 'The definitive handbook by Martin Kleppmann exploring reliability, scalability, and maintainability in modern distributed systems.',
    price: 1850,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=800&auto=format&fit=crop&q=80',
    stock: 35,
  },
  {
    name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    description: 'Robert C. Martin introduces essential principles of writing readable, maintainable, and robust software.',
    price: 1450,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    stock: 20,
  },
  {
    name: 'Atomic Habits',
    description: 'James Clear offers an easy and proven way to build good habits, break bad ones, and achieve remarkable results.',
    price: 699,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    stock: 50,
  },
  {
    name: 'Ergonomic Mesh Office Chair',
    description: 'High-back desk chair with dynamic lumbar support, 3D adjustable armrests, and breathable high-tensile mesh.',
    price: 12999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1580481077195-c228c388d839?w=800&auto=format&fit=crop&q=80',
    stock: 12,
  },
  {
    name: 'Ceramic Pour-Over Coffee Set',
    description: 'Artisan matte ceramic dripper set with borosilicate glass carafe for the ultimate morning brew experience.',
    price: 1799,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    stock: 25,
  },
  {
    name: 'Aromatherapy Essential Oil Diffuser',
    description: 'Whisper-quiet ultrasonic cool mist diffuser with ambient 7-color LED lights and auto-shutoff timer.',
    price: 1599,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
    stock: 16,
  },
];

export const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for product seeding...');

    // Clear existing products and reseed
    await Product.deleteMany({});
    console.log('Cleared existing product records.');

    const created = await Product.insertMany(initialProducts);
    console.log(`Successfully seeded ${created.length} products into ShopKart!`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('Failed to seed products:', error);
    process.exit(1);
  }
};

// Execute directly if run as a CLI script
if (process.argv[1].endsWith('seedProducts.js')) {
  seedDatabase();
}
