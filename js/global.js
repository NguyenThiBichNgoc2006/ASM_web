document.addEventListener("DOMContentLoaded", function () {
    
    updateGlobalCartBadge();

    
    renderAuthHeader();
});

function updateGlobalCartBadge() {
    const cartBadge = document.getElementById("globalCartBadge") || document.querySelector(".cart-badge");
    if (!cartBadge) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let totalItems = 0;
    cart.forEach(item => {
        totalItems += Number(item.quantity || 0);
    });
    cartBadge.textContent = totalItems;
}

function renderAuthHeader() {
    const authArea = document.getElementById("globalAuthArea");
    if (!authArea) return;

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (currentUser) {
        const avatarSrc = currentUser.avatar || "/assets/images/avatar.jpg";
        const isAdmin = currentUser.role === 'admin';

        
        const adminMenuHTML = isAdmin ? `
                    <li>
                        <a class="dropdown-menu-item text-warning d-block px-3 py-2 text-decoration-none fw-bold" href="admin.html">
                            <i class="fa-solid fa-shield-halved me-2"></i>Trang Quản Trị
                        </a>
                    </li>
                    <li><hr class="dropdown-divider border-secondary"></li>` : '';

        // Nếu đã đăng nhập, thay đổi code HTML vùng xác thực trên Header
        authArea.innerHTML = `
            <div class="dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="${avatarSrc}" alt="Avatar" class="rounded-circle" style="width: 30px; height: 30px; object-fit: cover; border: 2px solid var(--primary-red);">
                    <span class="text-white">${currentUser.name || 'Thành viên'}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end bg-pizzan-dark border-secondary" aria-labelledby="userDropdown" style="min-width:0;width:auto;white-space:nowrap;">
                    ${adminMenuHTML}
                    <li>
                        <a class="dropdown-menu-item text-white d-block px-3 py-2 text-decoration-none" href="profile.html">
                            <i class="fa-regular fa-user me-2"></i>Hồ Sơ Cá Nhân
                        </a>
                    </li>
                    <li><hr class="dropdown-divider border-secondary"></li>
                    <li>
                        <a class="dropdown-menu-item text-danger d-block px-3 py-2 text-decoration-none" href="#" id="btnLogoutAction">
                            <i class="fa-solid fa-arrow-right-from-bracket me-2"></i>Đăng Xuất
                        </a>
                    </li>
                </ul>
            </div>
        `;

        // Gắn sự kiện Đăng xuất
        document.getElementById("btnLogoutAction").addEventListener("click", function(e) {
            e.preventDefault();
            localStorage.removeItem("currentUser");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("authToken");
            showGlobalMessage("Bạn đã đăng xuất tài khoản.", "success");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 800);
        });
    }
}

function createGlobalMessageContainer() {
    if (document.getElementById('globalMessageBox')) return;

    const container = document.createElement('div');
    container.id = 'globalMessageBox';
    container.style.position = 'fixed';
    container.style.top = '16%';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.zIndex = '1050';
    container.style.maxWidth = '560px';
    container.style.width = 'calc(100% - 32px)';
    container.style.display = 'none';
    container.style.padding = '0 12px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
}

function showGlobalMessage(message, type = 'info', duration = 4200) {
    createGlobalMessageContainer();
    const box = document.getElementById('globalMessageBox');
    if (!box) return;

    box.innerHTML = `<div class="alert alert-${type} mb-0 rounded-4 text-center" role="alert" style="margin: 0; pointer-events: auto;">${message}</div>`;
    box.style.display = 'block';

    if (box.hideTimeout) {
        clearTimeout(box.hideTimeout);
    }
    box.hideTimeout = setTimeout(() => {
        box.style.display = 'none';
    }, duration);
}

document.addEventListener('DOMContentLoaded', function() {
    createGlobalMessageContainer();
});

const GLOBAL_CATEGORY_MAP = {
    'pizza': 'Pizza',
    'drinks': 'Đồ uống',
    'sides': 'Món phụ',
    'pasta': 'Mì Ý',
    'dessert': 'Tráng miệng',
    'chicken': 'Gà',
    'combo': 'Combo',
    'veggie': 'Chay',
    'news': 'Tin tức',
    'recipes': 'Công thức',
    'tips': 'Mẹo vặt',
    'events': 'Sự kiện',
    'promotions': 'Khuyến mãi',
    'community': 'Cộng đồng'
};

function formatCategoryGlobal(cat) {
    if (!cat) return '';
    return GLOBAL_CATEGORY_MAP[cat.toLowerCase()] || cat;
}
