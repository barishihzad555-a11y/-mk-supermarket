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

    // Modal Logic
    const addProductBtn = document.getElementById('add-product-btn');
    const addProductModal = document.getElementById('add-product-modal');
    const closeModal = document.querySelector('.close-modal');
    const productForm = document.getElementById('product-form');

    addProductBtn.addEventListener('click', () => addProductModal.style.display = 'flex');
    closeModal.addEventListener('click', () => addProductModal.style.display = 'none');

    // Handle Form Submission with Image Upload
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const saveBtn = document.getElementById('save-product-btn');
        const originalText = saveBtn.innerText;
        saveBtn.innerText = 'Uploading...';
        saveBtn.disabled = true;

        const formData = new FormData();
        const fileInput = document.getElementById('product-image');
        const nameInput = document.querySelector('input[placeholder="e.g. Fresh Milk"]');
        const priceInput = document.querySelector('input[placeholder="0.00"]');
        const stockInput = document.querySelector('input[placeholder="0"]');
        const categoryInput = document.getElementById('product-category');

        formData.append('product_image', fileInput.files[0]);
        formData.append('name', nameInput.value);
        formData.append('price', priceInput.value);
        formData.append('stock', stockInput.value);
        formData.append('category', categoryInput.value);

        try {
            // 1. Upload Image and Data to Hostinger via PHP
            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.status === 'success') {
                // Add to UI
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
            alert('An error occurred during upload.');
        } finally {
            saveBtn.innerText = originalText;
            saveBtn.disabled = false;
        }
    });

    async function loadProducts() {
        try {
            const response = await fetch('upload.php');
            const products = await response.json();
            const grid = document.querySelector('.product-grid-admin');

            // Keep the hardcoded one if you want, or clear first:
            // grid.innerHTML = '';

            products.forEach(product => {
                addProductToUI(product);
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    function addProductToUI(product) {
        const grid = document.querySelector('.product-grid-admin');
        const item = document.createElement('div');
        item.className = 'product-item-admin';
        item.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-details">
                <h4>${product.name}</h4>
                <p>Rs ${product.price} • ${product.stock} in stock</p>
            </div>
            <div class="product-actions">
                <button class="btn-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="btn-icon delete"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
        `;
        grid.prepend(item);
    }
});
