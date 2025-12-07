# Hướng dẫn Deploy lên Render.com

## 📋 Các bước chuẩn bị

### 1. Environment Variables cần thiết

Trong Render Dashboard, vào **Environment** và thêm các biến sau:

#### Database

- `MONGO_URI` - Connection string MongoDB (ví dụ: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)

#### Authentication

- `JWT_SECRET` - Secret key cho JWT token (chuỗi ngẫu nhiên, ví dụ: `your-super-secret-jwt-key-here`)

#### Email Service (SMTP)

- `SMTP_HOST` - SMTP server (ví dụ: `smtp.gmail.com`)
- `SMTP_PORT` - Port SMTP (ví dụ: `587` hoặc `465`)
- `SMTP_SECURE` - `true` hoặc `false` (dùng SSL/TLS)
- `SMTP_USER` - Email đăng nhập SMTP
- `SMTP_PASS` - Mật khẩu ứng dụng SMTP

#### VNPay Payment

- `VNPAY_TMN_CODE` - Mã website VNPay
- `VNPAY_HASH_SECRET` - Key bảo mật VNPay
- `VNPAY_URL` - URL cổng thanh toán VNPay
- `BE_URL` - URL backend (ví dụ: `https://cayxanhanphatbe.onrender.com/`)

#### Server

- `PORT` - Render tự động set, không cần thêm
- `NODE_ENV` - Set là `production` (Render tự động set)

### 2. Cấu hình Render Service

1. **Service Type**: Chọn **Web Service**
2. **Build Command**: `npm install` (hoặc để trống, Render tự động chạy)
3. **Start Command**: `npm start` (đã có trong package.json)
4. **Root Directory**: Để trống (hoặc `./` nếu cần)

### 3. ⚠️ Lưu ý quan trọng về File Uploads

**VẤN ĐỀ**: Render sử dụng **ephemeral filesystem** - tất cả files sẽ bị xóa khi service restart hoặc deploy lại.

**GIẢI PHÁP**:

- Sử dụng Cloud Storage (AWS S3, Cloudinary, etc.) để lưu ảnh
- Hoặc sử dụng Render Disk để lưu persistent storage (có phí)

### 4. Cấu trúc thư mục trên Render

Khi deploy, cấu trúc sẽ là:

```
/
├── backend/
│   ├── assets/        (files sẽ bị mất khi restart)
│   ├── config/
│   ├── controllers/
│   └── server.js
├── package.json
└── ...
```

## 🔧 Các vấn đề đã được sửa

1. ✅ **Static files path** - Đã sửa đường dẫn trong server.js
2. ✅ **Multer destination** - Cần sửa để dùng đường dẫn tuyệt đối
3. ✅ **CORS** - Đã cấu hình đúng các domain

## 🚀 Các bước deploy

1. Push code lên GitHub/GitLab
2. Kết nối repository với Render
3. Cấu hình Environment Variables
4. Deploy service
5. Kiểm tra logs để đảm bảo không có lỗi

## 📝 Checklist trước khi deploy

- [ ] Đã thêm tất cả Environment Variables
- [ ] Đã test kết nối MongoDB
- [ ] Đã kiểm tra CORS settings
- [ ] Đã xem xét giải pháp lưu trữ files (Cloud Storage)
- [ ] Đã test các API endpoints

## 🐛 Troubleshooting

### Lỗi "Cannot find module"

- Kiểm tra `package.json` có đầy đủ dependencies
- Đảm bảo `npm install` chạy thành công

### Lỗi "MongoDB connection failed"

- Kiểm tra `MONGO_URI` đúng format
- Kiểm tra IP whitelist trong MongoDB Atlas (nếu dùng)

### Lỗi "Static files not found"

- Kiểm tra đường dẫn trong `server.js`
- Đảm bảo thư mục `assets` tồn tại

### Files bị mất sau khi restart

- Đây là hành vi bình thường của Render
- Cần migrate sang Cloud Storage
