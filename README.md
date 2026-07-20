# PIZZAN Web - Hướng dẫn chạy dự án

## Yêu cầu
- Node.js >= 18
- Tài khoản MongoDB Atlas (hoặc MongoDB local)

## Cài đặt

### 1. Clone dự án về máy
```bash
git clone <repo-url>
cd ASM_Web
```

### 2. Cài thư viện
```bash
npm install
```

### 3. Tạo file `.env` trong thư mục gốc
```
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
```

### 4. Chạy server
```bash
npm start
```

Truy cập: http://localhost:3000

---

## Cấu trúc thư mục
```
ASM_Web/
├── assets/         # Ảnh, tài nguyên tĩnh
├── controllers/    # Logic xử lý request
├── css/            # CSS stylesheet
├── js/             # JavaScript phía client
├── models/         # MongoDB models (Mongoose)
├── routes/         # API routes
├── views/          # HTML pages
├── server.js       # Entry point
├── vercel.json     # Cấu hình deploy Vercel
└── package.json    # Danh sách thư viện
```

## Deploy lên Vercel
```bash
npm install -g vercel
vercel login
vercel
```
Sau đó thêm các biến môi trường trong Vercel Dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
