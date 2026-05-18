// LOADING SCREEN ANIMATION
window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Animation completes at 3s, add buffer before hiding
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      document.body.classList.add('loaded');
      window.scrollTo(0, 0); // Scroll to top
    }, 3200);
  }
});

// SHOPYNG APP LOGIC

// 1. DATA - Sample Products
const PRODUCTS = [
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

    // Live & Group (Specific for those tags)
    { id: 31, name: 'Live - Fresh Salmon', category: 'live', price: 1200, groupPrice: 950, rating: 4.9, reviews: 120, image: 'food.jpeg', sponsored: true, joinedCount: 8, targetCount: 15 },
    { id: 32, name: 'Group Deal - Sofa Set', category: 'group', price: 45000, groupPrice: 38000, rating: 4.8, reviews: 45, image: 'furniture.jpeg', sponsored: true, joinedCount: 3, targetCount: 5 },
    { id: 33, name: 'Fuji Apples', category: 'fruits', price: 180, groupPrice: 130, rating: 4.7, reviews: 520, image: 'fruits_and_veg.webp', joinedCount: 2, targetCount: 10 },
    { id: 34, name: 'Whole Grain Bread', category: 'food', price: 60, groupPrice: 40, rating: 4.8, reviews: 890, image: 'food.jpeg', joinedCount: 5, targetCount: 10 }
];

// 2. STATE
let cart = [];
let likedProducts = [];
let currentCategory = 'all';
let isLoggedIn = false;
let userAddress = null;
let lastView = 'home';
let joinedGroups = [];
let pendingAction = null;

// 3. SELECTORS
const productsGrid = document.getElementById('products-grid');
const cartBtn = document.getElementById('cart-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartClose = document.getElementById('cart-close');
const cartItemsContainer = document.getElementById('cart-items');
const catBadge = document.getElementById('cart-badge');
const billItemsTotal = document.getElementById('bill-items-total');
const billGrandTotal = document.getElementById('bill-grand-total');
const cartFooter = document.getElementById('cart-footer');
const cartEmptyState = document.getElementById('cart-empty');

// Login Modal Selectors
const loginModal = document.getElementById('login-modal-overlay');
const loginClose = document.getElementById('login-modal-close');
const loginBtn = document.getElementById('login-btn');
const stepPhone = document.getElementById('login-step-phone');
const stepOtp = document.getElementById('login-step-otp');
const stepName = document.getElementById('login-step-name');
const phoneInput = document.getElementById('login-phone');
const displayPhone = document.getElementById('display-phone');
const otpTimerDisplay = document.getElementById('otp-timer');
const nameInput = document.getElementById('login-name');
const btnPhoneContinue = document.getElementById('btn-phone-continue');
const btnOtpVerify = document.getElementById('btn-otp-verify');
const btnNameFinish = document.getElementById('btn-name-finish');
const otpBoxes = document.querySelectorAll('.otp-box');

// Address Modal Selectors
const addressModal = document.getElementById('address-modal-overlay');
const addressClose = document.getElementById('address-modal-close');
const btnSaveAddress = document.getElementById('btn-save-address');
const addressInput = document.getElementById('address-input');

// Notifications
const notificationContainer = document.getElementById('notification-container');

function showNotification(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    notificationContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('active'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Category View Selectors
const homeView = document.getElementById('home-view');
const categoryView = document.getElementById('category-view');
const activeCategoryTitle = document.getElementById('active-category-title');
const subcategoryList = document.getElementById('subcategory-list');
const categoryProductsGrid = document.getElementById('category-products-grid');

const SUB_CATEGORIES = {
    'fruits': ['Fresh Fruits', 'Exotic Fruits', 'Seasonal'],
    'vegetables': ['Leafy Greens', 'Root Veggies', 'Organic'],
    'food': ['Health Food', 'Snacks', 'Beverages'],
    'fashion': ['Menswear', 'Womenswear', 'Accessories'],
    'mobiles': ['Smartphones', 'Accessories', 'Tablets'],
    'beauty': ['Skincare', 'Makeup', 'Haircare'],
    'electronics': ['Laptops', 'Headphones', 'Cameras'],
    'home': ['Kitchen', 'Decor', 'Furniture'],
    'default': ['Best Sellers', 'New Arrivals', 'Trending']
};

// 4. FUNCTIONS

// Render Products
function renderProducts(category = 'all') {
    productsGrid.innerHTML = '';
    
    const filtered = category === 'all' 
        ? PRODUCTS 
        : PRODUCTS.filter(p => p.category === category);
    
    // Display 10 products (5 per row)
    const displayProducts = filtered.slice(0, 10);
        
    displayProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => showProductDetails(product.id);
        card.innerHTML = `
            ${product.sponsored ? '<div class="sponsored-label">Sponsored</div>' : ''}
            <button class="like-btn" onclick="toggleLike(event, ${product.id})" data-liked="false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
            <div class="product-image-box">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-meta">
                    <span class="rating">⭐ ${product.rating} <span style="color:#888;font-weight:400">(${product.reviews})</span></span>
                </div>
                    <div class="product-footer">
                        <div class="price-wrap">
                            <span class="price">₹${product.price.toFixed(2)}</span>
                            ${product.groupPrice ? `<span class="group-price">Group: ₹${product.groupPrice.toFixed(2)}</span>` : ''}
                        </div>
                        <button class="add-to-cart" onclick="addToCart(event, ${product.id})" style="width: auto; padding: 0 15px; font-size: 13px; font-weight: 700;">Add</button>
                    </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// Filter Category (Global)
window.filterCategory = function(category) {
    currentCategory = category;
    
    // Switch to category view
    homeView.style.display = 'none';
    categoryView.style.display = 'block';
    window.scrollTo(0, 0);
    
    // Update Title
    const title = category.charAt(0).toUpperCase() + category.slice(1);
    activeCategoryTitle.innerText = title;
    
    // Populate Subcategories
    const subs = SUB_CATEGORIES[category] || SUB_CATEGORIES['default'];
    subcategoryList.innerHTML = subs.map(s => `
        <label style="display:flex; align-items:center; gap:10px; font-size:14px; cursor:pointer;">
            <input type="checkbox"> ${s}
        </label>
    `).join('');
    
    // Render Products in Category View
    renderCategoryProducts(category);
};

window.showHome = function() {
    homeView.style.display = 'block';
    categoryView.style.display = 'none';
    if (typeof productDetailView !== 'undefined') productDetailView.style.display = 'none';
    window.scrollTo(0, 0);
};

// Product Details Logic
const productDetailView = document.getElementById('product-detail-view');
const productDetailContent = document.getElementById('product-detail-content');

window.showProductDetails = function(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    // Track last view based on what is currently displayed
    if (homeView.style.display !== 'none') {
        lastView = 'home';
    } else if (categoryView.style.display !== 'none') {
        lastView = 'category';
    }

    // Hide other views
    homeView.style.display = 'none';
    categoryView.style.display = 'none';
    if (productDetailView) {
        productDetailView.style.display = 'block';
        window.scrollTo(0, 0);

        const isLiked = likedProducts.includes(product.id);
        const heartFill = isLiked ? '#E53935' : 'none';
        const heartStroke = isLiked ? '#E53935' : 'currentColor';

        productDetailContent.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; background:var(--white); border-radius:24px; padding: 40px; border:1px solid var(--border-color);">
                <img src="${product.image}" style="max-width:100%; max-height:100%; object-fit:contain;">
            </div>
            <div style="display:flex; flex-direction:column; justify-content:center;">
                ${product.sponsored ? '<div class="sponsored-label" style="position:static; display:inline-block; margin-bottom:15px; width:fit-content;">Sponsored</div>' : ''}
                <h1 style="font-size:36px; font-family:var(--font-heading); margin-bottom:15px; color:var(--text-dark);">${product.name}</h1>
                <div style="font-size:16px; margin-bottom:25px; color:var(--text-muted); display:flex; align-items:center;">
                    <span class="rating" style="background:#FFF8E1; color:#FFB300; padding:4px 8px; border-radius:6px; font-weight:700;">⭐ ${product.rating}</span> 
                    <span style="margin-left:10px;">(${product.reviews} reviews)</span>
                </div>
                <div style="font-size:32px; font-weight:800; color:var(--primary-main); margin-bottom:15px; display:flex; align-items:center;">
                    ₹${product.price.toFixed(2)}
                    ${product.oldPrice ? `<span style="font-size:18px; color:var(--text-muted); font-weight:500; text-decoration:line-through; margin-left:15px;">₹${product.oldPrice.toFixed(2)}</span>` : ''}
                </div>
                ${product.groupPrice ? `
                <div style="margin-bottom:30px;">
                    <div style="background:var(--accent-orange); color:white; padding:12px 20px; border-radius:12px; display:inline-block; margin-bottom:15px; font-weight:700; font-size:16px;">
                        🔥 Group Deal: ₹${product.groupPrice.toFixed(2)}
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:8px; color:var(--text-muted);">
                        <span style="font-weight:700; color:var(--accent-orange);">${product.joinedCount} persons joined</span>
                        <span>Goal: ${product.targetCount}</span>
                    </div>
                    <div style="width:100%; height:100px; background:var(--white); border:1px solid #FFE0B2; border-radius:16px; padding:15px; display:flex; flex-direction:column; justify-content:center; gap:10px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700;">
                            <span>Progress</span>
                            <span>${Math.round((product.joinedCount / product.targetCount) * 100)}%</span>
                        </div>
                        <div style="width:100%; height:10px; background:#FFF3E0; border-radius:5px; overflow:hidden;">
                            <div style="width:${(product.joinedCount / product.targetCount) * 100}%; height:100%; background:linear-gradient(90deg, #FF9800, #F57C00); border-radius:5px; transition:width 0.5s ease;"></div>
                        </div>
                        <div style="font-size:12px; color:var(--text-muted); text-align:center;">
                            ${product.targetCount - product.joinedCount > 0 ? `Only <strong>${product.targetCount - product.joinedCount}</strong> more persons needed to unlock this deal!` : 'Deal Unlocked! 🔓'}
                        </div>
                    </div>
                </div>` : '<div style="margin-bottom:30px;"></div>'}
                
                <p style="font-size:16px; line-height:1.6; color:var(--text-muted); margin-bottom:40px;">
                    Experience premium quality with our ${product.name}. Carefully sourced and delivered fresh to your doorstep. Enjoy fast delivery and guaranteed freshness.
                </p>
                
                <div style="display:flex; gap:20px;">
                    <button class="btn-primary" onclick="addToCart(null, ${product.id})" style="flex:1; padding:18px; font-size:18px; border-radius:16px; box-shadow:0 8px 25px rgba(1,180,186,0.3);">Add to Cart</button>
                    ${product.groupPrice ? `
                        <div id="group-action-${product.id}" style="display:flex; flex:1; gap:10px;">
                            ${joinedGroups.includes(product.id) ? `
                                <button class="btn-white" style="flex:1; padding:18px; font-size:18px; border-radius:16px; border:2px solid var(--primary-main); color:var(--primary-main); font-weight:700;">Joined ✅</button>
                                <button class="btn-ghost" onclick="shareProduct(event, ${product.id})" style="flex:1; padding:18px; font-size:18px; border-radius:16px; color:var(--text-dark); border-color:var(--border-color);">Share 🔗</button>
                            ` : `
                                <button class="btn-primary" onclick="joinGroup(event, ${product.id})" style="flex:1; padding:18px; font-size:18px; border-radius:16px; background:var(--accent-orange); box-shadow:0 8px 25px rgba(255,122,15,0.3);">Join Group</button>
                            `}
                        </div>
                    ` : ''}
                    <button class="like-btn" onclick="toggleLike(event, ${product.id})" style="position:static; width:60px; height:60px; transform:none; border-radius:16px; background:${isLiked ? '#FFEBEE' : 'var(--white)'}; border-color:${isLiked ? '#E53935' : 'var(--border-color)'};" data-liked="${isLiked}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
};

window.joinGroup = function(event, productId) {
    if (event) event.stopPropagation();
    
    if (!isLoggedIn) {
        pendingAction = { type: 'join', productId: productId };
        showNotification('Login Required', 'Please login to join this group deal', 'info');
        openLoginModal();
        return;
    }

    if (!joinedGroups.includes(productId)) {
        joinedGroups.push(productId);
        const product = PRODUCTS.find(p => p.id === productId);
        if (product && product.joinedCount !== undefined) {
            product.joinedCount++;
        }
        showNotification('Group Joined', 'You have successfully joined the group deal!', 'success');
        // Refresh product details to show share button
        showProductDetails(productId);
    }
};

window.shareProduct = function(event, productId) {
    if (event) event.stopPropagation();
    
    // Generate a particular link for this product
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?product=${productId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
        showNotification('Link Copied!', 'Share this link with your friends to join the group!', 'success');
    }).catch(() => {
        // Fallback if clipboard fails
        console.log('Share URL:', shareUrl);
        showNotification('Share Link', shareUrl, 'info');
    });
};

window.goBack = function() {
    if (productDetailView) productDetailView.style.display = 'none';
    if (lastView === 'category') {
        categoryView.style.display = 'block';
    } else {
        homeView.style.display = 'block';
    }
    window.scrollTo(0, 0);
};

window.scrollCatAds = function(dir) {
    const carousel = document.getElementById('cat-ads-carousel');
    if (carousel) {
        carousel.scrollBy({ left: dir * 350, behavior: 'smooth' });
    }
};

function renderCategoryProducts(category) {
    categoryProductsGrid.innerHTML = '';
    const filtered = category === 'all' 
        ? PRODUCTS 
        : PRODUCTS.filter(p => p.category === category);
    
    if (filtered.length === 0) {
        categoryProductsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No products found in this category</p>';
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => showProductDetails(product.id);
        card.innerHTML = `
            ${product.sponsored ? '<div class="sponsored-label">Sponsored</div>' : ''}
            <button class="like-btn" onclick="toggleLike(event, ${product.id})" data-liked="false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
            <div class="product-image-box">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-meta">
                    <span class="rating">⭐ ${product.rating} <span style="color:#888;font-weight:400">(${product.reviews})</span></span>
                </div>
                <div class="product-footer">
                    <div class="price-wrap">
                        <span class="price">₹${product.price.toFixed(2)}</span>
                        ${product.groupPrice ? `<span class="group-price">Group: ₹${product.groupPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <button class="add-to-cart" onclick="addToCart(event, ${product.id})" style="width: auto; padding: 0 15px; font-size: 13px; font-weight: 700;">Add</button>
                </div>
            </div>
        `;
        categoryProductsGrid.appendChild(card);
    });
}

// Cart Logic
window.addToCart = function(event, productId) {
    if (event) event.stopPropagation();
    
    if (!isLoggedIn) {
        pendingAction = { type: 'cart', productId: productId };
        showNotification('Login Required', 'Please login to add items to your cart', 'info');
        openLoginModal();
        return;
    }

    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
    // openCart(); // Removed to prevent automatic drawer opening per user request
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
};

function updateCartUI() {
    // Badge
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    catBadge.textContent = count;
    
    // Items list
    if (cart.length === 0) {
        cartEmptyState.style.display = 'block';
        cartFooter.style.display = 'none';
        cartItemsContainer.querySelectorAll('.cart-item').forEach(el => el.remove());
    } else {
        cartEmptyState.style.display = 'none';
        cartFooter.style.display = 'block';
        
        // Clear previous items except empty state
        cartItemsContainer.querySelectorAll('.cart-item').forEach(el => el.remove());
        
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.price * item.quantity;
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-img"><img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:contain;"></div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toFixed(0)} x ${item.quantity}</div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
        
        const handlingCharge = 2;
        const total = subtotal + handlingCharge;
        
        billItemsTotal.textContent = `₹${subtotal.toFixed(0)}`;
        billGrandTotal.textContent = `₹${total.toFixed(0)}`;
    }
}

function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.style.display = 'block';
}

function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.style.display = 'none';
}

// Like Logic
window.toggleLike = function(event, productId) {
    if (event) event.stopPropagation();
    const index = likedProducts.indexOf(productId);
    const likeBtn = event.target.closest('.like-btn');
    
    if (index > -1) {
        // Remove from liked
        likedProducts.splice(index, 1);
        likeBtn.setAttribute('data-liked', 'false');
        likeBtn.classList.remove('liked');
    } else {
        // Add to liked
        likedProducts.push(productId);
        likeBtn.setAttribute('data-liked', 'true');
        likeBtn.classList.add('liked');
    }
};

// 5. EVENT LISTENERS
cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// Checkout Logic
const checkoutBtn = document.getElementById('checkout-btn');
checkoutBtn.addEventListener('click', () => {
    if (!isLoggedIn) {
        closeCart();
        openLoginModal();
    } else if (!userAddress) {
        closeCart();
        openAddressModal();
    } else {
        showNotification('Order Status', 'Processing your payment securely...', 'info');
        setTimeout(() => {
            showNotification('Success', 'Order placed successfully!', 'success');
            cart = [];
            updateCartUI();
        }, 2000);
    }
});

function openAddressModal() {
    addressModal.classList.add('active');
}

function closeAddressModal() {
    addressModal.classList.remove('active');
}

btnSaveAddress.addEventListener('click', () => {
    const addr = addressInput.value.trim();
    if (addr.length > 5) {
        userAddress = addr;
        closeAddressModal();
        showNotification('Address Saved', 'Delivery location updated successfully!', 'success');
        // Re-open cart or proceed to pay
        openCart();
    } else {
        showNotification('Invalid Address', 'Please enter a valid delivery address', 'error');
    }
});

addressClose.addEventListener('click', closeAddressModal);
addressModal.addEventListener('click', (e) => {
    if (e.target === addressModal) closeAddressModal();
});

function openLoginModal() {
    loginModal.classList.add('active');
}

function closeLoginModal() {
    loginModal.classList.remove('active');
    // Reset to step 1 for next time
    setTimeout(() => {
        stepPhone.style.display = 'block';
        stepOtp.style.display = 'none';
        stepName.style.display = 'none';
    }, 300);
}

// Login Flow
btnPhoneContinue.addEventListener('click', () => {
    const phone = phoneInput.value;
    if (phone.length === 10) {
        displayPhone.innerText = `+91 ${phone}`;
        stepPhone.style.display = 'none';
        stepOtp.style.display = 'block';
        startOTPTimer();
    } else {
        showNotification('Input Required', 'Please enter a valid 10-digit phone number', 'error');
    }
});

function startOTPTimer() {
    let timeLeft = 30;
    const interval = setInterval(() => {
        timeLeft--;
        const s = timeLeft.toString().padStart(2, '0');
        otpTimerDisplay.innerText = `00:${s}`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            otpTimerDisplay.innerText = "Resend Now";
            otpTimerDisplay.style.cursor = "pointer";
        }
    }, 1000);
}

// Auto-focus OTP boxes
otpBoxes.forEach((box, idx) => {
    box.addEventListener('keydown', (e) => {
        if (e.key >= 0 && e.key <= 9) {
            box.value = e.key; // Force set value
            if (idx < otpBoxes.length - 1) setTimeout(() => otpBoxes[idx + 1].focus(), 10);
            e.preventDefault();
        } else if (e.key === 'Backspace') {
            box.value = '';
            if (idx > 0) setTimeout(() => otpBoxes[idx - 1].focus(), 10);
            e.preventDefault();
        } else if (e.key !== 'Tab') {
            e.preventDefault(); // Block everything else
        }
    });
});

btnOtpVerify.addEventListener('click', () => {
    const otp = Array.from(otpBoxes).map(b => b.value).join('');
    if (otp === "1234" || otp.length === 4) { // Allow any 4 digits for demo
        stepOtp.style.display = 'none';
        stepName.style.display = 'block';
    } else {
        showNotification('Verification Failed', 'Invalid OTP. Hint: 1234', 'error');
    }
});

btnNameFinish.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name) {
        isLoggedIn = true;
        closeLoginModal();
        loginBtn.innerText = name.split(' ')[0]; // Show first name
        showNotification('Welcome!', `Successfully logged in as ${name}`, 'success');
        
        // Handle pending action
        if (pendingAction) {
            const { type, productId } = pendingAction;
            pendingAction = null;
            if (type === 'join') {
                joinGroup(null, productId);
            } else if (type === 'cart') {
                addToCart(null, productId);
            }
        }
    } else {
        showNotification('Input Required', 'Please enter your name', 'error');
    }
});

loginClose.addEventListener('click', closeLoginModal);
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) closeLoginModal();
});

loginBtn.addEventListener('click', () => {
    if (!isLoggedIn) {
        openLoginModal();
    } else {
        // Show profile drawer (existing logic)
        profileDrawer.classList.add('open');
    }
});

// Remove old cat chips listener as we now use global filterCategory
/*
catChips.forEach(chip => {
    chip.addEventListener('click', () => {
        catChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderProducts(chip.dataset.cat);
    });
});
*/

// Dropdown menu toggle
const sortBtn = document.getElementById('sort-btn');
const dropdownMenu = document.getElementById('dropdown-menu');

sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.sort-dropdown')) {
        dropdownMenu.classList.remove('active');
    }
});

// Dropdown item click handler
const dropdownItems = document.querySelectorAll('.dropdown-item');
dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const filterType = item.dataset.filter;
        console.log('Filter by:', filterType);
        dropdownMenu.classList.remove('active');
    });
});

// Profile drawer
const profileBtn = document.getElementById('profile-btn');
const profileDrawer = document.getElementById('profile-drawer');
const profileClose = document.getElementById('profile-close');
const logoutBtn = document.getElementById('logout-btn');

profileBtn.addEventListener('click', () => {
    profileDrawer.classList.add('open');
});

profileClose.addEventListener('click', () => {
    profileDrawer.classList.remove('open');
});

// Close profile drawer when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-drawer') && !e.target.closest('.profile-btn')) {
        profileDrawer.classList.remove('open');
    }
});

logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('Account', 'Logged out successfully!', 'info');
    profileDrawer.classList.remove('open');
});

// Search Bar
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

function searchProducts(query) {
    productsGrid.innerHTML = '';
    
    const searchQuery = query.toLowerCase();
    const filtered = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery)
    );
    
    // Display up to 8 products
    const displayProducts = filtered.slice(0, 8);
    
    if (displayProducts.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No products found</p>';
        return;
    }
    
    displayProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => showProductDetails(product.id);
        card.innerHTML = `
            <button class="like-btn" onclick="toggleLike(event, ${product.id})" data-liked="false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
            <div class="product-image-box">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-meta">
                    <span class="rating">⭐ ${product.rating} <span style="color:#888;font-weight:400">(${product.reviews})</span></span>
                </div>
                <div class="product-footer">
                    <div class="price-wrap">
                        <span class="price">₹${product.price.toFixed(2)}</span>
                        ${product.oldPrice ? `<span class="old-price">₹${product.oldPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <button class="add-to-cart" onclick="addToCart(event, ${product.id})">+</button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query.trim()) {
            searchProducts(query);
        } else {
            renderProducts(currentCategory);
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value;
        if (query.trim()) {
            searchProducts(query);
        }
    });
}

// Group Deals Logic
window.scrollDeals = function(dir) {
    const carousel = document.getElementById('group-deals-carousel');
    if (carousel) {
        carousel.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    initGroupTimers();
    
    // Check for product deep link
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (productId) {
        const id = parseInt(productId);
        if (PRODUCTS.find(p => p.id === id)) {
            setTimeout(() => showProductDetails(id), 500); // Slight delay for UI to settle
        }
    }
});

// Initialize Group Timers
function initGroupTimers() {
    const timers = document.querySelectorAll('.deal-timer');
    timers.forEach(t => {
        let timeParts = t.innerText.split(':');
        let totalSeconds = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]);

        const interval = setInterval(() => {
            totalSeconds--;
            if (totalSeconds <= 0) {
                clearInterval(interval);
                t.innerText = "EXPIRED";
                return;
            }
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            t.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }, 1000);
    });
}

// 6. INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    initGroupTimers();
});
