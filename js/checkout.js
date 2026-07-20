let pointsDiscount = 0;
let pointsUsed = 0;





const DELIVERY_FEE = 15000;
let selectedPayment = 'cod';
let promoDiscount   = 0;




function initCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const listEl = document.getElementById('checkoutItemsList');
    if (!listEl) return;

    if (cart.length === 0) {
        listEl.innerHTML = `<p class="text-muted small text-center py-3">Giỏ hàng trống. <a href="menu.html" class="text-danger">Thêm món ngay</a></p>`;
        updateTotals(0);
        return;
    }

    listEl.innerHTML = cart.map(item => {
        const qty   = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        return `
        <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
                <img src="${item.img || '/assets/images/Classic-Pizza.png'}" alt="${item.name}"
                     class="summary-item-img" style="width:52px;height:52px;border-radius:10px;object-fit:cover;">
                <div>
                    <h6 class="fw-bold text-dark m-0 small" style="line-height:1.3">${item.name}</h6>
                    <span class="text-muted d-block" style="font-size:11px">${item.options || 'Tuỳ chọn mặc định'}</span>
                    <span class="text-muted d-block" style="font-size:11px">SL: ${qty}</span>
                </div>
            </div>
            <span class="fw-bold text-danger small">${(price * qty * 15000).toLocaleString('vi-VN')}đ</span>
        </div>`;
    }).join('');

    const subtotal = cart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
    updateTotals(subtotal);
}

function updateTotals(subtotal) {
    const subtotalVND = subtotal * 15000;
    const promoVND = promoDiscount;
    const totalVND = Math.max(0, subtotalVND + DELIVERY_FEE - promoVND - pointsDiscount);
    const fmt = v => v.toLocaleString('vi-VN') + 'đ';

    const el = id => document.getElementById(id);
    if (el('checkoutSubtotal')) el('checkoutSubtotal').textContent = fmt(subtotalVND);
    if (el('checkoutDelivery')) el('checkoutDelivery').textContent = fmt(DELIVERY_FEE);
    if (el('checkoutDiscount')) el('checkoutDiscount').textContent = '-' + fmt(promoVND);
    if (el('checkoutTotal'))    el('checkoutTotal').textContent    = fmt(totalVND);
}




function prefillUserInfo() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    const el = id => document.getElementById(id);
    if (el('checkoutName')    && user.name)    el('checkoutName').value    = user.name;
    if (el('checkoutPhone')   && user.phone)   el('checkoutPhone').value   = user.phone;
    if (el('checkoutEmail')   && user.email)   el('checkoutEmail').value   = user.email;
    if (el('checkoutAddress') && user.address) el('checkoutAddress').value = user.address;
}




function initPaymentSelection() {
    document.querySelectorAll('#paymentMethodContainer .payment-box').forEach(box => {
        box.addEventListener('click', function() {
            document.querySelectorAll('#paymentMethodContainer .payment-box').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedPayment = this.dataset.method;
        });
    });
}




function initPromoCode() {
    const btn = document.getElementById('applyPromoBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        const code = (document.getElementById('promoCodeInput')?.value || '').trim().toUpperCase();
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const subtotal = cart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);

        if (code === 'PIZZA20') {
            promoDiscount = Math.floor((subtotal * 15000) * 0.2);
            showStatus('🎉 Áp dụng mã PIZZA20 thành công! Giảm 20%', 'success');
        } else if (code === 'PIZZAN10') {
            promoDiscount = Math.floor((subtotal * 15000) * 0.1);
            showStatus('🎉 Áp dụng mã PIZZAN10 thành công! Giảm 10%', 'success');
        } else if (code === '') {
            showStatus('⚠️ Vui lòng nhập mã giảm giá.', 'warning');
            return;
        } else {
            promoDiscount = 0;
            showStatus('❌ Mã giảm giá không hợp lệ hoặc đã hết hạn.', 'danger');
        }
        updateTotals(subtotal);
    });
}




function validateForm() {
    const name    = document.getElementById('checkoutName')?.value.trim();
    const phone   = document.getElementById('checkoutPhone')?.value.trim();
    const address = document.getElementById('checkoutAddress')?.value.trim();

    if (!name || name.length < 2) {
        showStatus('⚠️ Vui lòng nhập họ và tên (ít nhất 2 ký tự).', 'warning');
        document.getElementById('checkoutName')?.focus();
        return false;
    }
    if (!phone || !/^[0-9+\s\-]{8,15}$/.test(phone)) {
        showStatus('⚠️ Vui lòng nhập số điện thoại hợp lệ.', 'warning');
        document.getElementById('checkoutPhone')?.focus();
        return false;
    }
    if (!address || address.length < 5) {
        showStatus('⚠️ Vui lòng nhập địa chỉ giao hàng.', 'warning');
        document.getElementById('checkoutAddress')?.focus();
        return false;
    }
    return true;
}




function initPlaceOrder() {
    const btn = document.getElementById('placeOrderBtn');
    if (!btn) return;

    btn.addEventListener('click', function() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            showStatus('⚠️ Giỏ hàng trống. Vui lòng thêm món trước khi thanh toán.', 'warning');
            return;
        }
        if (!validateForm()) return;

        
        const subtotal = cart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
        const total = Math.max(0, (subtotal * 15000) + DELIVERY_FEE - promoDiscount - pointsDiscount);

        if (selectedPayment === 'bank') {
            const qrModal = document.getElementById('qrPaymentModal');
            if (qrModal) {
                document.getElementById('qrAmountDisplay').textContent = total.toLocaleString('vi-VN') + 'đ';
                qrModal.style.display = 'flex';
                
                document.getElementById('confirmQrPaymentBtn').onclick = function() {
                    qrModal.style.display = 'none';
                    executeOrderSubmit(cart, total);
                };
            }
        } else {
            executeOrderSubmit(cart, total);
        }
    });
}

async function executeOrderSubmit(cart, total) {
    const btn = document.getElementById('placeOrderBtn');
    const customerInfo = {
        name:    document.getElementById('checkoutName').value.trim(),
        phone:   document.getElementById('checkoutPhone').value.trim(),
        address: document.getElementById('checkoutAddress').value.trim(),
        email:   document.getElementById('checkoutEmail')?.value.trim() || '',
        note:    document.getElementById('checkoutNote')?.value.trim() || ''
    };

    const items = cart.map(item => ({
        productId: item.id || item._id || Math.floor(Math.random() * 100000),
        name:      item.name,
        price:     Number(item.price || 0),
        quantity:  Number(item.quantity || 1),
        image:     item.image || item.img || ''
    }));

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang xử lý...';
    showStatus('⏳ Đang gửi đơn hàng...', 'info');

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerInfo,
                items,
                totalAmount: total,
                paymentMethod: selectedPayment,
                pointsUsed: pointsUsed
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showStatus('❌ ' + (data.message || 'Lỗi đặt hàng. Vui lòng thử lại.'), 'danger');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check me-2"></i>ĐẶT HÀNG NGAY';
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            if (data.user) {
                const updated = { ...currentUser, ...data.user };
                localStorage.setItem('currentUser', JSON.stringify(updated));
                localStorage.setItem('user', JSON.stringify(updated));
            } else if (data.newPoints !== undefined && data.newPoints !== null) {
                currentUser.points = data.newPoints;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('user', JSON.stringify(currentUser));
            }
        }
        const localOrders = JSON.parse(localStorage.getItem('pizzanOrders')) || [];
        const localOrder = {
            id:               data.orderId || ('ORD-' + Date.now()),
            _mongoId:         data.orderId,
            status:           'inprogress',
            itemsDescription: cart.map(i => i.name).join(', '),
            date:             new Date().toLocaleString('vi-VN'),
            price:            total,
            itemCount:        cart.reduce((c, i) => c + Number(i.quantity || 1), 0),
            img:              cart[0]?.image || cart[0]?.img || '/assets/images/Classic-Pizza.png',
            userEmail:        currentUser?.email || customerInfo.email || null,
            cartItems:        cart
        };
        localOrders.unshift(localOrder);
        localStorage.setItem('pizzanOrders', JSON.stringify(localOrders));

        localStorage.removeItem('cart');
        if (typeof updateGlobalCartBadge === 'function') updateGlobalCartBadge();

        showStatus('🎉 Đặt hàng thành công! Đơn hàng của bạn đang được xử lý.', 'success');
        btn.innerHTML = '<i class="fa-solid fa-check-circle me-2"></i>ĐÃ ĐẶT HÀNG';

        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);

    } catch (err) {
        console.error('Checkout error:', err);
        showStatus('❌ Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.', 'danger');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check me-2"></i>ĐẶT HÀNG NGAY';
    }
}




function showStatus(msg, type = 'info') {
    const el = document.getElementById('checkoutStatusMsg');
    if (!el) return;
    el.style.display = 'block';
    el.innerHTML = `<div class="alert alert-${type} rounded-3 mb-0 small">${msg}</div>`;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}




document.addEventListener('DOMContentLoaded', function() {
    initCheckoutSummary();
    prefillUserInfo();
    initPaymentSelection();
    initPromoCode();
    initPlaceOrder();
    initPointsRedemption();
});



function initPointsRedemption() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const container = document.getElementById('pointsRedemptionContainer');
    const display = document.getElementById('availablePointsDisplay');
    const checkbox = document.getElementById('usePointsCheckbox');
    const msg = document.getElementById('pointsDiscountMsg');
    const val = document.getElementById('pointsDiscountValue');

    if (!container) return;

    if (!currentUser || !currentUser.points || currentUser.points <= 0) {
        
        
        
        container.style.setProperty('display', 'flex', 'important');
        if (display) display.textContent = '0';
        if (checkbox) checkbox.disabled = true;
        return;
    }

    if (display && checkbox) {
        container.style.setProperty('display', 'flex', 'important');
        display.textContent = currentUser.points;

        checkbox.addEventListener('change', function() {
            if (this.checked) {
                pointsUsed = currentUser.points;
                pointsDiscount = pointsUsed * 10;
                if (msg) msg.classList.remove('d-none');
                if (val) val.textContent = pointsDiscount.toLocaleString('vi-VN');
            } else {
                pointsUsed = 0;
                pointsDiscount = 0;
                if (msg) msg.classList.add('d-none');
            }
            
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const subtotal = cart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
            updateTotals(subtotal);
        });
    }
}
