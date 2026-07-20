
const INITIAL_PRODUCTS = [
    { id: 1, name: "Garlic Butter Noodles", category: "chicken", price: 12.50, tag: "sale", description: "Wok-fried premium noodles with roasted garlic, butter and fresh herbs.", image: "/assets/images/garlic-noodles.png" },
    { id: 2, name: "Italian Calzone Fold", category: "combo", price: 18.00, tag: "new", description: "Traditional Italian style folded pizza stuffed with mozzarella, ricotta, and ham.", image: "/assets/images/steak-hero.png" },
    { id: 3, name: "Brown Rice Spring Rolls", category: "veggie", price: 9.99, tag: "hot", description: "Light and healthy rolls made with organic brown rice paper and fresh veggies.", image: "/assets/images/Healthy-Roll.png" },
    { id: 4, name: "Double Pepperoni Feast", category: "all", price: 21.50, tag: "none", description: "Loaded with spicy pepperoni and double cheese for the ultimate feast.", image: "/assets/images/Classic-Pizza.png" },
    { id: 5, name: "Volcano Spicy Chicken", category: "chicken", price: 19.20, tag: "none", description: "Tender grilled chicken with explosive chili sauce and fresh peppers.", image: "/assets/images/Spicy-Pizza.png" },
    { id: 6, name: "Garden Fresh Veggie", category: "veggie", price: 16.50, tag: "new", description: "A colorful medley of bell peppers, onions, mushrooms, and sweet corn.", image: "/assets/images/Veggie-Pizza.png" },
    { id: 7, name: "Ultimate 4-Cheese", category: "combo", price: 17.80, tag: "none", description: "A rich blend of Mozzarella, Parmesan, Cheddar, and Gorgonozola cheese.", image: "/assets/images/Cheese-Pizza.png" },
    { id: 8, name: "Smokey BBQ Fusion", category: "combo", price: 20.00, tag: "hot", description: "Sweet and smokey BBQ base with grilled chicken, red onions and cilantro.", image: "/assets/images/BBQ-Pizza.png" }
];

let ALL_PIZZAN_PRODUCTS = [];

document.addEventListener("DOMContentLoaded", async function () {
    try {
        
        const res = await fetch('/api/products');
        if (res.ok) {
            ALL_PIZZAN_PRODUCTS = await res.json();
        } else {
            throw new Error("API not ok");
        }
    } catch (error) {
        console.warn("⚠️ Không kết nối được tới server MongoDB. Đang dùng dữ liệu cứng dự phòng.");
        ALL_PIZZAN_PRODUCTS = INITIAL_PRODUCTS; 
    }

    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("q")?.trim();

    
    const filterGroup = document.getElementById('categoryFilterGroup');
    if (filterGroup) {
        const uniqueCats = [...new Set(ALL_PIZZAN_PRODUCTS.map(p => p.category))].filter(Boolean).filter(c => c.toLowerCase() !== 'all');
        let html = `<button class="btn filter-btn active" onclick="filterCategory('all', this)">Tất Cả</button>`;
        uniqueCats.forEach(c => {
            const cName = formatCategoryGlobal(c);
            html += `<button class="btn filter-btn" onclick="filterCategory('${c}', this)">${cName}</button>`;
        });
        filterGroup.innerHTML = html;
    }


    const highlightId = urlParams.get("highlight");
    if (highlightId) {
        
        renderMenuProducts(ALL_PIZZAN_PRODUCTS);
        
        setTimeout(() => {
            const el = document.getElementById('product-card-' + highlightId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.transition = 'all 0.5s ease';
                el.style.boxShadow = '0 0 30px #e3001b';
                el.style.transform = 'scale(1.05)';
                el.style.zIndex = '10';
                
                setTimeout(() => {
                    el.style.boxShadow = '';
                    el.style.transform = '';
                    el.style.zIndex = '';
                }, 2000);
            }
        }, 500);
    } else if (searchTerm) {
        const filteredProducts = searchProducts(searchTerm);
        if (filteredProducts.length) {
            renderMenuProducts(filteredProducts);
        } else {
            renderNoSearchResults(searchTerm);
        }

        const searchInput = document.querySelector('input[name="q"]');
        if (searchInput) {
            searchInput.value = searchTerm;
        }
    } else {
        // Chỉ hiện 8 món đầu tiên nếu không có search
        renderMenuProducts(ALL_PIZZAN_PRODUCTS.slice(0, 8));
    }
});

function searchProducts(query) {
    const keyword = query.toLowerCase();
    return ALL_PIZZAN_PRODUCTS.filter(product => {
        return product.name.toLowerCase().includes(keyword)
            || (product.description && product.description.toLowerCase().includes(keyword))
            || product.category.toLowerCase().includes(keyword);
    });
}

function renderNoSearchResults(query) {
    const gridContainer = document.getElementById("menuProductGrid");
    if (!gridContainer) return;

    gridContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-warning text-center" role="alert">
                Không tìm thấy món ăn phù hợp với "<strong>${query}</strong>". Vui lòng thử lại với từ khóa khác.
            </div>
        </div>
    `;
}

function renderMenuProducts(productsList) {
    const gridContainer = document.getElementById("menuProductGrid");
    if (!gridContainer) return;

    gridContainer.innerHTML = "";
    
     

    productsList.forEach(product => {
        let tagHTML = "";
        if (product.isTopPage) {
            tagHTML = `<div class="card-badge-tag bg-tag-sale">🔥 Đầu trang</div>`;
        } else if (product.isPopular) {
            tagHTML = `<div class="card-badge-tag bg-tag-hot">⭐ Nổi bật</div>`;
        } else if (product.tag && product.tag !== "none") {
            tagHTML = `<div class="card-badge-tag bg-tag-${product.tag}">${product.tag}</div>`;
        }

        const cardHTML = `
            <div class="col" id="product-card-${product.id || product._id}">
                <div class="card h-100 food-card position-relative">
                    ${tagHTML}
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https:
                    <div class="card-body p-0 d-flex flex-column justify-content-between">
                        <div>
                            <h5 class="card-title fw-bold text-dark mb-2 fs-6">${product.name}</h5>
                            <p class="card-text text-muted small mb-3" style="font-size: 13px; line-height: 1.4;">${product.description}</p>
                        </div>
                        <div>
                            <div class="fw-bold text-danger mb-3 fs-5">${(Number(product.price || 0) * 15000).toLocaleString('vi-VN')}đ</div>
                            <button class="btn btn-pizzan-red btn-sm w-100 fw-bold" onclick="addToCart('${product.id}')">
                                <i class="fa-solid fa-cart-plus me-2"></i> THÊM VÀO GIỎ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        gridContainer.innerHTML += cardHTML;
    });
}

let CURRENT_CATEGORY = 'all';

// Hàm Load More (Tải thêm sản phẩm)
window.triggerLoadMoreDishes = function(btn) {
    if (btn) {
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang tải...`;
        
        setTimeout(() => {
            
            const productsToRender = CURRENT_CATEGORY === 'all' 
                ? ALL_PIZZAN_PRODUCTS 
                : ALL_PIZZAN_PRODUCTS.filter(p => p.category === CURRENT_CATEGORY);
                
            renderMenuProducts(productsToRender);
            btn.style.display = "none";
        }, 800);
    }
}

window.filterCategory = function(category, element) {
    CURRENT_CATEGORY = category;
    
    
    const buttons = document.querySelectorAll('#categoryFilterGroup .filter-btn');
    if (buttons) {
        buttons.forEach(btn => btn.classList.remove('active'));
    }
    if (element) {
        element.classList.add('active');
    }
    
    
    const filtered = category === 'all' 
        ? ALL_PIZZAN_PRODUCTS.slice(0, 8) 
        : ALL_PIZZAN_PRODUCTS.filter(p => p.category === category);
        
    renderMenuProducts(filtered);
    
    
    const btnLoadMore = document.getElementById("btnLoadMore");
    if (btnLoadMore) {
        if (category === 'all' && ALL_PIZZAN_PRODUCTS.length > 8) {
            btnLoadMore.style.display = "inline-block";
            btnLoadMore.innerHTML = "TẢI THÊM MÓN ĂN";
        } else {
            btnLoadMore.style.display = "none";
        }
    }
}

window.addToCart = function(productId) {
    const product = ALL_PIZZAN_PRODUCTS.find(p => p.id == productId || p._id == productId);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let existingItem = cart.find(item => item.id == (product.id || product._id));

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id || product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    if (typeof updateGlobalCartBadge === 'function') {
        updateGlobalCartBadge();
    }
    
    if (typeof showGlobalMessage === 'function') {
        showGlobalMessage('Đã thêm "' + product.name + '" vào giỏ hàng!', 'success');
    }
};
