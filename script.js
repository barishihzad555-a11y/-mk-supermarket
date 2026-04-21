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

// Global State
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
let cart = [];
let wishlist = new Set();

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    initAuth();
    await fetchDynamicProducts();
    renderProducts();
    initSlider();
    initCart();
    initProfilePopup();
    initGlobalSearch();
    initCartDrawer();
    initNavigation();
});

async function fetchDynamicProducts() {
    try {
        const response = await fetch('upload.php');
        if (response.ok) {
            const dynamicProducts = await response.json();
            if (dynamicProducts && dynamicProducts.length > 0) {
                const formatted = dynamicProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: parseFloat(p.price),
                    originalPrice: parseFloat(p.price) * 1.2,
                    discount: "New",
                    image: p.image.startsWith('http') ? p.image : 'uploads/' + p.image,
                    category: p.category === 'Flash Sale' ? 'flash' : 'popular'
                }));
                productsData = [...formatted, ...productsData];
            }
        }
    } catch (e) { console.warn("Dynamic products failed to load"); }
}

function renderProducts() {
    const flashGrid = document.querySelector('.flash-products');
    const popularGrid = document.querySelector('.popular-products');
    if (flashGrid) flashGrid.innerHTML = productsData.filter(p => p.category === 'flash').map(p => createProductCard(p)).join('');
    if (popularGrid) popularGrid.innerHTML = productsData.filter(p => p.category === 'popular').map(p => createProductCard(p)).join('');
}

function createProductCard(p) {
    return `
        <div class="product-card" onclick="location.href='product-detail.html?id=${p.id}'">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/200x200?text=Product'">
                <span class="discount-badge">${p.discount}</span>
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price-action">
                    <div class="price">
                        <span class="current-price">Rs ${p.price.toLocaleString()}</span>
                    </div>
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); handleAddToCart('${p.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
        </div>`;
}

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let current = 0;
    if (slides.length > 0) {
        setInterval(() => {
            slides[current].classList.remove('active');
            if(dots[current]) dots[current].classList.remove('active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('active');
            if(dots[current]) dots[current].classList.add('active');
        }, 4000);
    }
}

function initCart() {
    const saved = localStorage.getItem('mk_cart');
    if (saved) cart = JSON.parse(saved);
    updateCartCount();
}

function handleAddToCart(id) {
    const p = productsData.find(item => item.id === id);
    if (p) {
        const existing = cart.find(item => item.id === id);
        if (existing) existing.qty++;
        else cart.push({...p, qty: 1});
        localStorage.setItem('mk_cart', JSON.stringify(cart));
        updateCartCount();
        openCartDrawer();
    }
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = cart.reduce((s, i) => s + i.qty, 0);
    renderCartItems();
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center;">کارٹ خالی ہے</div>';
        return;
    }
    container.innerHTML = cart.map(item => `
        <div class="cart-item" style="display:flex; gap:10px; padding:10px; border-bottom:1px solid #eee;">
            <img src="${item.image}" width="50" height="50" style="object-fit:cover; border-radius:5px;">
            <div style="flex:1">
                <h4 style="margin:0; font-size:14px;">${item.name}</h4>
                <p style="margin:5px 0; color:#d63031; font-weight:bold;">Rs ${item.price}</p>
                <div style="font-size:12px;">Qty: ${item.qty}</div>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (subtotalEl) subtotalEl.textContent = `Rs ${subtotal.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `Rs ${(subtotal + (subtotal >= 5000 ? 0 : 250)).toLocaleString()}`;
}

function initProfilePopup() {
    const btn = document.getElementById('account-btn');
    const modal = document.getElementById('profile-modal');
    const close = document.getElementById('close-profile');
    if (btn && modal) {
        btn.onclick = (e) => { e.preventDefault(); modal.classList.add('active'); };
        if (close) close.onclick = () => modal.classList.remove('active');
    }
}

function initCartDrawer() {
    const btn = document.getElementById('cart-btn');
    const drawer = document.getElementById('cart-drawer');
    const close = document.getElementById('close-cart');
    if (btn && drawer) {
        btn.onclick = (e) => { e.preventDefault(); openCartDrawer(); };
        if (close) close.onclick = () => closeCartDrawer();
    }
}

function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) { drawer.style.display = 'flex'; setTimeout(() => drawer.classList.add('active'), 10); }
}

function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) { drawer.classList.remove('active'); setTimeout(() => drawer.style.display = 'none', 400); }
}

function initAuth() {
    if (typeof firebase === 'undefined') return;
    firebase.auth().onAuthStateChanged(user => {
        const loggedIn = document.getElementById('profile-logged-in');
        const loggedOut = document.getElementById('profile-logged-out');
        if (user) {
            if (loggedIn) loggedIn.style.display = 'block';
            if (loggedOut) loggedOut.style.display = 'none';
            const nameEl = document.getElementById('profile-display-name');
            if (nameEl) nameEl.textContent = user.displayName || 'User';
        } else {
            if (loggedIn) loggedIn.style.display = 'none';
            if (loggedOut) loggedOut.style.display = 'block';
        }
    });
}

function initGlobalSearch() {
    const input = document.getElementById('global-search');
    const results = document.getElementById('search-results');
    if (input && results) {
        input.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 1) { results.classList.remove('active'); return; }
            const filtered = productsData.filter(p => p.name.toLowerCase().includes(query));
            results.innerHTML = filtered.map(p => `<div style="padding:10px; border-bottom:1px solid #eee; cursor:pointer;" onclick="location.href='product-detail.html?id=${p.id}'">${p.name}</div>`).join('');
            results.classList.add('active');
        };
    }
}

function initNavigation() {}
