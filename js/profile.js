// ==========================================================================
// LOGIC XỬ LÝ TRANG HỒ SƠ CÁ NHÂN (PROFILE.JS)
// ==========================================================================

// Dữ liệu đơn hàng mẫu (hiển thị khi chưa có đơn thật)
const SAMPLE_ORDERS = [];

// ============================
// 1. TẢI THÔNG TIN NGƯỜI DÙNG
// ============================
function populateProfileData() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // Nếu chưa đăng nhập -> chuyển về trang login
    if (!currentUser) {
        showGlobalMessage("Vui lòng đăng nhập để truy cập hồ sơ của bạn.", "warning");
        setTimeout(() => { window.location.href = "login.html"; }, 700);
        return;
    }

    // Cập nhật sidebar
    const el = (id) => document.getElementById(id);
    if (el("userNameDisplay")) el("userNameDisplay").textContent = currentUser.name || "Thành Viên";
    if (el("userEmailDisplay")) el("userEmailDisplay").textContent = currentUser.email || "";

    // Hiển thị avatar (hỗ trợ URL ngoài và đường dẫn nội bộ)
    if (el("userAvatar")) {
        const avatarSrc = currentUser.avatar || '';
        el("userAvatar").src = avatarSrc && avatarSrc.trim() !== '' ? avatarSrc : "/assets/images/avatar.jpg";
        el("userAvatar").onerror = function() { this.src = '/assets/images/avatar.jpg'; };
    }

    // Điền vào form thông tin cá nhân
    if (el("profileName"))    el("profileName").value    = currentUser.name    || "";
    if (el("profileEmail"))   el("profileEmail").value   = currentUser.email   || "";
    if (el("profilePhone"))   el("profilePhone").value   = currentUser.phone   || "";
    if (el("profileAddress")) el("profileAddress").value = currentUser.address || "";
    if (el("profileRole")) {
        const roleMap = { admin: 'Quản Trị Viên', user: 'Thành Viên' };
        el("profileRole").value = roleMap[currentUser.role] || currentUser.role || "Thành Viên";
    }

    // Lấy điểm thưởng thực từ API
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
        fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                const pts = data.points || 0;
                const money = pts * 10; // 1 điểm = 10đ
                if (el("loyaltyPointsDisplay")) {
                    el("loyaltyPointsDisplay").textContent = `${pts.toLocaleString('vi-VN')} Điểm`;
                }
                if (el("pointsMoneyValue")) {
                    el("pointsMoneyValue").textContent = `≈ ${money.toLocaleString('vi-VN')}đ`;
                }
                // Cập nhật localStorage với điểm mới nhất
                const updated = { ...currentUser, points: pts, rewardHistory: data.rewardHistory || [] };
                localStorage.setItem("currentUser", JSON.stringify(updated));
            })
            .catch(() => {
                const pts = currentUser.points || 0;
                if (el("loyaltyPointsDisplay")) {
                    el("loyaltyPointsDisplay").textContent = `${pts.toLocaleString('vi-VN')} Điểm`;
                }
                if (el("pointsMoneyValue")) {
                    el("pointsMoneyValue").textContent = `≈ ${(pts * 10).toLocaleString('vi-VN')}đ`;
                }
            });
    } else {
        const pts = currentUser.points || 0;
        if (el("loyaltyPointsDisplay")) {
            el("loyaltyPointsDisplay").textContent = `${pts.toLocaleString('vi-VN')} Điểm`;
        }
        if (el("pointsMoneyValue")) {
            el("pointsMoneyValue").textContent = `≈ ${(pts * 10).toLocaleString('vi-VN')}đ`;
        }
    }
}

// ============================
// 2. CẬP NHẬT THÔNG TIN CÁ NHÂN
// ============================
function setupProfileForm() {
    const form = document.getElementById("formUpdateProfile");
    if (!form) return;

    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        const statusEl = document.getElementById("profileSaveStatus");
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");

        const name    = document.getElementById("profileName").value.trim();
        const phone   = document.getElementById("profilePhone").value.trim();
        const address = document.getElementById("profileAddress").value.trim();

        if (!name || name.length < 2) {
            showGlobalMessage("⚠️ Họ và tên phải có ít nhất 2 ký tự.", "warning");
            return;
        }

        if (statusEl) statusEl.textContent = "Đang lưu...";

        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, phone, address })
            });

            const data = await res.json();

            if (!res.ok) {
                showGlobalMessage("⚠️ " + (data.message || "Lỗi cập nhật thông tin"), "danger");
                if (statusEl) statusEl.textContent = "";
                return;
            }

            // Cập nhật localStorage
            const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
            const updated = { ...currentUser, ...data.user };
            localStorage.setItem("currentUser", JSON.stringify(updated));
            localStorage.setItem("user", JSON.stringify(updated));

            // Cập nhật hiển thị sidebar
            const nameEl = document.getElementById("userNameDisplay");
            if (nameEl) nameEl.textContent = data.user.name;

            showGlobalMessage("✅ Cập nhật thông tin thành công!", "success");
            if (typeof updateGlobalAuthArea === "function") updateGlobalAuthArea();
            if (statusEl) statusEl.textContent = "Đã lưu ✓";
            setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);

        } catch (err) {
            showGlobalMessage("⚠️ Lỗi kết nối đến máy chủ", "danger");
            if (statusEl) statusEl.textContent = "";
        }
    });
}

// ============================
// 3. ĐỔI MẬT KHẨU
// ============================
function setupPasswordForm() {
    const form = document.getElementById("formChangePassword");
    if (!form) return;

    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        const statusEl = document.getElementById("passwordSaveStatus");
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");

        const currentPassword    = document.getElementById("currentPassword").value;
        const newPassword        = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showGlobalMessage("⚠️ Vui lòng điền đầy đủ tất cả các trường.", "warning");
            return;
        }
        if (newPassword.length < 6) {
            showGlobalMessage("⚠️ Mật khẩu mới phải có ít nhất 6 ký tự.", "warning");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showGlobalMessage("⚠️ Xác nhận mật khẩu không khớp.", "warning");
            return;
        }

        if (statusEl) statusEl.textContent = "Đang cập nhật...";

        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                showGlobalMessage("⚠️ " + (data.message || "Lỗi đổi mật khẩu"), "danger");
                if (statusEl) statusEl.textContent = "";
                return;
            }

            showGlobalMessage("✅ Đổi mật khẩu thành công!", "success");
            form.reset();
            if (statusEl) statusEl.textContent = "Đã cập nhật ✓";
            setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);

        } catch (err) {
            showGlobalMessage("⚠️ Lỗi kết nối đến máy chủ", "danger");
            if (statusEl) statusEl.textContent = "";
        }
    });
}

// ============================
// 4. HIỂN THỊ LỊCH SỬ ĐƠN HÀNG
// ============================
function getStatusLabel(status) {
    const map = { delivered: 'Đã Giao', inprogress: 'Đang Giao', cancelled: 'Đã Hủy' };
    return map[status] || status;
}
function getStatusClass(status) {
    const map = { delivered: 'status-delivered', inprogress: 'status-inprogress', cancelled: 'status-cancelled' };
    return map[status] || '';
}
function getActionBtn(status) {
    if (status === 'inprogress') return `<button class="btn btn-order-action btn-order-track"><i class="fa-solid fa-location-dot me-1"></i>Theo Dõi</button>`;
    if (status === 'cancelled')  return `<button class="btn btn-order-action" style="opacity:0.5;" disabled>Đã Hủy</button>`;
    return `<button class="btn btn-order-action"><i class="fa-solid fa-rotate-right me-1"></i>Đặt Lại</button>`;
}

let allOrders = [];

function renderOrders(filter = 'all') {
    const container = document.getElementById("orderHistoryListContainer");
    if (!container) return;

    const filtered = filter === 'all' ? allOrders : allOrders.filter(o => o.status === filter);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-center text-muted small py-4">Không có đơn hàng nào.</p>`;
        return;
    }

    container.innerHTML = filtered.map(order => `
        <div class="order-history-item">
            <div class="d-flex align-items-center gap-3">
                <img src="${order.img || '/assets/images/Blog-2.png'}" alt="Đơn hàng" class="order-item-img">
                <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="fw-bold text-dark small">#${order.id}</span>
                        <span class="status-badge ${getStatusClass(order.status)}">${getStatusLabel(order.status)}</span>
                    </div>
                    <p class="text-secondary small m-0 mb-1" style="font-size:12px;font-weight:500;">${order.itemsDescription}</p>
                    <span class="text-muted d-block" style="font-size:11px;">${order.date}</span>
                </div>
            </div>
            <div class="d-flex align-items-center gap-4">
                <div class="text-end">
                    <span class="fw-bold text-danger d-block" style="font-size:17px;">${Number(order.price).toLocaleString('vi-VN')}đ</span>
                    <span class="text-muted d-block" style="font-size:10px;">${order.itemCount} MÓN</span>
                </div>
                <div>${getActionBtn(order.status)}</div>
            </div>
        </div>
    `).join('');
}

function setupOrderFilters() {
    document.querySelectorAll(".order-filter-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".order-filter-btn").forEach(b => {
                b.classList.remove("active", "btn-danger");
                b.style.background = '';
                b.style.color = '';
            });
            this.classList.add("active");
            this.style.background = '#e3001b';
            this.style.color = '#fff';
            renderOrders(this.dataset.filter);
        });
    });
    // Set default active style
    const defaultBtn = document.querySelector('.order-filter-btn[data-filter="all"]');
    if (defaultBtn) {
        defaultBtn.style.background = '#e3001b';
        defaultBtn.style.color = '#fff';
    }
}

async function loadOrderHistory() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const container = document.getElementById("orderHistoryListContainer");

    if (!currentUser) {
        allOrders = [...SAMPLE_ORDERS];
        renderOrders('all');
        setupOrderFilters();
        return;
    }

    // Thử fetch từ API
    if (token) {
        try {
            const res = await fetch('/api/orders/my-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const apiOrders = await res.json();
                // Chuyển đổi format API sang format hiển thị
                const formatted = apiOrders.map(o => ({
                    id:               String(o._id).slice(-6).toUpperCase(),
                    status:           mapApiStatus(o.status),
                    itemsDescription: (o.items || []).map(i => `<a href="menu.html?highlight=${i.productId || i._id || ''}" class="text-danger text-decoration-none fw-bold">${i.name}</a>`).join(', ') || '-',
                    date:             o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '-',
                    price:            o.totalAmount || 0,
                    itemCount:        (o.items || []).reduce((c, i) => c + (i.quantity || 1), 0),
                    img:              o.items?.[0]?.image || '/assets/images/Blog-2.png',
                    _raw:             o
                }));
                allOrders = [...formatted, ...SAMPLE_ORDERS];
                renderOrders('all');
                setupOrderFilters();
                return;
            }
        } catch (e) { /* fallback sang localStorage */ }
    }

    // Fallback: đọc từ localStorage
    const storedOrders = JSON.parse(localStorage.getItem('pizzanOrders')) || [];
    const userOrders = storedOrders
        .filter(o => o.userEmail === currentUser.email)
        .map(o => ({
            id:               o.id || 'ORD-???',
            status:           o.status === 'inprogress' ? 'inprogress' : 'delivered',
            itemsDescription: (o.cartItems && o.cartItems.length) ? o.cartItems.map(i => `<a href="menu.html?highlight=${i.id || i._id || ''}" class="text-danger text-decoration-none fw-bold">${i.name}</a>`).join(', ') : (o.itemsDescription || '-'),
            date:             o.date || '-',
            price:            o.price || 0,
            itemCount:        o.itemCount || 0,
            img:              o.img || '/assets/images/Blog-2.png'
        }));
    allOrders = [...userOrders, ...SAMPLE_ORDERS];
    renderOrders('all');
    setupOrderFilters();
}

// Map trạng thái API -> trạng thái hiển thị
function mapApiStatus(status) {
    const map = { pending: 'inprogress', processing: 'inprogress', completed: 'delivered', cancelled: 'cancelled' };
    return map[status] || 'inprogress';
}


// ============================
// 5. UPLOAD AVATAR
// ============================
function setupAvatarUpload() {
    const editBtn = document.getElementById("avatarEditBtn");
    const fileInput = document.getElementById("avatarFileInput");
    const avatarImg = document.getElementById("userAvatar");

    if (!editBtn || !fileInput || !avatarImg) return;

    editBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async function() {
        const file = this.files[0];
        if (!file) return;

        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        const formData = new FormData();
        formData.append("image", file);

        showGlobalMessage("⏳ Đang tải ảnh lên...", "info");

        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) { showGlobalMessage("⚠️ Tải ảnh thất bại", "danger"); return; }

            // Cập nhật avatar qua API
            const updateRes = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ avatar: data.url })
            });
            const updateData = await updateRes.json();

            if (updateRes.ok) {
                avatarImg.src = data.url;
                const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
                const updated = { ...currentUser, avatar: data.url };
                localStorage.setItem("currentUser", JSON.stringify(updated));
                localStorage.setItem("user", JSON.stringify(updated));
                showGlobalMessage("✅ Cập nhật ảnh đại diện thành công!", "success");
                if (typeof updateGlobalAuthArea === "function") updateGlobalAuthArea();
            } else {
                showGlobalMessage("⚠️ " + (updateData.message || "Lỗi cập nhật avatar"), "danger");
            }
        } catch (err) {
            showGlobalMessage("⚠️ Lỗi kết nối khi tải ảnh", "danger");
        }
    });
}

// ============================
// 6. LỊCH SỬ TÍCH ĐIỂM
// ============================
async function loadRewardHistory() {
    const container = document.getElementById("rewardHistoryContainer");
    if (!container) return;

    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
        container.innerHTML = `<p class="text-center text-muted small py-3">Vui lòng đăng nhập để xem lịch sử.</p>`;
        return;
    }

    container.innerHTML = `<p class="text-center text-muted small py-3"><i class="fa-solid fa-spinner fa-spin me-1"></i>Đang tải...</p>`;

    try {
        const res = await fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        const history = (data.rewardHistory || []).slice().reverse(); // Mới nhất trước

        // Cập nhật hiển thị điểm
        const pts = data.points || 0;
        const el = (id) => document.getElementById(id);
        if (el("loyaltyPointsDisplay")) el("loyaltyPointsDisplay").textContent = `${pts.toLocaleString('vi-VN')} Điểm`;
        if (el("pointsMoneyValue")) el("pointsMoneyValue").textContent = `≈ ${(pts * 10).toLocaleString('vi-VN')}đ`;

        if (history.length === 0) {
            container.innerHTML = `<p class="text-center text-muted small py-3">Chưa có lịch sử tích điểm nào.<br><small>Mỗi đơn hàng hoàn thành sẽ cộng <strong>10 điểm</strong> (= 100đ).</small></p>`;
            return;
        }

        container.innerHTML = history.map(h => `
            <div class="reward-history-item d-flex align-items-center justify-content-between py-3" style="border-bottom:1px solid #f5f5f5;">
                <div class="d-flex align-items-center gap-3">
                    <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#fff0f1,#ffe0e3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid fa-star" style="color:#e3001b;font-size:16px;"></i>
                    </div>
                    <div>
                        <p class="m-0 fw-bold text-dark" style="font-size:13px;">${h.note || 'Tích điểm đơn hàng'}</p>
                        <span class="text-muted" style="font-size:11px;">${h.createdAt ? new Date(h.createdAt).toLocaleString('vi-VN') : ''}</span>
                    </div>
                </div>
                <div class="text-end">
                    <span class="fw-bold" style="color:${h.points > 0 ? '#1a9e5a' : '#e3001b'};font-size:16px;">${h.points > 0 ? '+' : ''}${h.points} điểm</span>
                    <span class="d-block text-muted" style="font-size:11px;">= ${(Math.abs(h.points) * 10).toLocaleString('vi-VN')}đ</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = `<p class="text-center text-muted small py-3">Không thể tải lịch sử điểm.</p>`;
    }
}

// ============================
// 7. CHUYỂN TAB SIDEBAR
// ============================
function setupTabs() {
    const tabButtons = document.querySelectorAll(".profile-tab-link[data-tab]");
    const panels = document.querySelectorAll(".profile-panel");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", function() {
            const targetId = this.dataset.tab;

            // Deactivate all
            tabButtons.forEach(b => b.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active"));

            // Activate target
            this.classList.add("active");
            const panel = document.getElementById(targetId);
            if (panel) panel.classList.add("active");

            // Load orders khi mở tab đơn hàng
            if (targetId === "tab-orders") loadOrderHistory();
            // Load lịch sử điểm khi mở tab điểm thưởng
            if (targetId === "tab-points") loadRewardHistory();
        });
    });
}

// ============================
// 7. TOGGLE HIỆN/ẨN MẬT KHẨU
// ============================
function setupPasswordToggles() {
    document.querySelectorAll(".toggle-pw").forEach(icon => {
        icon.addEventListener("click", function() {
            const input = document.getElementById(this.dataset.target);
            if (!input) return;
            if (input.type === "password") {
                input.type = "text";
                this.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                input.type = "password";
                this.classList.replace("fa-eye-slash", "fa-eye");
            }
        });
    });
}

// ============================
// 8. ĐĂNG XUẤT
// ============================
function setupLogout() {
    const btn = document.getElementById("btnLogoutAction");
    if (!btn) return;
    btn.addEventListener("click", function(e) {
        e.preventDefault();
        localStorage.removeItem("currentUser");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        showGlobalMessage("Bạn đã đăng xuất tài khoản.", "success");
        setTimeout(() => { window.location.href = "index.html"; }, 700);
    });
}

// ============================
// KHỞI CHẠY
// ============================
document.addEventListener("DOMContentLoaded", function() {
    populateProfileData();
    setupTabs();
    setupProfileForm();
    setupPasswordForm();
    setupPasswordToggles();
    setupAvatarUpload();
    setupLogout();
    // Load orders mặc định cho tab điểm thưởng (badge count)
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
        const storedOrders = JSON.parse(localStorage.getItem("pizzanOrders")) || [];
        allOrders = [...storedOrders.filter(o => o.userEmail === currentUser.email), ...SAMPLE_ORDERS];
    }
});