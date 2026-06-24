import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Vendor } from '../models/Vendor';
import { Category } from '../models/Category';
import { Coupon } from '../models/Coupon';
import { query, initPostgres } from '../config/postgres';

const SEED_PRODUCTS = [
  { name: 'Organic Avocados (Pack of 6)', category: 'fruits', price: 120, groupPrice: 85, mrp: 150, image: 'fruits_and_veg.webp', rating: 4.8, reviews: 1289, targetCount: 10, badge: 'trending' },
  { name: 'Fresh Strawberries (500g)', category: 'fruits', price: 250, groupPrice: 180, mrp: 320, image: 'fruits_and_veg.webp', rating: 4.6, reviews: 892, targetCount: 10 },
  { name: 'Broccoli Crown (250g)', category: 'fruits', price: 80, groupPrice: 45, mrp: 100, image: 'fruits_and_veg.webp', rating: 4.5, reviews: 2301, targetCount: 10 },
  { name: 'Fuji Apples (Pack of 6)', category: 'fruits', price: 180, groupPrice: 130, mrp: 220, image: 'fruits_and_veg.webp', rating: 4.7, reviews: 520, targetCount: 10 },
  { name: 'Classic White Tee', category: 'fashion', price: 599, groupPrice: 399, mrp: 999, image: 'white_tee.jpeg', rating: 4.4, reviews: 450, targetCount: 20, badge: 'bestseller' },
  { name: 'Denim Jacket', category: 'fashion', price: 1999, groupPrice: 1499, mrp: 3499, image: 'denim_jacket.avif', rating: 4.7, reviews: 120, targetCount: 15, badge: 'new' },
  { name: 'Canvas Sneakers', category: 'fashion', price: 1299, groupPrice: 899, mrp: 2499, image: 'white_canvas.webp', rating: 4.3, reviews: 310, targetCount: 20 },
  { name: 'Phone 15 Pro (256GB)', category: 'mobiles', price: 129900, groupPrice: 124900, mrp: 139900, image: 'iphone.webp', rating: 4.9, reviews: 520, targetCount: 200, badge: 'trending' },
  { name: 'Wireless Charger Pad', category: 'mobiles', price: 1499, groupPrice: 999, mrp: 2499, image: 'wireless_charger.jpeg', rating: 4.5, reviews: 1500, targetCount: 100 },
  { name: 'iPhone 15 Silicone Case', category: 'mobiles', price: 2499, groupPrice: 1999, mrp: 3999, image: 'mobile.jpeg', rating: 4.3, reviews: 870, targetCount: 50 },
  { name: 'Velvet Matte Lipstick', category: 'beauty', price: 899, groupPrice: 599, mrp: 1499, image: 'beauty.jpeg', rating: 4.6, reviews: 800, targetCount: 50 },
  { name: 'Vitamin C Face Serum', category: 'beauty', price: 1299, groupPrice: 999, mrp: 1999, image: 'beauty.jpeg', rating: 4.8, reviews: 420, targetCount: 40, badge: 'deal' },
  { name: 'Hyaluronic Acid Moisturizer', category: 'beauty', price: 799, groupPrice: 549, mrp: 1299, image: 'beauty.jpeg', rating: 4.7, reviews: 1200, targetCount: 100 },
  { name: 'Noise Cancelling Headphones', category: 'electronics', price: 24999, groupPrice: 19999, mrp: 34999, image: 'electronics.jpeg', rating: 4.8, reviews: 2100, targetCount: 100, badge: 'bestseller' },
  { name: 'Smart Watch Series 9', category: 'electronics', price: 41900, groupPrice: 38900, mrp: 45900, image: 'electronics.jpeg', rating: 4.7, reviews: 850, targetCount: 50 },
  { name: 'Bluetooth Speaker', category: 'electronics', price: 3999, groupPrice: 2999, mrp: 5999, image: 'electronics.jpeg', rating: 4.5, reviews: 3200, targetCount: 200 },
  { name: 'Scented Candle Collection', category: 'home', price: 499, groupPrice: 299, mrp: 799, image: 'home.webp', rating: 4.4, reviews: 1300, targetCount: 200 },
  { name: 'Ceramic Vase Set', category: 'home', price: 899, groupPrice: 650, mrp: 1299, image: 'home.webp', rating: 4.5, reviews: 95, targetCount: 30 },
  { name: 'Bamboo Kitchen Organizer', category: 'home', price: 1299, groupPrice: 949, mrp: 1999, image: 'home.webp', rating: 4.6, reviews: 670, targetCount: 100 },
  { name: 'Whey Protein Powder (1kg)', category: 'food', price: 2499, groupPrice: 1999, mrp: 3499, image: 'food.jpeg', rating: 4.7, reviews: 3400, targetCount: 150, badge: 'bestseller' },
  { name: 'Organic Raw Honey (500g)', category: 'food', price: 450, groupPrice: 320, mrp: 650, image: 'food.jpeg', rating: 4.9, reviews: 670, targetCount: 100 },
  { name: 'Whole Grain Bread (Multigrain)', category: 'food', price: 60, groupPrice: 40, mrp: 80, image: 'food.jpeg', rating: 4.8, reviews: 890, targetCount: 10 },
  { name: 'Air Fryer (5.5L)', category: 'appliances', price: 8999, groupPrice: 6999, mrp: 12999, image: 'home.webp', rating: 4.8, reviews: 1200, targetCount: 50, badge: 'trending' },
  { name: 'Juicer Mixer Grinder', category: 'appliances', price: 3499, groupPrice: 2799, mrp: 4999, image: 'home.webp', rating: 4.6, reviews: 880, targetCount: 40 },
  { name: 'Electric Kettle (1.5L)', category: 'appliances', price: 1499, groupPrice: 999, mrp: 2499, image: 'home.webp', rating: 4.5, reviews: 4500, targetCount: 200 },
  { name: 'Electric Scooter S1', category: '2wheeler', price: 119000, groupPrice: 114000, mrp: 125000, image: 'mobile.jpeg', rating: 4.7, reviews: 4500, targetCount: 500, badge: 'trending' },
  { name: 'ISI Certified Helmet', category: '2wheeler', price: 2499, groupPrice: 1899, mrp: 3999, image: 'mobile.jpeg', rating: 4.5, reviews: 3100, targetCount: 200 },
  { name: 'Car Dash Camera', category: 'auto', price: 4999, groupPrice: 3999, mrp: 7999, image: 'mobile.jpeg', rating: 4.6, reviews: 720, targetCount: 50 },
  { name: 'Microfiber Cleaning Cloth (12 Pack)', category: 'auto', price: 299, groupPrice: 149, mrp: 499, image: 'home.webp', rating: 4.8, reviews: 15000, targetCount: 1000 },
  { name: 'English Willow Cricket Bat', category: 'sports', price: 8999, groupPrice: 7499, mrp: 14999, image: 'sports.jpeg', rating: 4.7, reviews: 230, targetCount: 20, badge: 'deal' },
  { name: 'Premium Yoga Mat', category: 'sports', price: 999, groupPrice: 699, mrp: 1999, image: 'sports.jpeg', rating: 4.6, reviews: 5400, targetCount: 500 },
  { name: 'Badminton Racket Set', category: 'sports', price: 2999, groupPrice: 2199, mrp: 4499, image: 'sports.jpeg', rating: 4.5, reviews: 1850, targetCount: 100 },
  { name: 'The Art of War (Hardcover)', category: 'books', price: 399, groupPrice: 199, mrp: 699, image: 'books.jpeg', rating: 4.9, reviews: 12000, targetCount: 2000, badge: 'bestseller' },
  { name: 'Space Encyclopedia', category: 'books', price: 899, groupPrice: 550, mrp: 1499, image: 'books.jpeg', rating: 4.8, reviews: 450, targetCount: 150 },
  { name: 'Atomic Habits (Paperback)', category: 'books', price: 499, groupPrice: 299, mrp: 799, image: 'books.jpeg', rating: 4.9, reviews: 25000, targetCount: 3000 },
  { name: 'Ergonomic Office Chair', category: 'furniture', price: 12999, groupPrice: 9999, mrp: 19999, image: 'furniture.jpeg', rating: 4.7, reviews: 890, targetCount: 80 },
  { name: 'Bean Bag (Large)', category: 'furniture', price: 2499, groupPrice: 1699, mrp: 4499, image: 'furniture.jpeg', rating: 4.5, reviews: 2300, targetCount: 150 },
  { name: 'Floating Wall Shelf Set', category: 'furniture', price: 1299, groupPrice: 899, mrp: 1999, image: 'furniture.jpeg', rating: 4.4, reviews: 1200, targetCount: 100 },
  { name: 'Building Blocks Set (1000 pieces)', category: 'toys', price: 1499, groupPrice: 999, mrp: 2499, image: 'toys.jpeg', rating: 4.8, reviews: 1100, targetCount: 100, badge: 'new' },
  { name: 'Teddy Bear (36 inch)', category: 'toys', price: 799, groupPrice: 499, mrp: 1499, image: 'toys.jpeg', rating: 4.6, reviews: 3400, targetCount: 200 },
  { name: 'Board Game Collection', category: 'toys', price: 2499, groupPrice: 1799, mrp: 3999, image: 'toys.jpeg', rating: 4.7, reviews: 890, targetCount: 50 },
  { name: 'Fresh Atlantic Salmon (500g)', category: 'live', price: 1200, groupPrice: 950, mrp: 1600, image: 'food.jpeg', rating: 4.9, reviews: 120, targetCount: 15 },
  { name: 'Organic Green Salad Mix', category: 'live', price: 199, groupPrice: 129, mrp: 299, image: 'fruits_and_veg.webp', rating: 4.7, reviews: 340, targetCount: 20 },
  { name: 'Modular 3-Seater Sofa Set', category: 'furniture', price: 45000, groupPrice: 38000, mrp: 55000, image: 'furniture.jpeg', rating: 4.8, reviews: 45, targetCount: 5, badge: 'deal' },
];

const CATEGORIES = [
  { key: 'fruits', label: 'Fruits & Vegetables', image: 'fruits_and_veg.webp', subcategories: ['Fresh Fruits', 'Exotic Fruits', 'Seasonal', 'Leafy Greens', 'Root Veggies', 'Organic'], order: 1 },
  { key: 'fashion', label: 'Fashion', image: 'fashion.jpeg', subcategories: ['Menswear', 'Womenswear', 'Accessories', 'Footwear'], order: 2 },
  { key: 'mobiles', label: 'Mobiles', image: 'mobile.jpeg', subcategories: ['Smartphones', 'Accessories', 'Tablets', 'Cases & Covers'], order: 3 },
  { key: 'beauty', label: 'Beauty', image: 'beauty.jpeg', subcategories: ['Skincare', 'Makeup', 'Haircare', 'Fragrance'], order: 4 },
  { key: 'electronics', label: 'Electronics', image: 'electronics.jpeg', subcategories: ['Laptops', 'Headphones', 'Cameras', 'Speakers', 'Wearables'], order: 5 },
  { key: 'home', label: 'Home & Kitchen', image: 'home.webp', subcategories: ['Kitchen', 'Decor', 'Cleaning', 'Storage'], order: 6 },
  { key: 'food', label: 'Food & Health', image: 'food.jpeg', subcategories: ['Health Food', 'Snacks', 'Beverages', 'Organic'], order: 7 },
  { key: 'appliances', label: 'Appliances', image: 'home.webp', subcategories: ['Kitchen Appliances', 'Home Appliances', 'Air Coolers'], order: 8 },
  { key: '2wheeler', label: '2 Wheeler', image: 'mobile.jpeg', subcategories: ['Scooters', 'Bikes', 'Helmets', 'Accessories'], order: 9 },
  { key: 'auto', label: 'Auto Accessories', image: 'mobile.jpeg', subcategories: ['Car Accessories', 'Cleaning', 'Interior'], order: 10 },
  { key: 'sports', label: 'Sports', image: 'sports.jpeg', subcategories: ['Cricket', 'Fitness', 'Badminton', 'Yoga'], order: 11 },
  { key: 'books', label: 'Books', image: 'books.jpeg', subcategories: ['Fiction', 'Academic', 'Self-Help', 'Children'], order: 12 },
  { key: 'furniture', label: 'Furniture', image: 'furniture.jpeg', subcategories: ['Office Furniture', 'Home Furniture', 'Decor'], order: 13 },
  { key: 'toys', label: 'Toys', image: 'toys.jpeg', subcategories: ['Board Games', 'Plush Toys', 'Educational', 'Outdoor'], order: 14 },
  { key: 'live', label: 'Live', image: 'food.jpeg', subcategories: ['Fresh Fish', 'Organic Greens', 'Dairy'], order: 15 },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('Database dropped to clear wrong indexes');
    }
    await initPostgres();
    console.log('PostgreSQL tables initialized in seed script');

    const adminCount = await User.countDocuments({ role: { $in: ['platform_admin', 'super_admin'] } });
    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create([
        {
          phoneNumber: '+919999999991',
          email: 'admin@shopyng.com',
          fullName: 'Admin',
          role: 'super_admin',
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          passwordHash,
        },
        {
          phoneNumber: '+919999999992',
          email: 'superadmin@shopyng.com',
          fullName: 'Super Admin',
          role: 'super_admin',
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          passwordHash,
        },
      ]);
      console.log('Created admin users');
    }

    const vendorCount = await Vendor.countDocuments();
    if (vendorCount === 0) {
      await Vendor.create({
        name: 'Fresh Farms',
        ownerName: 'Rahul Sharma',
        email: 'rahul@freshfarms.com',
        phoneNumber: '+919876543201',
        description: 'Premium fresh produce delivered directly from farms across Karnataka.',
        rating: 4.8,
        verified: true,
        categories: ['fruits', 'food', 'live'],
      });
      console.log('Created default vendor');
    }

    const vendorUserCount = await User.countDocuments({ role: { $in: ['vendor', 'vendor_admin'] } });
    if (vendorUserCount === 0) {
      const vendor = await Vendor.findOne();
      if (vendor) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        await User.create({
          phoneNumber: '+919876543201',
          email: 'rahul@freshfarms.com',
          fullName: 'Rahul Sharma',
          role: 'vendor',
          vendorId: vendor._id,
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          passwordHash,
        });
        console.log('Created vendor user');
      }
    }

    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.insertMany(CATEGORIES);
      console.log(`Created ${CATEGORIES.length} categories`);
    }

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const vendor = await Vendor.findOne();
      if (vendor) {
        const products = SEED_PRODUCTS.map((p, idx) => ({
          ...p,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          vendorId: vendor._id,
          stock: Math.floor(Math.random() * 500) + 10,
          highlights: [ 'Best quality', 'Premium product', 'Customer favorite' ],
          deliveryTime: '25-40 min',
          returnPolicy: '7-day easy return',
          warranty: '6 months',
          sponsored: idx < 10,
          isActive: true,
          isFeatured: idx < 20,
          tags: [p.category, 'popular', 'group-buy'],
        }));
        await Product.insertMany(products);
        console.log(`Created ${products.length} products`);
      }
    }

    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      await Coupon.insertMany([
        { code: 'WELCOME50', discountType: 'flat', discountValue: 50, minCartValue: 199, validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01'), description: '₹50 off on first order' },
        { code: 'WEEKEND25', discountType: 'percent', discountValue: 25, minCartValue: 499, maxDiscount: 500, validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01'), description: '25% off up to ₹500' },
        { code: 'GROUPBUY10', discountType: 'percent', discountValue: 10, minCartValue: 299, maxDiscount: 200, validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01'), description: '10% off on group buys' },
        { code: 'FREEDEL', discountType: 'flat', discountValue: 25, minCartValue: 199, validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01'), description: 'Free delivery' },
        { code: 'SAVE200', discountType: 'flat', discountValue: 200, minCartValue: 999, validFrom: new Date('2026-01-01'), validUntil: new Date('2027-01-01'), description: '₹200 off on orders above ₹999' },
      ]);
      console.log('Created coupons');
    }

    const vendor = await Vendor.findOne();
    if (vendor) {
      const pgSubExists = await query('SELECT * FROM vendor_subscriptions WHERE vendor_id = $1', [vendor._id]);
      if (pgSubExists.rows.length === 0) {
        await query(
          `INSERT INTO vendor_subscriptions (vendor_id, tier, status, price, product_limit, commission_rate)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [vendor._id, 'premium', 'active', 999.00, 500, 5.0]
        );
        console.log('Seeded PostgreSQL vendor subscription record for Fresh Farms');
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
