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

// DOM Elements
const sliderContainer = document.querySelector('.slider-container');
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const countdownElement = document.getElementById('countdown');
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const wishlistButtons = document.querySelectorAll('.wishlist-btn');
const cartCountElement = document.getElementById('cart-count');
const navItems = document.querySelectorAll('.nav-item');

// Cart Elements
const cartDrawer = document.getElementById('cart-drawer');
const cartBtn = document.getElementById('cart-btn');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotalElement = document.getElementById('cart-subtotal');
const cartTotalElement = document.getElementById('cart-total');
const continueShoppingBtn = document.getElementById('continue-shopping');

// Auth Elements
const profileModal = document.getElementById('profile-modal');
const accountBtn = document.getElementById('account-btn');
const closeProfile = document.getElementById('close-profile');
const loggedOutView = document.getElementById('profile-logged-out');
const loggedInView = document.getElementById('profile-logged-in');
const signupView = document.getElementById('profile-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logout-btn');

// State
let currentSlide = 0;
let cart = [];
let wishlist = new Set();
let countdownInterval;

// Global Config for Hostinger
const IMAGE_BASE_URL = window.location.origin + "/";

// Products Data Base (Initial/Fallback)
let productsData = [
    {
        id: "f1",
        name: "Premium Headphones",
        price: 1499,
        originalPrice: 2199,
        discount: "-30%",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        category: "flash"
    },
    {
        id: "f2",
        name: "Wireless Mouse",
        price: 799,
        originalPrice: 1099,
        discount: "-25%",
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
        category: "flash"
    },
    {
        id: "p1",
        name: "Aura Pro Smartwatch",
        price: 24999,
        originalPrice: 34999,
        discount: "-15%",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
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
        const dynamicProducts = await response.json();

        if (dynamicProducts && dynamicProducts.length > 0) {
            // Transform dynamic products to match UI format
            const formatted = dynamicProducts.map(p => {
                // Ensure image path is correct
                let fullImagePath = p.image;
                if (!p.image.startsWith('http')) {
                    fullImagePath = IMAGE_BASE_URL + p.image;
                }

                return {
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    originalPrice: p.price + (p.price * 0.2), // Auto estimate original price
                    discount: "New",
                    image: fullImagePath,
                    category: p.category === 'Flash Sale' ? 'flash' : 'popular'
                };
            });

            // Add new products to the top
            productsData = [...formatted, ...productsData];
        }
    } catch (error) {
        console.error('Error fetching dynamic products:', error);
    }
}

function renderProducts() {
    const flashGrid = document.querySelector('.flash-products');
    const popularGrid = document.querySelector('.products-grid:not(.flash-products)');

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
                <button class="wishlist-btn" data-product="${p.id}" aria-label="Add ${p.name} to wishlist">
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
                        <span class="current-price">${p.price.toLocaleString()}</span>
                        <span class="original-price">${p.originalPrice ? p.originalPrice.toLocaleString() : ''}</span>
                    </div>
                    <button class="add-to-cart-btn" data-product="${p.id}" aria-label="Add ${p.name} to cart">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Profile Popup Functionality
function initProfilePopup() {
    if (accountBtn && profileModal) {
        accountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            profileModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closePopup = () => {
            profileModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (closeProfile) {
            closeProfile.addEventListener('click', closePopup);
        }

        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                closePopup();
            }
        });

        // Toggle Login/Signup
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            loggedOutView.style.display = 'none';
            signupView.style.display = 'block';
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            signupView.style.display = 'none';
            loggedOutView.style.display = 'block';
        });
    }
}

// Firebase Auth System
function initAuth() {
    if (typeof firebase === 'undefined') return;

    const auth = firebase.auth();

    // Monitor Auth State
    auth.onAuthStateChanged(user => {
        if (user) {
            // User Logged In
            if(loggedOutView) loggedOutView.style.display = 'none';
            if(signupView) signupView.style.display = 'none';
            if(loggedInView) {
                loggedInView.style.display = 'block';
                document.getElementById('profile-display-name').textContent = user.displayName || 'User';
            }
        } else {
            // User Logged Out
            if(loggedInView) loggedInView.style.display = 'none';
            if(loggedOutView) loggedOutView.style.display = 'block';
            if(signupView) signupView.style.display = 'none';
        }
    });

    // Login Function
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const btn = loginForm.querySelector('button');

        btn.classList.add('btn-loading');
        auth.signInWithEmailAndPassword(email, pass)
            .then(() => {
                showToast('Welcome back!', 'success');
                btn.classList.remove('btn-loading');
            })
            .catch(err => {
                showToast(err.message, 'error');
                btn.classList.remove('btn-loading');
            });
    });

    // Signup Function
    signupForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pass = document.getElementById('signup-password').value;
        const btn = signupForm.querySelector('button');

        btn.classList.add('btn-loading');
        auth.createUserWithEmailAndPassword(email, pass)
            .then(cred => {
                return cred.user.updateProfile({ displayName: name });
            })
            .then(() => {
                showToast('Account created!', 'success');
                btn.classList.remove('btn-loading');
            })
            .catch(err => {
                showToast(err.message, 'error');
                btn.classList.remove('btn-loading');
            });
    });

    // Logout
    logoutBtn?.addEventListener('click', () => {
        auth.signOut().then(() => showToast('Logged out', 'success'));
    });

    // Google Login
    const googleBtn = document.getElementById('google-login-btn');
    googleBtn?.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        googleBtn.classList.add('btn-loading');

        auth.signInWithPopup(provider)
            .then(result => {
                const user = result.user;
                showToast(`Welcome ${user.displayName}!`, 'success');
                googleBtn.classList.remove('btn-loading');

                // Update profile image if exists
                if (user.photoURL) {
                    const avatar = document.querySelector('.profile-avatar-large img');
                    if (avatar) avatar.src = user.photoURL;
                }
            })
            .catch(err => {
                showToast(err.message, 'error');
                googleBtn.classList.remove('btn-loading');
            });
    });

    // Forgot Password
    document.getElementById('forgot-password')?.addEventListener('click', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        if (!email) {
            showToast('Please enter your email first', 'error');
            return;
        }
        auth.sendPasswordResetEmail(email)
            .then(() => showToast('Password reset email sent!', 'success'))
            .catch(err => showToast(err.message, 'error'));
    });

    // My Orders View
    const ordersBtn = document.getElementById('view-orders');
    const ordersModal = document.getElementById('orders-modal');
    const closeOrders = document.getElementById('close-orders');
    const ordersListContainer = document.getElementById('orders-list-container');

    ordersBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        profileModal.classList.remove('active');
        ordersModal.style.display = 'flex';
        fetchOrders();
    });

    closeOrders?.addEventListener('click', () => {
        ordersModal.style.display = 'none';
        document.body.style.overflow = '';
    });

    function fetchOrders() {
        const user = auth.currentUser;
        if (!user) return;

        const db = firebase.firestore();
        ordersListContainer.innerHTML = '<div style="text-align:center; padding:20px;">Loading your orders...</div>';

        db.collection('orders')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    ordersListContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px;">
                            <p style="color: #666;">No orders found yet.</p>
                            <button class="auth-submit-btn" style="margin-top:20px;" onclick="document.getElementById('orders-modal').style.display='none'">Start Shopping</button>
                        </div>
                    `;
                    return;
                }

                let ordersHTML = '';
                querySnapshot.forEach(doc => {
                    const order = doc.data();
                    const date = order.createdAt?.toDate().toLocaleDateString() || 'N/A';
                    ordersHTML += `
                        <div class="order-card" style="border: 1px solid #eee; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span style="font-weight: 600; color: #333;">Order #${doc.id.slice(0,8).toUpperCase()}</span>
                                <span style="color: #666; font-size: 13px;">${date}</span>
                            </div>
                            <div style="color: #4CAF50; font-weight: 600; margin-bottom: 10px;">Rs. ${order.total.toLocaleString()}</div>
                            <div style="font-size: 14px; color: #666;">Status: <span style="color: #ff9f43;">Processing</span></div>
                        </div>
                    `;
                });
                ordersListContainer.innerHTML = ordersHTML;
            })
            .catch(err => {
                console.error(err);
                ordersListContainer.innerHTML = '<p style="color:red; text-align:center;">Failed to load orders.</p>';
            });
    }
}

// Toast Notification
function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('active'), 10);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Slider Functionality
function initSlider() {
    if (!slides.length) return;
    setInterval(() => {
        nextSlide();
    }, 4000);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
}

function goToSlide(index) {
    currentSlide = index;
    updateSlider();
}

function updateSlider() {
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === currentSlide);
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

// Countdown Timer
function initCountdown() {
    if (!hoursElement) return;
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 2);

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    function updateCountdown() {
        const now = new Date();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            secondsElement.textContent = '00';
            return;
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        hoursElement.textContent = hours.toString().padStart(2, '0');
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
}

// Global Cart System
function initCart() {
    const savedCart = localStorage.getItem('mk_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartDisplay();

    // Checkout Button Click
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast('Your cart is empty!', 'error');
            return;
        }

        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('Please login to place an order', 'error');
            if(profileModal) profileModal.classList.add('active');
            closeCartDrawer();
            return;
        }

        // processCheckout(user); // If you have this function
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.product-card .add-to-cart-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();

            const productCard = btn.closest('.product-card');
            if (!productCard) return;

            const name = productCard.querySelector('h3')?.textContent || 'Product';
            const priceText = productCard.querySelector('.current-price')?.textContent || '0';
            const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
            const image = productCard.querySelector('img')?.src || '';

            const product = {
                id: btn.dataset.product,
                name: name,
                price: price,
                image: image,
                qty: 1
            };
            addToCart(product);

            const originalContent = btn.innerHTML;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            btn.style.background = '#4CAF50';
            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.style.background = '';
            }, 1000);
        }
    });
}

function addToCart(product) {
    const existingIndex = cart.findIndex(item => item.id === product.id);
    const quantityToAdd = product.qty || 1;

    if (existingIndex > -1) {
        cart[existingIndex].qty += quantityToAdd;
    } else {
        cart.push(product);
    }
    saveCart();
    updateCartDisplay();
    openCartDrawer();
}

function saveCart() {
    localStorage.setItem('mk_cart', JSON.stringify(cart));
}

function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    renderCartItems();
}

function renderCartItems() {
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <div class="empty-cart-icon">🛒</div>
                <h3>کارٹ خالی ہے</h3>
                <p>آپ نے ابھی تک کوئی پروڈکٹ شامل نہیں کی۔ بہترین ڈیلز کے لیے شاپنگ جاری رکھیں۔</p>
                <button class="continue-shopping" onclick="closeCartDrawer()">شاپنگ جاری رکھیں</button>
            </div>
        `;
        document.getElementById('cart-subtotal').textContent = 'Rs 0';
        document.getElementById('cart-total').textContent = 'Rs 0';
        updateShippingProgress(0);
        return;
    }

    let subtotal = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        subtotal += item.price * item.qty;
        return `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img">
                <div class="cart-item-info">
                    <div>
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">Rs ${item.price.toLocaleString()}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="qty-control">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
                            <span class="qty-val">${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart('${item.id}')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const deliveryCost = subtotal >= 5000 ? 0 : 250;
    const total = subtotal + deliveryCost;

    document.getElementById('cart-subtotal').textContent = `Rs ${subtotal.toLocaleString()}`;
    document.getElementById('delivery-cost').textContent = deliveryCost === 0 ? 'مفت' : `Rs ${deliveryCost}`;
    if (deliveryCost === 0) document.getElementById('delivery-cost').classList.add('free-shipping-text');
    else document.getElementById('delivery-cost').classList.remove('free-shipping-text');

    document.getElementById('cart-total').textContent = `Rs ${total.toLocaleString()}`;
    updateShippingProgress(subtotal);
}

function updateShippingProgress(subtotal) {
    const bar = document.getElementById('shipping-bar');
    const msg = document.getElementById('shipping-msg');
    if (!bar || !msg) return;

    const limit = 5000;
    const percentage = Math.min((subtotal / limit) * 100, 100);
    bar.style.width = `${percentage}%`;

    if (subtotal >= limit) {
        msg.innerHTML = '🎉 مبارک ہو! آپ مفت ڈیلیوری کے اہل ہیں۔';
        msg.style.color = '#27ae60';
    } else {
        const remaining = limit - subtotal;
        msg.innerHTML = `مزید <strong>Rs ${remaining.toLocaleString()}</strong> کی خریداری پر مفت ڈیلیوری پائیں!`;
        msg.style.color = '#d63031';
    }
}

window.updateQty = (id, delta) => {
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
        cart[index].qty += delta;
        if (cart[index].qty < 1) {
            removeFromCart(id);
        } else {
            saveCart();
            updateCartDisplay();
        }
    }
};

window.removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartDisplay();
};

// Cart Drawer UI
function initCartDrawer() {
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer();
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', closeCartDrawer);
    }

    if (cartDrawer) {
        cartDrawer.addEventListener('click', (e) => {
            if (e.target === cartDrawer) closeCartDrawer();
        });
    }
}

function openCartDrawer() {
    if (cartDrawer) {
        cartDrawer.style.display = 'flex';
        setTimeout(() => cartDrawer.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';
    }
}

window.closeCartDrawer = () => {
    if (cartDrawer) {
        cartDrawer.classList.remove('active');
        setTimeout(() => cartDrawer.style.display = 'none', 400);
        document.body.style.overflow = '';
    }
};

// Wishlist Functionality
function initWishlist() {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
        wishlist = new Set(JSON.parse(savedWishlist));
    }

    updateWishlistDisplay();

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.wishlist-btn');
        if (btn) {
            const productId = btn.dataset.product;
            toggleWishlist(productId);
        }
    });
}

function toggleWishlist(productId) {
    if (wishlist.has(productId)) {
        wishlist.delete(productId);
    } else {
        wishlist.add(productId);
    }

    localStorage.setItem('wishlist', JSON.stringify([...wishlist]));
    updateWishlistDisplay();
}

function updateWishlistDisplay() {
    wishlistButtons.forEach(button => {
        const productId = button.dataset.product;
        const isWishlisted = wishlist.has(productId);
        button.classList.toggle('active', isWishlisted);
    });
}

// Navigation
function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const page = item.dataset.page;
            if (page === 'home' || page === 'categories') {
                e.preventDefault();
                navItems.forEach(navItem => navItem.classList.remove('active'));
                item.classList.add('active');
                if (page === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
                else {
                    const target = document.querySelector('.categories');
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }
        }, { passive: false });
    });
}

// Lazy Loading
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.setAttribute('loaded', '');
                observer.unobserve(img);
            }
        });
    });
    images.forEach(img => imageObserver.observe(img));
}

// Optimized Global Search System
function initGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('search-results');
    const clearBtn = document.getElementById('clear-search');

    if (!searchInput || !searchResults) return;

    // Input Event
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query.length > 0) {
            clearBtn.style.display = 'flex';
            performSearch(query);
        } else {
            clearBtn.style.display = 'none';
            searchResults.classList.remove('active');
        }
    }, 200));

    // Clear Button
    clearBtn?.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        searchResults.classList.remove('active');
        searchInput.focus();
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    // Handle Search Logic
    function performSearch(query) {
        const filtered = productsData.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.category && p.category.toLowerCase().includes(query))
        ).slice(0, 6); // Limit results for better UI

        if (filtered.length > 0) {
            renderSearchResults(filtered);
        } else {
            renderNoResults();
        }
    }

    function renderSearchResults(results) {
        searchResults.innerHTML = results.map(p => `
            <div class="search-result-item" onclick="location.href='product-detail.html?id=${p.id}'">
                <img src="${p.image}" class="search-result-img" alt="${p.name}">
                <div class="search-result-info">
                    <div class="search-result-name">${p.name}</div>
                    <div class="search-result-price">Rs ${p.price.toLocaleString()}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
        `).join('');
        searchResults.classList.add('active');
    }

    function renderNoResults() {
        searchResults.innerHTML = `
            <div class="no-results">
                <p>کوئی پروڈکٹ نہیں ملی "<strong>${searchInput.value}</strong>"</p>
            </div>
        `;
        searchResults.classList.add('active');
    }

    // Keyboard Navigation
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            // Optional: Redirect to a search page or just hide dropdown
            searchResults.classList.remove('active');
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
