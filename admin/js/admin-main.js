document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Sidebar Toggle
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('active');
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

    // API Helper
    window.api = {
        async list(type) {
            try {
                const res = await fetch(`api.php?action=list&type=${type}`);
                if(!res.ok) throw new Error('Network error');
                return await res.json();
            } catch(e) { return []; }
        },
        async save(type, data) {
            try {
                const res = await fetch(`api.php?action=save&type=${type}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                return await res.json();
            } catch(e) { return {status: 'error', message: e.message}; }
        },
        async delete(type, id) {
            try {
                const res = await fetch(`api.php?action=delete&type=${type}&id=${id}`);
                return await res.json();
            } catch(e) { return {status: 'error'}; }
        }
    };

    // Optimization
    window.optimizeImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scale = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {type: 'image/webp'}));
                    }, 'image/webp', 0.7);
                };
            };
        });
    };

    // Real Upload for Hostinger
    window.uploadFile = async (file, folder = 'products') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            return result.status === 'success' ? result.url : null;
        } catch (error) {
            console.error('Upload Error:', error);
            return null;
        }
    };
});
