document.addEventListener("DOMContentLoaded", function () {
    renderCartPageItems();
});

function resolveCartItemImage(item) {
    const catalog = [
        { id: "p1", img: "/assets/images/garlic-noodles.png" },
        { id: "p2", img: "/assets/images/Folded-Pizza.png" },
        { id: "p3", img: "/assets/images/Healthy-Roll.png" },
        { id: "p4", img: "/assets/images/Classic-Pizza.png" },
        { id: "p5", img: "/assets/images/Spicy-Pizza.png" },
        { id: "p6", img: "/assets/images/Veggie-Pizza.png" },
        { id: "p7", img: "/assets/images/Cheese-Pizza.png" },
        { id: "p8", img: "/assets/images/BBQ-Pizza.png" },
        { id: "p9", img: "/assets/images/salad-tuoi-mix.png" },
        { id: "p10", img: "/assets/images/ga-sot-cay.png" },
        { id: "p11", img: "/assets/images/humburger-tien-loi.png" },
        { id: "p12", img: "/assets/images/kem.jpg" }
    ];

    if (item?.img) return item.img;

    const matchedProduct = catalog.find(product => product.id === item?.id || product.id === item?.productId);
    return matchedProduct?.img || "/assets/images/Classic-Pizza.png";
}


function renderCartPageItems() {
    const container = document.getElementById("cartItemsListContainer");
    if (!container) return;

    
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 bg-white rounded-3 shadow-sm border p-4">
                <i class="fa-solid fa-basket-shopping display-1 text-muted opacity-20 mb-3"></i>
                <h5 class="fw-bold text-dark">Giỏ hàng của bạn đang trống</h5>
                <p class="text-muted small">Hãy quay lại Thực đơn để chọn những món ăn ngon nhất từ PIZZAN.</p>
                <a href="menu.html" class="btn btn-pizzan-red btn-sm fw-bold px-4 text-white mt-2" style="border-radius:20px !important;">CHỌN MÓN NGAY</a>
            </div>
        `;
        calculateOrderSummary(0); 
        return;
    }

    
    container.innerHTML = "";
    let tempSubtotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        tempSubtotal += itemTotal;
        const itemImage = resolveCartItemImage(item);

        const itemHTML = `
            <div class="cart-item-card shadow-sm d-flex flex-column flex-sm-row align-items-center gap-3">
                <img src="${itemImage}" alt="${item.name}" onerror="this.src='https://placehold.co/100x100?text=Food'">
                
                <div class="flex-grow-1 text-center text-sm-start">
                    <h5 class="fw-bold text-dark m-0 fs-6">${item.name}</h5>
                    <span class="text-muted" style="font-size: 12px;">Cỡ Lớn, Đế Mỏng, Thêm Phô Mai</span>
                    
                    <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-sm-start gap-3 mt-2">
                        <div class="qty-control">
                            <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                            <input type="text" class="qty-input" value="${item.quantity}" readonly>
                            <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                        </div>
                        
                        <button class="btn btn-link text-pizzan-red text-decoration-none small fw-bold p-0" onclick="removeCartItem(${index})">
                            <i class="fa-regular fa-trash-can me-1"></i> Xóa
                        </button>
                    </div>
                </div>

                <div class="text-sm-end w-100 w-sm-auto mt-2 mt-sm-0 text-center">
                    <span class="fw-bold text-danger fs-5">${(itemTotal * 15000).toLocaleString('vi-VN')}đ</span>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", itemHTML);
    });

    // Cập nhật bảng tính tiền bên phải
    calculateOrderSummary(tempSubtotal);
}

/**
 * Hàm tăng giảm số lượng (+ / -)
 */
function changeQty(index, amount) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    if (cart[index]) {
        cart[index].quantity += amount;
        
        // Nếu số lượng tụt xuống dưới 1 thì tự động xóa món
        if (cart[index].quantity < 1) {
            cart.splice(index, 1);
        }
        
        localStorage.setItem("cart", JSON.stringify(cart));
        
        // Đồng bộ badge header và vẽ lại giao diện
        if (typeof updateGlobalCartBadge === "function") updateGlobalCartBadge();
        renderCartPageItems();
    }
}

/**
 * Hàm xóa sản phẩm ra khỏi giỏ
 */
function removeCartItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    if (typeof updateGlobalCartBadge === "function") updateGlobalCartBadge();
    renderCartPageItems();
}

/**
 * Hàm tính toán chi phí bảng Order Summary bên phải
 */
let currentSubtotalGlobal = 0; // Biến phụ hỗ trợ áp mã giảm giá
function calculateOrderSummary(subtotal) {
    currentSubtotalGlobal = subtotal;
    const taxRate = 0.08; // 8% thuế theo UI thiết kế
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    document.getElementById("summarySubtotal").innerText = `${(subtotal * 15000).toLocaleString('vi-VN')}đ`;
    document.getElementById("summaryTax").innerText = `${(tax * 15000).toLocaleString('vi-VN')}đ`;
    document.getElementById("summaryTotal").innerText = `${(total * 15000).toLocaleString('vi-VN')}đ`;
}

/**
 * Hàm xử lý áp mã giảm giá (Mặc định mã PIZZA20 giảm ngay 20%)
 */
function applyPromoCode() {
    const inputVal = document.getElementById("promoCodeInput").value.trim();
    if (currentSubtotalGlobal === 0) {
        showGlobalMessage("Giỏ hàng trống, không thể áp dụng mã.", "warning");
        return;
    }

    if (inputVal.toUpperCase() === "PIZZA20") {
        const discountedSubtotal = currentSubtotalGlobal * 0.8; // Giảm 20% tiền hàng
        const tax = discountedSubtotal * 0.08;
        const total = discountedSubtotal + tax;

        document.getElementById("summarySubtotal").innerText = `$${discountedSubtotal.toFixed(2)} (Đã giảm 20%)`;
        document.getElementById("summaryTax").innerText = `${(tax * 15000).toLocaleString('vi-VN')}đ`;
        document.getElementById("summaryTotal").innerText = `${(total * 15000).toLocaleString('vi-VN')}đ`;
        showGlobalMessage("🎉 Áp dụng mã PIZZA20 thành công! Bạn được giảm 20% tổng giá trị đơn hàng.", "success");
    } else {
        showGlobalMessage("❌ Mã giảm giá không hợp lệ hoặc đã hết hạn.", "warning");
    }
}

function handleProceedToCheckout() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showGlobalMessage('Bạn cần đăng nhập trước khi thanh toán.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 700);
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showGlobalMessage('Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.', 'warning');
        return;
    }

    window.location.href = 'checkout.html';
}