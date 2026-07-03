import type { CategoryNode } from '../types';

export const CATEGORY_DATA: CategoryNode[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    icon: 'Smartphone',
    subcategories: [
      {
        id: 'mobiles',
        name: 'Mobiles & Accessories',
        slug: 'mobiles',
        subcategories: [
          { id: 'smartphones', name: 'Smartphones', slug: 'smartphones' },
          { id: 'feature-phones', name: 'Feature Phones', slug: 'feature-phones' },
          { id: 'mobile-cases', name: 'Cases & Covers', slug: 'mobile-cases' },
          { id: 'power-banks', name: 'Power Banks', slug: 'power-banks' },
        ]
      },
      {
        id: 'laptops',
        name: 'Laptops & PCs',
        slug: 'laptops',
        subcategories: [
          { id: 'gaming-laptops', name: 'Gaming Laptops', slug: 'gaming-laptops' },
          { id: 'macbooks', name: 'MacBooks', slug: 'macbooks' },
          { id: 'monitors', name: 'Monitors', slug: 'monitors' },
          { id: 'pc-components', name: 'PC Components', slug: 'pc-components' },
        ]
      },
      {
        id: 'audio',
        name: 'Audio',
        slug: 'audio',
        subcategories: [
          { id: 'headphones', name: 'Headphones', slug: 'headphones' },
          { id: 'earbuds', name: 'True Wireless Earbuds', slug: 'earbuds' },
          { id: 'speakers', name: 'Bluetooth Speakers', slug: 'speakers' },
        ]
      }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion',
    slug: 'fashion',
    icon: 'Shirt',
    subcategories: [
      {
        id: 'mens-fashion',
        name: 'Men\'s Clothing',
        slug: 'mens-fashion',
        subcategories: [
          { id: 'mens-tshirts', name: 'T-Shirts', slug: 'mens-tshirts' },
          { id: 'mens-jeans', name: 'Jeans', slug: 'mens-jeans' },
          { id: 'mens-shoes', name: 'Shoes', slug: 'mens-shoes' },
          { id: 'mens-watches', name: 'Watches', slug: 'mens-watches' },
        ]
      },
      {
        id: 'womens-fashion',
        name: 'Women\'s Clothing',
        slug: 'womens-fashion',
        subcategories: [
          { id: 'womens-dresses', name: 'Dresses', slug: 'womens-dresses' },
          { id: 'womens-tops', name: 'Tops', slug: 'womens-tops' },
          { id: 'womens-shoes', name: 'Shoes & Heels', slug: 'womens-shoes' },
          { id: 'womens-jewelry', name: 'Jewelry', slug: 'womens-jewelry' },
        ]
      }
    ]
  },
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    icon: 'Home',
    subcategories: [
      {
        id: 'appliances',
        name: 'Large Appliances',
        slug: 'appliances',
        subcategories: [
          { id: 'refrigerators', name: 'Refrigerators', slug: 'refrigerators' },
          { id: 'washing-machines', name: 'Washing Machines', slug: 'washing-machines' },
          { id: 'ac', name: 'Air Conditioners', slug: 'ac' },
        ]
      },
      {
        id: 'kitchenware',
        name: 'Kitchen & Dining',
        slug: 'kitchenware',
        subcategories: [
          { id: 'cookware', name: 'Cookware', slug: 'cookware' },
          { id: 'tableware', name: 'Tableware', slug: 'tableware' },
          { id: 'kitchen-storage', name: 'Storage & Containers', slug: 'kitchen-storage' },
        ]
      },
      {
        id: 'home-decor',
        name: 'Home Decor',
        slug: 'home-decor',
        subcategories: [
          { id: 'bedsheets', name: 'Bedsheets', slug: 'bedsheets' },
          { id: 'curtains', name: 'Curtains', slug: 'curtains' },
          { id: 'lighting', name: 'Lighting', slug: 'lighting' },
        ]
      }
    ]
  },
  {
    id: 'groceries',
    name: 'Daily Groceries',
    slug: 'groceries',
    icon: 'ShoppingCart',
    subcategories: [
      {
        id: 'fresh-produce',
        name: 'Fruits & Vegetables',
        slug: 'fresh-produce',
        subcategories: [
          { id: 'fresh-fruits', name: 'Fresh Fruits', slug: 'fresh-fruits' },
          { id: 'fresh-vegetables', name: 'Fresh Vegetables', slug: 'fresh-vegetables' },
        ]
      },
      {
        id: 'dairy',
        name: 'Dairy & Bakery',
        slug: 'dairy',
        subcategories: [
          { id: 'milk', name: 'Milk', slug: 'milk' },
          { id: 'bread', name: 'Bread', slug: 'bread' },
          { id: 'eggs', name: 'Eggs', slug: 'eggs' },
          { id: 'cheese', name: 'Cheese', slug: 'cheese' },
        ]
      },
      {
        id: 'snacks',
        name: 'Snacks & Beverages',
        slug: 'snacks',
        subcategories: [
          { id: 'chips', name: 'Chips & Crisps', slug: 'chips' },
          { id: 'biscuits', name: 'Biscuits', slug: 'biscuits' },
          { id: 'cold-drinks', name: 'Cold Drinks', slug: 'cold-drinks' },
          { id: 'tea-coffee', name: 'Tea & Coffee', slug: 'tea-coffee' },
        ]
      }
    ]
  },
  {
    id: 'beauty',
    name: 'Beauty & Personal Care',
    slug: 'beauty',
    icon: 'Sparkles',
    subcategories: [
      {
        id: 'skincare',
        name: 'Skin Care',
        slug: 'skincare',
        subcategories: [
          { id: 'face-wash', name: 'Face Wash', slug: 'face-wash' },
          { id: 'moisturizers', name: 'Moisturizers', slug: 'moisturizers' },
          { id: 'sunscreen', name: 'Sunscreen', slug: 'sunscreen' },
        ]
      },
      {
        id: 'haircare',
        name: 'Hair Care',
        slug: 'haircare',
        subcategories: [
          { id: 'shampoo', name: 'Shampoo', slug: 'shampoo' },
          { id: 'conditioner', name: 'Conditioner', slug: 'conditioner' },
          { id: 'hair-oil', name: 'Hair Oil', slug: 'hair-oil' },
        ]
      }
    ]
  }
];
