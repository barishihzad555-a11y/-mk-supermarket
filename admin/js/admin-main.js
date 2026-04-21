document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Sidebar Toggle
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            // Add overlay if it doesn't exist
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                document.body.appendChild(overlay);
            }
            overlay.classList.toggle('active');

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        });
    }

    // Theme Toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            body.setAttribute('data-theme', newTheme);
            themeToggle.innerHTML = newTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            localStorage.setItem('admin-theme', newTheme);
        });
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        if (themeToggle) {
            themeToggle.innerHTML = savedTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }
    }

    // Real Image Upload Logic for Hostinger
    window.uploadFile = async (file, type = 'general') => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);

        try {
            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.status === 'success') {
                return result.url; // Returns the live URL from Hostinger
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Image upload failed: ' + error.message);
            return null;
        }
    };

    // Data API Logic
    window.api = {
        async list(type) {
            const res = await fetch(`api.php?action=list&type=${type}`);
            return await res.json();
        },
        async save(type, data) {
            const res = await fetch(`api.php?action=save&type=${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        async delete(type, id) {
            const res = await fetch(`api.php?action=delete&type=${type}&id=${id}`);
            return await res.json();
        }
    };

    // Keep the optimization logic if needed, but return the file object for upload
    window.optimizeImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200; // Increased for better quality
                    const scale = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * (img.width > MAX_WIDTH ? scale : 1);
                    if (img.width <= MAX_WIDTH) {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob((blob) => {
                        const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                            type: 'image/webp'
                        });
                        resolve(optimizedFile);
                    }, 'image/webp', 0.8);
                };
            };
        });
    };
});
