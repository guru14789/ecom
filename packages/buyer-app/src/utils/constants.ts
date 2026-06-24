import { Product, CategoryInfo } from '../types';

export const PRODUCTS: Product[] = [
  // Fruits & Veg
  { id: 1, name: 'Organic Avocados', category: 'fruits', price: 120, groupPrice: 85, rating: 4.8, reviews: 124, image: 'fruits_and_veg.webp', sponsored: true, joinedCount: 7, targetCount: 10 },
  { id: 2, name: 'Fresh Strawberries', category: 'fruits', price: 250, groupPrice: 180, rating: 4.6, reviews: 89, image: 'fruits_and_veg.webp', joinedCount: 4, targetCount: 10 },
  { id: 3, name: 'Broccoli Crown', category: 'fruits', price: 80, groupPrice: 45, rating: 4.5, reviews: 230, image: 'fruits_and_veg.webp', joinedCount: 9, targetCount: 10 },
  
  // Fashion
  { id: 4, name: 'Classic White Tee', category: 'fashion', price: 599, groupPrice: 399, rating: 4.4, reviews: 450, image: 'white_tee.jpeg', sponsored: true, joinedCount: 12, targetCount: 20 },
  { id: 5, name: 'Denim Jacket', category: 'fashion', price: 1999, groupPrice: 1499, rating: 4.7, reviews: 120, image: 'denim_jacket.avif', joinedCount: 5, targetCount: 15 },
  { id: 6, name: 'Canvas Sneakers', category: 'fashion', price: 1299, groupPrice: 899, rating: 4.3, reviews: 310, image: 'white_canvas.webp', joinedCount: 8, targetCount: 20 },

  // Mobiles
  { id: 7, name: 'Phone 15 Pro', category: 'mobiles', price: 129900, groupPrice: 124900, rating: 4.9, reviews: 520, image: 'iphone.webp', sponsored: true, joinedCount: 150, targetCount: 200 },
  { id: 8, name: 'Wireless Charger', category: 'mobiles', price: 1499, groupPrice: 999, rating: 4.5, reviews: 1500, image: 'wireless_charger.jpeg', joinedCount: 45, targetCount: 100 },
  
  // Beauty
  { id: 9, name: 'Velvet Lipstick', category: 'beauty', price: 899, groupPrice: 599, rating: 4.6, reviews: 800, image: 'beauty.jpeg', joinedCount: 22, targetCount: 50 },
  { id: 10, name: 'Face Serum', category: 'beauty', price: 1299, groupPrice: 999, rating: 4.8, reviews: 420, image: 'beauty.jpeg', sponsored: true, joinedCount: 18, targetCount: 40 },

  // Electronics
  { id: 11, name: 'Noise Cancelling Headphones', category: 'electronics', price: 24999, groupPrice: 19999, rating: 4.8, reviews: 2100, image: 'electronics.jpeg', sponsored: true, joinedCount: 65, targetCount: 100 },
  { id: 12, name: 'Smart Watch Series 9', category: 'electronics', price: 41900, groupPrice: 38900, rating: 4.7, reviews: 850, image: 'electronics.jpeg', joinedCount: 30, targetCount: 50 },

  // Home
  { id: 13, name: 'Scented Candle', category: 'home', price: 499, groupPrice: 299, rating: 4.4, reviews: 1300, image: 'home.webp', joinedCount: 110, targetCount: 200 },
  { id: 14, name: 'Ceramic Vase', category: 'home', price: 899, groupPrice: 650, rating: 4.5, reviews: 95, image: 'home.webp', joinedCount: 12, targetCount: 30 },

  // Food & Health
  { id: 15, name: 'Protein Powder', category: 'food', price: 2499, groupPrice: 1999, rating: 4.7, reviews: 3400, image: 'food.jpeg', sponsored: true, joinedCount: 88, targetCount: 150 },
  { id: 16, name: 'Organic Honey', category: 'food', price: 450, groupPrice: 320, rating: 4.9, reviews: 670, image: 'food.jpeg', joinedCount: 56, targetCount: 100 },

  // Appliances
  { id: 17, name: 'Air Fryer', category: 'appliances', price: 8999, groupPrice: 6999, rating: 4.8, reviews: 1200, image: 'home.webp', sponsored: true, joinedCount: 34, targetCount: 50 },
  { id: 18, name: 'Juicer Mixer', category: 'appliances', price: 3499, groupPrice: 2799, rating: 4.6, reviews: 880, image: 'home.webp', joinedCount: 15, targetCount: 40 },

  // 2 Wheeler
  { id: 19, name: 'Electric Scooter S1', category: '2wheeler', price: 119000, groupPrice: 114000, rating: 4.7, reviews: 4500, image: 'mobile.jpeg', sponsored: true, joinedCount: 450, targetCount: 500 },
  { id: 20, name: 'Helmet - Matt Black', category: '2wheeler', price: 2499, groupPrice: 1899, rating: 4.5, reviews: 3100, image: 'mobile.jpeg', joinedCount: 120, targetCount: 200 },

  // Auto Access
  { id: 21, name: 'Car Dash Cam', category: 'auto', price: 4999, groupPrice: 3999, rating: 4.6, reviews: 720, image: 'mobile.jpeg', joinedCount: 25, targetCount: 50 },
  { id: 22, name: 'Microfiber Cloth', category: 'auto', price: 299, groupPrice: 149, rating: 4.8, reviews: 15000, image: 'home.webp', joinedCount: 890, targetCount: 1000 },

  // Sports
  { id: 23, name: 'Cricket Bat - English Willow', category: 'sports', price: 8999, groupPrice: 7499, rating: 4.7, reviews: 230, image: 'sports.jpeg', sponsored: true, joinedCount: 12, targetCount: 20 },
  { id: 24, name: 'Yoga Mat', category: 'sports', price: 999, groupPrice: 699, rating: 4.6, reviews: 5400, image: 'sports.jpeg', joinedCount: 230, targetCount: 500 },

  // Books
  { id: 25, name: 'The Art of War', category: 'books', price: 399, groupPrice: 199, rating: 4.9, reviews: 12000, image: 'books.jpeg', joinedCount: 1500, targetCount: 2000 },
  { id: 26, name: 'Space Encyclopedia', category: 'books', price: 899, groupPrice: 550, rating: 4.8, reviews: 450, image: 'books.jpeg', joinedCount: 85, targetCount: 150 },

  // Furniture
  { id: 27, name: 'Ergonomic Office Chair', category: 'furniture', price: 12999, groupPrice: 9999, rating: 4.7, reviews: 890, image: 'furniture.jpeg', sponsored: true, joinedCount: 44, targetCount: 80 },
  { id: 28, name: 'Bean Bag', category: 'furniture', price: 2499, groupPrice: 1699, rating: 4.5, reviews: 2300, image: 'furniture.jpeg', joinedCount: 67, targetCount: 150 },

  // Toys
  { id: 29, name: 'Building Blocks Set', category: 'toys', price: 1499, groupPrice: 999, rating: 4.8, reviews: 1100, image: 'toys.jpeg', joinedCount: 35, targetCount: 100 },
  { id: 30, name: 'Teddy Bear', category: 'toys', price: 799, groupPrice: 499, rating: 4.6, reviews: 3400, image: 'toys.jpeg', joinedCount: 120, targetCount: 200 },

  // Live & Group Specific
  { id: 31, name: 'Live - Fresh Salmon', category: 'live', price: 1200, groupPrice: 950, rating: 4.9, reviews: 120, image: 'food.jpeg', sponsored: true, joinedCount: 8, targetCount: 15 },
  { id: 32, name: 'Group Deal - Sofa Set', category: 'group', price: 45000, groupPrice: 38000, rating: 4.8, reviews: 45, image: 'furniture.jpeg', sponsored: true, joinedCount: 3, targetCount: 5 },
  { id: 33, name: 'Fuji Apples', category: 'fruits', price: 180, groupPrice: 130, rating: 4.7, reviews: 520, image: 'fruits_and_veg.webp', joinedCount: 2, targetCount: 10 },
  { id: 34, name: 'Whole Grain Bread', category: 'food', price: 60, groupPrice: 40, rating: 4.8, reviews: 890, image: 'food.jpeg', joinedCount: 5, targetCount: 10 }
];

export const SUB_CATEGORIES: Record<string, string[]> = {
  fruits: ['Fresh Fruits', 'Exotic Fruits', 'Seasonal'],
  vegetables: ['Leafy Greens', 'Root Veggies', 'Organic'],
  food: ['Health Food', 'Snacks', 'Beverages'],
  fashion: ['Menswear', 'Womenswear', 'Accessories'],
  mobiles: ['Smartphones', 'Accessories', 'Tablets'],
  beauty: ['Skincare', 'Makeup', 'Haircare'],
  electronics: ['Laptops', 'Headphones', 'Cameras'],
  home: ['Kitchen', 'Decor', 'Furniture'],
  appliances: ['Kitchen Appliances', 'Home Appliances'],
  '2wheeler': ['Scooters', 'Bikes', 'Helmets'],
  auto: ['Car Accessories', 'Cleaning Utilities'],
  sports: ['Cricket', 'Fitness Equipment', 'Accessories'],
  books: ['Fiction', 'Academic', 'Reference'],
  furniture: ['Office Furniture', 'Home Furniture'],
  toys: ['Board Games', 'Plush Toys', 'Educational'],
  live: ['Fresh Fish', 'Organic Greens'],
  group: ['Living Room Sets', 'Smart Home bundles'],
  default: ['Best Sellers', 'New Arrivals', 'Trending']
};

export const CATEGORIES: CategoryInfo[] = [
  { key: 'fruits', label: 'Fruits & Veg', image: 'fruits_and_veg.webp', subcategories: SUB_CATEGORIES.fruits },
  { key: 'fashion', label: 'Fashion', image: 'fashion.jpeg', subcategories: SUB_CATEGORIES.fashion },
  { key: 'mobiles', label: 'Mobiles', image: 'mobile.jpeg', subcategories: SUB_CATEGORIES.mobiles },
  { key: 'beauty', label: 'Beauty', image: 'beauty.jpeg', subcategories: SUB_CATEGORIES.beauty },
  { key: 'electronics', label: 'Electronics', image: 'electronics.jpeg', subcategories: SUB_CATEGORIES.electronics },
  { key: 'home', label: 'Home & Kitchen', image: 'home.webp', subcategories: SUB_CATEGORIES.home },
  { key: 'food', label: 'Food & Health', image: 'food.jpeg', subcategories: SUB_CATEGORIES.food },
  { key: 'appliances', label: 'Appliances', image: 'home.webp', subcategories: SUB_CATEGORIES.appliances },
  { key: '2wheeler', label: '2 Wheeler', image: 'mobile.jpeg', subcategories: SUB_CATEGORIES['2wheeler'] },
  { key: 'auto', label: 'Auto Access', image: 'mobile.jpeg', subcategories: SUB_CATEGORIES.auto },
  { key: 'sports', label: 'Sports', image: 'sports.jpeg', subcategories: SUB_CATEGORIES.sports },
  { key: 'books', label: 'Books', image: 'books.jpeg', subcategories: SUB_CATEGORIES.books },
  { key: 'furniture', label: 'Furniture', image: 'furniture.jpeg', subcategories: SUB_CATEGORIES.furniture },
  { key: 'toys', label: 'Toys', image: 'toys.jpeg', subcategories: SUB_CATEGORIES.toys }
];
