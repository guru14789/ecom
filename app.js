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
    {
        id: 1,
        name: "Organic Green Big Sweet Pepper Seeds - Capsicum",
        category: "vegetables",
        price: 24.00,
        oldPrice: 32.00,
        rating: 4.8,
        reviews: 12,
        tag: "FROZEN",
        image: "🫑"
    },
    {
        id: 2,
        name: "Seoul Yopokki Spicy 4 Flavors of Korean Topokki",
        category: "snacks",
        price: 0.40,
        oldPrice: null,
        rating: 4.5,
        reviews: 8,
        tag: "BEST SALE",
        image: "🥫"
    },
    {
        id: 3,
        name: "The banana cavendish fruit is very popular in Malaysia",
        category: "fruits",
        price: 0.40,
        oldPrice: null,
        rating: 4.6,
        reviews: 15,
        tag: "FRESH",
        image: "🍌"
    },
    {
        id: 4,
        name: "Organic 100% Italian hass 100% natural Avocado",
        category: "vegetables",
        price: 12.35,
        oldPrice: 15.00,
        rating: 4.9,
        reviews: 24,
        tag: "ORGANIC",
        image: "🥑"
    },
    {
        id: 5,
        name: "Mahin Brand, Extra Long Grain Basmati Rice",
        category: "grains",
        price: 13.25,
        oldPrice: 15.50,
        rating: 4.7,
        reviews: 10,
        tag: "BEST SALE",
        image: "🌾"
    },
    {
        id: 6,
        name: "Lemon Big imported from South Africa",
        category: "fruits",
        price: 4.40,
        oldPrice: null,
        rating: 4.4,
        reviews: 7,
        tag: "FRESH",
        image: "🍋"
    },
    {
        id: 7,
        name: "Lipton Lemon Green Tea from China",
        category: "beverages",
        price: 2.35,
        oldPrice: 5.00,
        rating: 4.8,
        reviews: 19,
        tag: "ORGANIC",
        image: "🍵"
    },
    {
        id: 8,
        name: "Lay's Tomato Ketchup Chips 12 Pack",
        category: "snacks",
        price: 4.40,
        oldPrice: null,
        rating: 4.3,
        reviews: 32,
        tag: null,
        image: "🍟"
    },
    {
        id: 9,
        name: "Arabian Best Beef Meat Kirkland Signature Roast",
        category: "meat",
        price: 24.00,
        oldPrice: null,
        rating: 4.9,
        reviews: 45,
        tag: "BEST SALE",
        image: "🥩"
    },
    {
        id: 10,
        name: "Noor Sunflower 100% Fresh Oil 1.5 Litres",
        category: "beverages",
        price: 10.00,
        oldPrice: 12.50,
        rating: 4.7,
        reviews: 11,
        tag: null,
        image: "🍶"
    }
];

// 2. STATE
let cart = [];
let likedProducts = [];
let currentCategory = 'all';

// 3. SELECTORS
const productsGrid = document.getElementById('products-grid');
const cartBtn = document.getElementById('cart-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartClose = document.getElementById('cart-close');
const cartItemsContainer = document.getElementById('cart-items');
const cartBadge = document.getElementById('cart-badge');
const cartTotalLabel = document.getElementById('cart-total-price');
const cartFooter = document.getElementById('cart-footer');
const cartEmptyState = document.getElementById('cart-empty');
const catChips = document.querySelectorAll('.cat-chip');

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
        card.innerHTML = `
            <button class="like-btn" onclick="toggleLike(${product.id})" data-liked="false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
            <div class="product-image-box">
                ${product.image}
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
                    <button class="add-to-cart" onclick="addToCart(${product.id})">+</button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// Cart Logic
window.addToCart = function(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
    openCart();
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
};

function updateCartUI() {
    // Badge
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = count;
    
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
        
        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-img">${item.image}</div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toFixed(2)} x ${item.quantity}</div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
        
        cartTotalLabel.textContent = `₹${total.toFixed(2)}`;
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
window.toggleLike = function(productId) {
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

catChips.forEach(chip => {
    chip.addEventListener('click', () => {
        catChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderProducts(chip.dataset.cat);
    });
});

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
    alert('Logged out successfully!');
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
        card.innerHTML = `
            <button class="like-btn" onclick="toggleLike(${product.id})" data-liked="false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
            <div class="product-image-box">
                ${product.image}
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
                    <button class="add-to-cart" onclick="addToCart(${product.id})">+</button>
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

// 6. INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
});
