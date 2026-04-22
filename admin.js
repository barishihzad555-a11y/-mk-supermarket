document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.admin-nav li');
    const sections = document.querySelectorAll('.content-section');
    const imageInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const addProductModal = document.getElementById('add-product-modal');
    const closeModal = document.querySelector('.close-modal');
    const productForm = document.getElementById('product-form');
    const modalTitle = addProductModal ? addProductModal.querySelector('h2') : null;
    let currentEditId = null;

    // --- Navigation Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === target) section.classList.add('active');
            });
        });
    });

    // --- Product Management ---
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    previewContainer.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    if (addProductBtn) {
        addProductBtn.onclick = () => {
            currentEditId = null;
            if (modalTitle) modalTitle.innerText = 'Add New Product';
            productForm.reset();
            imageInput.required = true;
            previewContainer.style.display = 'none';
            addProductModal.style.display = 'flex';
        };
    }

    if (closeModal) closeModal.onclick = () => addProductModal.style.display = 'none';

    loadProducts();

    if (productForm) {
        productForm.onsubmit = async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('save-product-btn');
            const originalText = saveBtn.innerText;
            saveBtn.innerText = 'Saving...';
            saveBtn.disabled = true;

            const formData = new FormData();
            if (currentEditId) formData.append('id', currentEditId);
            formData.append('name', document.getElementById('p-name').value);
            formData.append('price', document.getElementById('p-price').value);
            formData.append('stock', document.getElementById('p-stock').value);
            formData.append('category', document.getElementById('product-category').value);

            const fileInput = document.getElementById('product-image');
            if (fileInput.files[0]) {
                formData.append('product_image', fileInput.files[0]);
            }

            if (currentEditId) {
                formData.append('action', 'update');
            }

            try {
                const response = await fetch('upload.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.status === 'success') {
                    // Update local storage for immediate UI feedback if needed,
                    // though loadProducts() will now fetch from server
                    alert(result.message);
                    addProductModal.style.display = 'none';
                    loadProducts();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Upload failed:', error);
                alert('Failed to save product to server.');
            } finally {
                saveBtn.innerText = originalText;
                saveBtn.disabled = false;
            }
        };
    }

    async function loadProducts() {
        const grid = document.querySelector('.product-grid-admin');
        if (!grid) return;

        try {
            const response = await fetch('upload.php');
            const products = await response.json();

            grid.innerHTML = products.length ? '' : '<p style="grid-column: 1/-1; text-align: center;">No products found.</p>';

            products.forEach(p => {
                const item = document.createElement('div');
                item.className = 'product-item-admin';
                item.innerHTML = `
                    <img src="${p.image}" alt="${p.name}">
                    <div class="product-details">
                        <h4>${p.name}</h4>
                        <p>Rs ${p.price} • ${p.stock} in stock</p>
                    </div>
                    <div class="product-actions">
                        <button class="btn-icon" onclick="editProduct('${p.id}')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button class="btn-icon delete" onclick="deleteProduct('${p.id}')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                `;
                grid.prepend(item);
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    window.editProduct = async (id) => {
        try {
            const response = await fetch('upload.php');
            const products = await response.json();
            const p = products.find(x => x.id === id);
            if (!p) return;
            currentEditId = id;
            document.getElementById('p-name').value = p.name;
            document.getElementById('p-price').value = p.price;
            document.getElementById('p-stock').value = p.stock;
            document.getElementById('product-category').value = p.category;
            imagePreview.src = p.image;
            previewContainer.style.display = 'block';
            imageInput.required = false;
            addProductModal.style.display = 'flex';
        } catch (error) {
            console.error('Error fetching product for edit:', error);
        }
    };

    window.deleteProduct = async (id) => {
        if (!confirm('Are you sure?')) return;

        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);

        try {
            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.status === 'success') {
                loadProducts();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    // --- World-Class Banner System Logic ---
    let cropper = null;
    let banners = JSON.parse(localStorage.getItem('site_banners') || '[]');
    let bannerSettings = JSON.parse(localStorage.getItem('banner_settings') || '{"effect":"fade","speed":5,"showDots":true}');

    const bannerModal = document.getElementById('banner-modal');
    const openBannerBtn = document.getElementById('open-banner-modal');
    const closeBannerBtn = document.getElementById('close-banner-modal');
    const bannerInput = document.getElementById('banner-upload-input');
    const bannerDropZone = document.getElementById('banner-drop-zone');
    const cropperImage = document.getElementById('cropper-image');
    const saveCroppedBtn = document.getElementById('save-cropped-banner');
    const stepUpload = document.getElementById('banner-step-upload');
    const stepCrop = document.getElementById('banner-step-crop');
    const activeBannersContainer = document.getElementById('active-banners-container');

    // Trigger file input when clicking the drop zone
    if (bannerDropZone) {
        bannerDropZone.onclick = () => bannerInput.click();
    }

    // Initialize Settings UI
    document.getElementById('slide-effect').value = bannerSettings.effect;
    document.getElementById('slide-speed').value = bannerSettings.speed;
    document.getElementById('show-dots').checked = bannerSettings.showDots;

    function updateBannerCount() {
        document.getElementById('banner-count').innerText = banners.length;
    }

    function renderBanners() {
        if (!activeBannersContainer) return;
        updateBannerCount();

        if (banners.length === 0) {
            activeBannersContainer.innerHTML = `
                <div class="empty-banners">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    <p>No banners uploaded yet</p>
                </div>`;
            updatePreviewSlider();
            return;
        }

        activeBannersContainer.innerHTML = '';
        banners.forEach((banner, index) => {
            const card = document.createElement('div');
            card.className = 'banner-item-card';
            card.innerHTML = `
                <img src="${banner.image}" class="banner-thumb">
                <div class="banner-info">
                    <h4>Banner #${index + 1}</h4>
                    <span class="banner-status">● Live Now</span>
                </div>
                <div class="banner-item-actions">
                    <button class="btn-icon delete" onclick="deleteBanner(${index})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            activeBannersContainer.appendChild(card);
        });
        updatePreviewSlider();
    }

    window.deleteBanner = (index) => {
        if (!confirm('Delete this banner?')) return;
        banners.splice(index, 1);
        localStorage.setItem('site_banners', JSON.stringify(banners));
        renderBanners();
    };

    // Slider Preview Logic
    let previewInterval;
    function updatePreviewSlider() {
        const sliderContainer = document.getElementById('preview-slider');
        const dotsContainer = document.getElementById('preview-dots');
        if (!sliderContainer) return;

        clearInterval(previewInterval);
        sliderContainer.innerHTML = '';
        dotsContainer.innerHTML = '';

        if (banners.length === 0) {
            sliderContainer.innerHTML = '<div class="preview-slide active"><img src="https://placehold.co/1200x450?text=No+Banners"></div>';
            return;
        }

        banners.forEach((banner, i) => {
            const slide = document.createElement('div');
            slide.className = `preview-slide ${i === 0 ? 'active' : ''}`;
            slide.innerHTML = `<img src="${banner.image}">`;
            sliderContainer.appendChild(slide);

            const dot = document.createElement('span');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dotsContainer.appendChild(dot);
        });

        if (banners.length > 1) {
            let current = 0;
            previewInterval = setInterval(() => {
                const slides = sliderContainer.querySelectorAll('.preview-slide');
                const dots = dotsContainer.querySelectorAll('.dot');
                slides[current].classList.remove('active');
                dots[current].classList.remove('active');

                current = (current + 1) % banners.length;

                slides[current].classList.add('active');
                dots[current].classList.add('active');
            }, bannerSettings.speed * 1000);
        }
    }

    // Modal & Cropper Logic
    if (openBannerBtn) {
        openBannerBtn.onclick = () => {
            stepUpload.style.display = 'block';
            stepCrop.style.display = 'none';
            bannerModal.style.display = 'flex';
        };
    }

    if (closeBannerBtn) {
        closeBannerBtn.onclick = () => {
            bannerModal.style.display = 'none';
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        };
    }

    if (bannerInput) {
        bannerInput.onchange = function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    cropperImage.src = e.target.result;
                    stepUpload.style.display = 'none';
                    stepCrop.style.display = 'block';

                    if (cropper) cropper.destroy();

                    // Professional 8:3 Aspect Ratio for Web Banners
                    cropper = new Cropper(cropperImage, {
                        aspectRatio: 8 / 3,
                        viewMode: 2,
                        dragMode: 'move',
                        autoCropArea: 1,
                        responsive: true,
                        restore: false,
                        guides: true,
                        center: true,
                        highlight: false,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: false,
                    });
                };
                reader.readAsDataURL(file);
            }
        };
    }

    document.getElementById('crop-rotate-left').onclick = () => cropper.rotate(-90);
    document.getElementById('crop-rotate-right').onclick = () => cropper.rotate(90);
    document.getElementById('back-to-upload').onclick = () => {
        stepCrop.style.display = 'none';
        stepUpload.style.display = 'block';
    };

    saveCroppedBtn.onclick = () => {
        const canvas = cropper.getCroppedCanvas({
            width: 1200,
            height: 450,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        const croppedData = canvas.toDataURL('image/webp', 0.8);
        banners.push({ image: croppedData, id: Date.now() });
        localStorage.setItem('site_banners', JSON.stringify(banners));

        bannerModal.style.display = 'none';
        cropper.destroy();
        cropper = null;
        renderBanners();
        alert('World-Class Banner Added Successfully!');
    };

    document.getElementById('save-banner-settings').onclick = () => {
        bannerSettings = {
            effect: document.getElementById('slide-effect').value,
            speed: parseInt(document.getElementById('slide-speed').value),
            showDots: document.getElementById('show-dots').checked
        };
        localStorage.setItem('banner_settings', JSON.stringify(bannerSettings));
        updatePreviewSlider();
        alert('Global Banner Settings Saved!');
    };

    // --- Settings Tabs Logic ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetContent = document.getElementById(`tab-${target}`);
            if (targetContent) {
                targetContent.classList.add('active');
                // Ensure content area scrolls to top on tab change for mobile
                document.querySelector('.settings-content-area').scrollTop = 0;
            }
        });
    });

    // --- Global Settings Logic ---
    const settingsForm = document.getElementById('global-settings-form');
    const logoUpload = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const primaryColorInput = document.getElementById('primary-color');
    const colorHexDisplay = document.getElementById('color-hex');

    // Load Saved Settings
    let globalSettings = JSON.parse(localStorage.getItem('site_settings') || '{}');
    if (Object.keys(globalSettings).length > 0) {
        // General
        if (document.getElementById('site-name')) document.getElementById('site-name').value = globalSettings.name || 'MK Supermarket';
        if (document.getElementById('site-tagline')) document.getElementById('site-tagline').value = globalSettings.tagline || '';
        if (document.getElementById('store-whatsapp')) document.getElementById('store-whatsapp').value = globalSettings.whatsapp || '';
        if (document.getElementById('store-email')) document.getElementById('store-email').value = globalSettings.email || '';
        if (document.getElementById('store-address')) document.getElementById('store-address').value = globalSettings.address || '';

        // Branding
        if (document.getElementById('primary-color')) {
            document.getElementById('primary-color').value = globalSettings.themeColor || '#2563eb';
            document.getElementById('color-hex').innerText = (globalSettings.themeColor || '#2563eb').toUpperCase();
        }
        if (document.getElementById('site-font')) document.getElementById('site-font').value = globalSettings.font || "'Plus Jakarta Sans', sans-serif";
        if (document.getElementById('btn-radius')) {
            document.getElementById('btn-radius').value = globalSettings.borderRadius || 8;
            document.getElementById('radius-val').innerText = (globalSettings.borderRadius || 8) + 'px';
        }
        if (globalSettings.logo) logoPreview.src = globalSettings.logo;
        if (globalSettings.favicon && document.getElementById('favicon-preview')) {
            document.getElementById('favicon-preview').src = globalSettings.favicon;
        }

        // Commerce
        if (document.getElementById('site-currency')) document.getElementById('site-currency').value = globalSettings.currency || 'Rs';
        if (document.getElementById('site-currency-code')) document.getElementById('site-currency-code').value = globalSettings.currencyCode || 'PKR';
        if (document.getElementById('min-order')) document.getElementById('min-order').value = globalSettings.minOrder || 0;
        if (document.getElementById('delivery-charge')) document.getElementById('delivery-charge').value = globalSettings.deliveryCharge || 0;
        if (document.getElementById('free-delivery-min')) document.getElementById('free-delivery-min').value = globalSettings.freeDeliveryMin || 0;

        // Social
        if (document.getElementById('social-fb')) document.getElementById('social-fb').value = globalSettings.socialFb || '';
        if (document.getElementById('social-ig')) document.getElementById('social-ig').value = globalSettings.socialIg || '';
        if (document.getElementById('social-yt')) document.getElementById('social-yt').value = globalSettings.socialYt || '';
        if (document.getElementById('social-tiktok')) document.getElementById('social-tiktok').value = globalSettings.socialTiktok || '';

        // Advanced
        if (document.getElementById('maintenance-mode')) document.getElementById('maintenance-mode').checked = globalSettings.maintenance || false;
        if (document.getElementById('show-stock-count')) document.getElementById('show-stock-count').checked = globalSettings.showStock !== false;
    }

    // Color Picker Sync
    if (primaryColorInput) {
        primaryColorInput.oninput = (e) => {
            colorHexDisplay.innerText = e.target.value.toUpperCase();
            document.documentElement.style.setProperty('--primary', e.target.value);
        };
    }

    // Border Radius Sync
    const radiusInput = document.getElementById('btn-radius');
    if (radiusInput) {
        radiusInput.oninput = (e) => {
            document.getElementById('radius-val').innerText = e.target.value + 'px';
        };
    }

    // Logo Upload Preview
    if (logoUpload) {
        logoUpload.onchange = function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    logoPreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        };
    }

    // Favicon Upload Preview
    const favUpload = document.getElementById('fav-upload');
    const favPreview = document.getElementById('favicon-preview');
    if (favUpload) {
        favUpload.onchange = function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    favPreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        };
    }

    // Save All Settings
    if (settingsForm) {
        settingsForm.onsubmit = (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('save-all-settings');
            const originalText = saveBtn.innerText;
            saveBtn.innerText = 'Saving Changes...';
            saveBtn.disabled = true;

            const newSettings = {
                // General
                name: document.getElementById('site-name').value,
                tagline: document.getElementById('site-tagline').value,
                whatsapp: document.getElementById('store-whatsapp').value,
                email: document.getElementById('store-email').value,
                address: document.getElementById('store-address').value,

                // Branding
                themeColor: document.getElementById('primary-color').value,
                font: document.getElementById('site-font').value,
                borderRadius: document.getElementById('btn-radius').value,
                logo: logoPreview.src,
                favicon: favPreview ? favPreview.src : null,

                // Commerce
                currency: document.getElementById('site-currency').value,
                currencyCode: document.getElementById('site-currency-code').value,
                minOrder: document.getElementById('min-order').value,
                deliveryCharge: document.getElementById('delivery-charge').value,
                freeDeliveryMin: document.getElementById('free-delivery-min').value,

                // Social
                socialFb: document.getElementById('social-fb').value,
                socialIg: document.getElementById('social-ig').value,
                socialYt: document.getElementById('social-yt').value,
                socialTiktok: document.getElementById('social-tiktok').value,

                // Advanced
                maintenance: document.getElementById('maintenance-mode').checked,
                showStock: document.getElementById('show-stock-count').checked,

                lastUpdated: Date.now()
            };

            // Handle Password Change (Security)
            const pass = document.getElementById('admin-pass').value;
            const confirmPass = document.getElementById('admin-pass-confirm').value;
            if (pass) {
                if (pass !== confirmPass) {
                    alert('Passwords do not match!');
                    saveBtn.innerText = originalText;
                    saveBtn.disabled = false;
                    return;
                }
                localStorage.setItem('admin_password', pass);
                document.getElementById('admin-pass').value = '';
                document.getElementById('admin-pass-confirm').value = '';
            }

            localStorage.setItem('site_settings', JSON.stringify(newSettings));

            setTimeout(() => {
                saveBtn.innerText = originalText;
                saveBtn.disabled = false;
                alert('All settings saved successfully and synced with website!');

                // Apply dynamic styles to Admin Panel
                document.documentElement.style.setProperty('--primary', newSettings.themeColor);
                document.body.style.fontFamily = newSettings.font;
            }, 800);
        };
    }

    // Danger Zone: Reset Site
    const resetBtn = document.getElementById('reset-site');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm('DANGER: This will delete ALL products, banners, and settings. This cannot be undone! Are you sure?')) {
                if (confirm('PLEASE CONFIRM AGAIN: Delete everything?')) {
                    localStorage.clear();
                    alert('All data has been cleared. The page will now reload.');
                    window.location.reload();
                }
            }
        };
    }

    // --- Data Safety & Backup System ---
    const backupBtn = document.getElementById('backup-data');
    const restoreInput = document.getElementById('restore-upload');

    if (backupBtn) {
        backupBtn.onclick = () => {
            const data = {
                products: JSON.parse(localStorage.getItem('temp_products') || '[]'),
                banners: JSON.parse(localStorage.getItem('site_banners') || '[]'),
                settings: JSON.parse(localStorage.getItem('site_settings') || '{}'),
                banner_settings: JSON.parse(localStorage.getItem('banner_settings') || '{}'),
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mk_supermarket_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
    }

    if (restoreInput) {
        restoreInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (confirm('Warning: This will overwrite all current data. Proceed with restoration?')) {
                        if (data.products) localStorage.setItem('temp_products', JSON.stringify(data.products));
                        if (data.banners) localStorage.setItem('site_banners', JSON.stringify(data.banners));
                        if (data.settings) localStorage.setItem('site_settings', JSON.stringify(data.settings));
                        if (data.banner_settings) localStorage.setItem('banner_settings', JSON.stringify(data.banner_settings));
                        alert('Data restored successfully! The page will now reload.');
                        window.location.reload();
                    }
                } catch (err) {
                    alert('Invalid backup file!');
                }
            };
            reader.readAsText(file);
        };
    }

    // --- Error Handling & Safety ---
    window.addEventListener('error', (e) => {
        console.error('System Error Captured:', e.message);
        // You could send this to a logging service in a real app
    });

    // --- Session & Security Logic ---
    const sessionList = document.getElementById('session-list');
    const currentSession = JSON.parse(localStorage.getItem('current_admin_session') || '{}');
    const adminDisplayName = document.getElementById('admin-display-name');
    const logoutBtn = document.getElementById('logout-btn');

    if (adminDisplayName) adminDisplayName.innerText = currentSession.name || 'Admin';
    const adminAvatar = document.querySelector('.admin-header .avatar');
    if (adminAvatar && currentSession.photo) adminAvatar.src = currentSession.photo;

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('current_admin_session');
            window.location.href = 'login.html';
        };
    }

    function loadSessions() {
        if (!sessionList) return;
        const sessions = JSON.parse(localStorage.getItem('active_sessions') || '[]');
        sessionList.innerHTML = sessions.length ? '' : '<div style="padding: 20px; text-align: center; color: var(--text-gray);">No login history found.</div>';

        sessions.forEach(s => {
            const item = document.createElement('div');
            item.className = 'order-item';
            item.style.padding = '10px 15px';
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <img src="${s.photo || 'https://placehold.co/100x100?text=Staff'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;">
                    <div>
                        <div style="font-weight: 700; color: var(--text-dark); font-size: 0.9rem;">${s.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-gray);">${s.mobile}</div>
                    </div>
                </div>
                <div style="flex: 1; text-align: center;">
                    <span class="order-status completed" style="background: #e0f2fe; color: #0369a1; font-size: 0.7rem; padding: 2px 6px;">📍 ${s.location}</span>
                </div>
                <div style="flex: 1; text-align: right;">
                    <div style="font-size: 0.8rem; color: var(--text-dark); font-weight: 600;">${s.time}</div>
                    <div style="font-size: 0.65rem; color: var(--text-gray);">${s.date || ''}</div>
                </div>
            `;
            sessionList.appendChild(item);
        });
    }

    const clearSessionsBtn = document.getElementById('clear-sessions');
    if (clearSessionsBtn) {
        clearSessionsBtn.onclick = () => {
            if (confirm('Clear all login history?')) {
                localStorage.setItem('active_sessions', '[]');
                loadSessions();
            }
        };
    }

    loadSessions();

    // Initial Load Theme
    if (globalSettings.themeColor) {
        document.documentElement.style.setProperty('--primary', globalSettings.themeColor);
    }
});
