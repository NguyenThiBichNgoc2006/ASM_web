document.addEventListener("DOMContentLoaded", function () {
    const formLogin = document.getElementById("formLogin");
    const formRegister = document.getElementById("formRegister");

    
    
    
    if (formRegister) {
        formRegister.addEventListener("submit", async function (e) {
            e.preventDefault(); 

            const name = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value.trim();

            let isValid = true;

            if (name.length < 3) {
                document.getElementById("errorRegName").classList.remove("d-none");
                isValid = false;
            } else {
                document.getElementById("errorRegName").classList.add("d-none");
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                document.getElementById("errorRegEmail").classList.remove("d-none");
                isValid = false;
            } else {
                document.getElementById("errorRegEmail").classList.add("d-none");
            }

            if (password.length < 6) {
                document.getElementById("errorRegPassword") && document.getElementById("errorRegPassword").classList.remove("d-none");
                isValid = false;
            } else {
                document.getElementById("errorRegPassword") && document.getElementById("errorRegPassword").classList.add("d-none");
            }

            if (isValid) {
                try {
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password })
                    });
                    const data = await response.json();

                    if (!response.ok) {
                        showGlobalMessage("⚠️ " + data.message, "warning");
                        return;
                    }

                    showGlobalMessage("🎉 Tài khoản đã được tạo thành công! Vui lòng đăng nhập.", "success");
                    
                    const loginTabEl = document.getElementById('login-tab');
                    if (loginTabEl) {
                        const loginTab = new bootstrap.Tab(loginTabEl);
                        loginTab.show();
                    } else {
                        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                    }
                    formRegister.reset(); 
                } catch (error) {
                    showGlobalMessage("⚠️ Lỗi kết nối đến máy chủ", "danger");
                }
            }
        });
    }

    
    
    
    if (formLogin) {
        formLogin.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();

            let isValid = true;

            if (email === "") {
                document.getElementById("errorLoginEmail").classList.remove("d-none");
                isValid = false;
            } else {
                document.getElementById("errorLoginEmail").classList.add("d-none");
            }

            if (password === "") {
                document.getElementById("errorLoginPassword") && document.getElementById("errorLoginPassword").classList.remove("d-none");
                isValid = false;
            } else {
                document.getElementById("errorLoginPassword") && document.getElementById("errorLoginPassword").classList.add("d-none");
            }

            if (isValid) {
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await response.json();

                    if (!response.ok) {
                        showGlobalMessage("⚠️ " + data.message, "danger");
                        return;
                    }

                    
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("token", data.token);
                    
                    localStorage.setItem("currentUser", JSON.stringify(data.user));
                    localStorage.setItem("authToken", data.token);

                    showGlobalMessage("🎉 Đăng nhập thành công!", "success");

                    setTimeout(() => {
                        
                        if (data.user && data.user.role === 'admin') {
                            window.location.href = "admin.html";
                        } else {
                            window.location.href = "index.html";
                        }
                    }, 1000);

                } catch (error) {
                    showGlobalMessage("⚠️ Lỗi kết nối đến máy chủ", "danger");
                }
            }
        });
    }
});


function showGlobalMessage(msg, type) {
    const alertBox = document.createElement("div");
    alertBox.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertBox.style.zIndex = 9999;
    alertBox.style.minWidth = "300px";
    alertBox.innerHTML = `
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.remove();
    }, 3000);
}