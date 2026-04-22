// Global State
let productsData = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let bannerSettings = JSON.parse(localStorage.getItem('banner_settings') || '{"effect":"fade","speed":5,"showDots":true}');

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    loadProducts();
    initBanners();
    initFlashSaleTimer();
    updateCartBadge();

    // Auto refresh data every few seconds
    setInterval(loadProducts, 5000);
}

// --- Banner Slider System ---
async function initBanners() {
    const container = document.getElementById('main-banner-container');
    const dotsContainer = document.querySelector('.slider-dots');
    if (!container) return;

    try {
        // Load settings first
        const settingsResponse = await fetch('upload.php?type=settings');
        const settings = await settingsResponse.json();
        if (settings.slide_speed) bannerSettings.speed = settings.slide_speed;
        if (settings.slide_effect) bannerSettings.effect = settings.slide_effect;

        const response = await fetch('upload.php?type=banner');
        const banners = await response.json();

        // Default banner if none exists
        const defaultBanners = [{image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'}];
        const activeBanners = banners.length > 0 ? banners : defaultBanners;

        container.innerHTML = '';
        if (dotsContainer) dotsContainer.innerHTML = '';

        activeBanners.forEach((banner, i) => {
            const slide = document.createElement('div');
            slide.className = `slide ${i === 0 ? 'active' : ''}`;
            slide.innerHTML = `<img src="${banner.image}" alt="Banner ${i+1}">`;
            container.appendChild(slide);

            if (dotsContainer && activeBanners.length > 1) {
                const dot = document.createElement('span');
                dot.className = `dot ${i === 0 ? 'active' : ''}`;
                dot.onclick = () => goToSlide(i);
                dotsContainer.appendChild(dot);
            }
        });

        if (activeBanners.length > 1) {
            startAutoSlide(activeBanners.length);
        }
    } catch (error) {
        console.error('Error fetching banners:', error);
    }
}

let slideInterval;
function startAutoSlide(count) {
    let current = 0;
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        current = (current + 1) % count;
        goToSlide(current);
    }, bannerSettings.speed * 1000);
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if (slides[index]) slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
}

// --- Flash Sale Timer ---
function initFlashSaleTimer() {
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('minutes');
    const secsEl = document.getElementById('seconds');

    if (!hoursEl) return;

    function updateTimer() {
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59);

        const diff = endOfDay - now;

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        hoursEl.innerText = String(h).padStart(2, '0');
        minsEl.innerText = String(m).padStart(2, '0');
        secsEl.innerText = String(s).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// --- Product Rendering ---
async function loadProducts() {
    try {
        const response = await fetch('upload.php?type=product');
        const localData = await response.json();

        if (JSON.stringify(localData) === JSON.stringify(productsData)) return;

        productsData = localData;
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts() {
    const flashGrid = document.querySelector('.flash-products');
    const popularGrid = document.querySelector('.popular-products');

    if (flashGrid) {
        const flashItems = productsData.filter(p => p.category === 'flash');
        flashGrid.innerHTML = flashItems.length ? flashItems.map(p => createProductCard(p)).join('') : '<p class="empty-msg">Exciting deals coming soon!</p>';
    }

    if (popularGrid) {
        const popularItems = productsData.filter(p => p.category !== 'flash');
        popularGrid.innerHTML = popularItems.length ? popularItems.map(p => createProductCard(p)).join('') : '<p class="empty-msg">Browse our premium collection.</p>';
    }
}

function createProductCard(p) {
    const price = parseFloat(p.price) || 0;
    const originalPrice = price * 1.25;

    // Smart path logic to handle domain changes and missing folders
    let imagePath = p.image;

    if (imagePath && !imagePath.startsWith('http')) {
        // Remove any leading slashes or redundant paths
        imagePath = imagePath.replace(/^(\.\/|\/|uploads\/)+/, '');
        // Always point to the local uploads folder
        imagePath = 'uploads/' + imagePath;
    } else if (!imagePath) {
        imagePath = 'https://placehold.co/400x400?text=No+Image';
    }

    return `
        <div class="product-card" onclick="location.href='product-detail.html?id=${p.id}'">
            <div class="product-image">
                <img src="${imagePath}"
                     alt="${p.name}"
                     loading="eager"
                     onerror="this.onerror=null; this.src='https://placehold.co/400x400?text=Image+Not+Found';">
                <span class="discount-badge">SAVE 25%</span>
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <div class="price-action">
                    <div class="price">
                        <span class="current-price">Rs ${price.toLocaleString()}</span>
                        <span class="original-price">Rs ${originalPrice.toLocaleString()}</span>
                    </div>
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${p.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Handle image errors gracefully
function handleImageError(img) {
    console.log("Image load failed:", img.src);
    // Try without uploads/ if it was added
    if (img.src.includes('uploads/uploads/')) {
        img.src = img.src.replace('uploads/uploads/', 'uploads/');
        return;
    }
    img.onerror = null; // Prevent infinite loop
    img.src = 'https://placehold.co/400x400?text=Photo+Coming+Soon';
}

// Global Image Error Handler to catch path issues
window.handleImgError = function(img) {
    console.log("Fixing image path for:", img.src);
    const currentSrc = img.getAttribute('src');

    // If it failed with uploads/ prefix, try without it or vice versa
    if (currentSrc.includes('uploads/uploads/')) {
        img.src = currentSrc.replace('uploads/uploads/', 'uploads/');
    } else if (!currentSrc.startsWith('uploads/') && !currentSrc.startsWith('http')) {
        img.src = 'uploads/' + currentSrc;
    } else {
        img.onerror = null;
        img.src = 'https://placehold.co/400x400?text=Image+Missing';
    }
};

// --- Cart Logic ---
window.addToCart = function(id) {
    const product = productsData.find(p => p.id == id);
    if (!product) return;

    const existing = cart.find(item => item.id == id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({...product, qty: 1});
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showToast('Added to cart!');
};

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const count = cart.reduce((sum, item) => sum + item.qty, 0);
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast active success';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// --- UI Controls ---
window.toggleCart = function(e) {
    if (e) e.preventDefault();
    const drawer = document.getElementById('cart-drawer');
    drawer.classList.toggle('active');
    if (drawer.classList.contains('active')) renderCartItems();
};

window.toggleProfile = function(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('profile-modal');
    modal.classList.toggle('active');
};

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    const subtotalEl = document.getElementById('cart-subtotal');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-msg">
                <div class="empty-cart-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <button class="continue-shopping" onclick="toggleCart()">Start Shopping</button>
            </div>`;
        totalEl.innerText = 'Rs 0';
        subtotalEl.innerText = 'Rs 0';
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        return `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price">Rs ${item.price.toLocaleString()}</span>
                    <div class="cart-item-actions">
                        <div class="qty-control">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                            <span class="qty-val">${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                        <button class="remove-item" onclick="removeItem('${item.id}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    totalEl.innerText = `Rs ${total.toLocaleString()}`;
    subtotalEl.innerText = `Rs ${total.toLocaleString()}`;
}

window.updateQty = function(id, delta) {
    const item = cart.find(i => i.id == id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeItem(id);
        else {
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCartItems();
            updateCartBadge();
        }
    }
};

window.removeItem = function(id) {
    cart = cart.filter(i => i.id != id);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartBadge();
};

window.filterCategory = function(cat) {
    const grids = document.querySelectorAll('.products-grid, .flash-products');
    grids.forEach(g => {
        const cards = g.querySelectorAll('.product-card');
        cards.forEach(card => {
            // This is a simple UI filter, in real app would filter data
            card.style.opacity = '0.5';
            setTimeout(() => card.style.opacity = '1', 300);
        });
    });
    showToast(`Filtered by ${cat}`);
};
