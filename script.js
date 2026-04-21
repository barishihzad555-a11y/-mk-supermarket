// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA46y4Nq5B0KhLF1S4FyVTZJ3EWM1w8Zuw",
  authDomain: "mk-super-market.firebaseapp.com",
  projectId: "mk-super-market",
  storageBucket: "mk-super-market.firebasestorage.app",
  messagingSenderId: "774620090232",
  appId: "1:774620090232:web:a03221790642a761a5c28d",
  measurementId: "G-EY7GL20TEY"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}

// Global Config
const IMAGE_BASE_URL = "uploads/"; // This points to your uploads folder on Hostinger

// Products Data Base (Initial/Fallback)
let productsData = [
    {
        id: "f1",
        name: "Premium Headphones",
        price: 1499,
        originalPrice: 2199,
        discount: "-30%",
        image: "uploads/products/headphones.webp",
        category: "flash"
    },
    {
        id: "f2",
        name: "Wireless Mouse",
        price: 799,
        originalPrice: 1099,
        discount: "-25%",
        image: "uploads/products/mouse.webp",
        category: "flash"
    },
    {
        id: "p1",
        name: "Aura Pro Smartwatch",
        price: 24999,
        originalPrice: 34999,
        discount: "-15%",
        image: "uploads/products/smartwatch.webp",
        category: "popular"
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await fetchDynamicProducts();
    renderProducts();
    initSlider();
    initCountdown();
    initCart();
    initWishlist();
    initNavigation();
    initLazyLoading();
    initProfilePopup();
    initCartDrawer();
    initAuth();
    initGlobalSearch();
});

async function fetchDynamicProducts() {
    try {
        const response = await fetch('upload.php');
        if (!response.ok) throw new Error('Network response was not ok');
        const dynamicProducts = await response.json();

        if (dynamicProducts && dynamicProducts.length > 0) {
            const formatted = dynamicProducts.map(p => {
                let fullImagePath = p.image;
                if (!p.image.startsWith('http') && !p.image.startsWith('uploads/')) {
                    fullImagePath = 'uploads/' + p.image;
                }
                return {
                    id: p.id,
                    name: p.name,
                    price: parseFloat(p.price),
                    originalPrice: parseFloat(p.price) * 1.2,
                    discount: "New",
                    image: fullImagePath,
                    category: p.category === 'Flash Sale' ? 'flash' : 'popular'
                };
            });
            productsData = [...formatted, ...productsData];
        }
    } catch (error) {
        console.warn('Dynamic products not loaded. Using fallback data.');
    }
}

function renderProducts() {
    const flashGrid = document.querySelector('.flash-products');
    const popularGrid = document.querySelector('.popular-products');

    if (flashGrid) {
        const flashProducts = productsData.filter(p => p.category === 'flash');
        flashGrid.innerHTML = flashProducts.map(p => createProductCard(p)).join('');
    }

    if (popularGrid) {
        const popularProducts = productsData.filter(p => p.category === 'popular');
        popularGrid.innerHTML = popularProducts.map(p => createProductCard(p)).join('');
    }
}

function createProductCard(p) {
    return `
        <div class="product-card" onclick="location.href='product-detail.html?id=${p.id}'" tabindex="0">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}" loading="lazy" width="200" height="200" onerror="this.src='https://placehold.co/200x200?text=Product'">
                <button class="wishlist-btn" data-product="${p.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                <span class="discount-badge">${p.discount}</span>
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price-action">
                    <div class="price">
                        <span class="current-price">Rs ${p.price.toLocaleString()}</span>
                        <span class="original-price">${p.originalPrice ? 'Rs ' + p.originalPrice.toLocaleString() : ''}</span>
                    </div>
                    <button class="add-to-cart-btn" data-product="${p.id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// --- Rest of your UI functions (Cart, Auth, etc.) stay the same ---
// [For brevity, including core logic below]

function initProfilePopup() {
    const accountBtn = document.getElementById('account-btn');
    const profileModal = document.getElementById('profile-modal');
    if (accountBtn && profileModal) {
        accountBtn.onclick = (e) => { e.preventDefault(); profileModal.classList.add('active'); };
        document.getElementById('close-profile').onclick = () => profileModal.classList.remove('active');
    }
}

function initCart() {
    const savedCart = localStorage.getItem('mk_cart');
    if (savedCart) cart = JSON.parse(savedCart);
    updateCartDisplay();
}

function updateCartDisplay() {
    const count = document.getElementById('cart-count');
    if (count) count.textContent = cart.reduce((s, i) => s + i.qty, 0);
    renderCartItems();
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg"><h3>کارٹ خالی ہے</h3></div>';
        return;
    }
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" width="50">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>Rs ${item.price}</p>
            </div>
        </div>
    `).join('');
}

function initAuth() {
    if (typeof firebase === 'undefined') return;
    firebase.auth().onAuthStateChanged(user => {
        const loggedIn = document.getElementById('profile-logged-in');
        const loggedOut = document.getElementById('profile-logged-out');
        if (user) {
            if(loggedIn) loggedIn.style.display = 'block';
            if(loggedOut) loggedOut.style.display = 'none';
            document.getElementById('profile-display-name').textContent = user.displayName || 'User';
        } else {
            if(loggedIn) loggedIn.style.display = 'none';
            if(loggedOut) loggedOut.style.display = 'block';
        }
    });
}

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    let current = 0;
    if (slides.length) {
        setInterval(() => {
            slides[current].classList.remove('active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('active');
        }, 4000);
    }
}

function initGlobalSearch() {
    const input = document.getElementById('global-search');
    const results = document.getElementById('search-results');
    if (input) {
        input.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = productsData.filter(p => p.name.toLowerCase().includes(query));
            if (query && filtered.length) {
                results.innerHTML = filtered.map(p => `<div class="search-item" onclick="location.href='product-detail.html?id=${p.id}'">${p.name}</div>`).join('');
                results.classList.add('active');
            } else {
                results.classList.remove('active');
            }
        };
    }
}
function initCountdown() {}
function initWishlist() {}
function initNavigation() {}
function initLazyLoading() {}
function initCartDrawer() {}
