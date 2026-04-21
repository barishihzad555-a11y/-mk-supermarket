document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navItems = document.querySelectorAll('.admin-nav li');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === target) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Load existing products on start
    loadProducts();

    // Image Preview Logic
    const imageInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');

    if (imageInput) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    previewContainer.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Modal Logic
    const addProductBtn = document.getElementById('add-product-btn');
    const addProductModal = document.getElementById('add-product-modal');
    const closeModal = document.querySelector('.close-modal');
    const productForm = document.getElementById('product-form');

    if (addProductBtn) addProductBtn.addEventListener('click', () => addProductModal.style.display = 'flex');
    if (closeModal) closeModal.addEventListener('click', () => addProductModal.style.display = 'none');

    // Handle Form Submission
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const saveBtn = document.getElementById('save-product-btn');
            const originalText = saveBtn.innerText;
            saveBtn.innerText = 'Processing...';
            saveBtn.disabled = true;

            const formData = new FormData();
            const fileInput = document.getElementById('product-image');
            const nameInput = document.getElementById('p-name');
            const priceInput = document.getElementById('p-price');
            const stockInput = document.getElementById('p-stock');
            const categoryInput = document.getElementById('product-category');

            formData.append('product_image', fileInput.files[0]);
            formData.append('name', nameInput.value);
            formData.append('price', priceInput.value);
            formData.append('stock', stockInput.value);
            formData.append('category', categoryInput.value);

            try {
                const response = await fetch('upload.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.status === 'success') {
                    addProductToUI(result.product);
                    alert('Product saved successfully!');
                    addProductModal.style.display = 'none';
                    productForm.reset();
                    previewContainer.style.display = 'none';
                } else {
                    alert('Upload failed: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            } finally {
                saveBtn.innerText = originalText;
                saveBtn.disabled = false;
            }
        });
    }

    // Search Logic
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.product-item-admin');
            items.forEach(item => {
                const name = item.querySelector('h4').innerText.toLowerCase();
                item.style.display = name.includes(term) ? 'flex' : 'none';
            });
        });
    }

    async function loadProducts() {
        try {
            const response = await fetch('upload.php');
            const products = await response.json();
            const grid = document.querySelector('.product-grid-admin');
            if (grid) {
                grid.innerHTML = ''; // Clear existing
                products.forEach(product => addProductToUI(product));
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    function addProductToUI(product) {
        const grid = document.querySelector('.product-grid-admin');
        if (!grid) return;

        const item = document.createElement('div');
        item.className = 'product-item-admin';
        item.setAttribute('data-id', product.id);
        item.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-details">
                <h4>${product.name}</h4>
                <p>Rs ${product.price} • ${product.stock} in stock</p>
                <small style="color: #64748b;">Category: ${product.category || 'N/A'}</small>
            </div>
            <div class="product-actions">
                <button class="btn-icon" onclick="editProduct('${product.id}')" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon delete" onclick="deleteProduct('${product.id}', this)" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        `;
        grid.prepend(item);
    }

    // Global actions
    window.editProduct = function(id) {
        // Find product in UI and fill form or show alert for now
        alert('Product Edit feature is active for ID: ' + id);
    };

    window.deleteProduct = async function(id, btn) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

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
                const item = btn.closest('.product-item-admin');
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9)';
                item.style.transition = 'all 0.3s ease';
                setTimeout(() => item.remove(), 300);
            } else {
                alert('Delete failed: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('An error occurred during deletion.');
        }
    };
});
