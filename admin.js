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
            saveBtn.innerText = 'Saving...';

            const formData = new FormData();
            formData.append('name', document.getElementById('p-name').value);
            formData.append('price', document.getElementById('p-price').value);
            formData.append('stock', document.getElementById('p-stock').value);
            formData.append('category', document.getElementById('product-category').value);

            if (imageInput.files[0]) {
                formData.append('product_image', imageInput.files[0]);
            }

            if (currentEditId) {
                formData.append('action', 'update_product');
                formData.append('id', currentEditId);
            } else {
                formData.append('action', 'upload_product');
            }

            try {
                const response = await fetch('upload.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (result.status === 'success') {
                    saveBtn.innerText = 'Save Product';
                    addProductModal.style.display = 'none';
                    loadProducts();
                }
            } catch (error) {
                console.error('Error saving product:', error);
                alert('Error saving product');
                saveBtn.innerText = 'Save Product';
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
    };

    window.deleteProduct = async (id) => {
        if (!confirm('Are you sure?')) return;
        const formData = new FormData();
        formData.append('action', 'delete_product');
        formData.append('id', id);

        await fetch('upload.php', {
            method: 'POST',
            body: formData
        });
        loadProducts();
    };

    // --- Banner System Logic ---
    let cropper = null;
    let banners = [];
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

    if (bannerDropZone) bannerDropZone.onclick = () => bannerInput.click();

    // Initialize Settings UI
    if (document.getElementById('slide-effect')) document.getElementById('slide-effect').value = bannerSettings.effect;
    if (document.getElementById('slide-speed')) document.getElementById('slide-speed').value = bannerSettings.speed;
    if (document.getElementById('show-dots')) document.getElementById('show-dots').checked = bannerSettings.showDots;

    async function loadBanners() {
        try {
            const response = await fetch('upload.php?action=get_banners');
            banners = await response.json();
            renderBanners();
        } catch (error) {
            console.error('Error loading banners:', error);
        }
    }

    function renderBanners() {
        if (!activeBannersContainer) return;
        document.getElementById('banner-count').innerText = banners.length;

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
        banners.forEach((banner) => {
            const card = document.createElement('div');
            card.className = 'banner-item-card';
            card.innerHTML = `
                <img src="${banner.image}" class="banner-thumb">
                <div class="banner-info">
                    <h4>Banner</h4>
                    <span class="banner-status">● Live Now</span>
                </div>
                <div class="banner-item-actions">
                    <button class="btn-icon delete" onclick="deleteBanner('${banner.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            activeBannersContainer.appendChild(card);
        });
        updatePreviewSlider();
    }

    window.deleteBanner = async (id) => {
        if (!confirm('Delete this banner?')) return;
        const formData = new FormData();
        formData.append('action', 'delete_banner');
        formData.append('id', id);
        await fetch('upload.php', { method: 'POST', body: formData });
        loadBanners();
    };

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
                if (slides[current]) slides[current].classList.remove('active');
                if (dots[current]) dots[current].classList.remove('active');
                current = (current + 1) % banners.length;
                if (slides[current]) slides[current].classList.add('active');
                if (dots[current]) dots[current].classList.add('active');
            }, bannerSettings.speed * 1000);
        }
    }

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
            if (cropper) { cropper.destroy(); cropper = null; }
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
                    cropper = new Cropper(cropperImage, { aspectRatio: 8 / 3, viewMode: 2 });
                };
                reader.readAsDataURL(file);
            }
        };
    }

    saveCroppedBtn.onclick = async () => {
        const canvas = cropper.getCroppedCanvas({ width: 1200, height: 450 });
        const croppedData = canvas.toDataURL('image/webp', 0.8);

        const formData = new FormData();
        formData.append('action', 'upload_banner');
        formData.append('image', croppedData);

        const response = await fetch('upload.php', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.status === 'success') {
            bannerModal.style.display = 'none';
            cropper.destroy();
            cropper = null;
            loadBanners();
            alert('Banner Added Successfully!');
        }
    };

    loadBanners();

    // Initial Load Theme
    let globalSettings = JSON.parse(localStorage.getItem('site_settings') || '{}');
    if (globalSettings.themeColor) {
        document.documentElement.style.setProperty('--primary', globalSettings.themeColor);
    }
});
