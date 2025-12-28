import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Cấu hình Cloudinary - chỉ dùng environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Kiểm tra các biến môi trường bắt buộc
if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Lỗi: Thiếu biến môi trường Cloudinary!");
  console.error(
    "Cần cấu hình: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
  );
  throw new Error("Cloudinary environment variables are required");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Kiểm tra file ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and JPG files are allowed!"), false);
  }
};

// Cấu hình Cloudinary Storage cho Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "cayxanhanphat", // Thư mục trên Cloudinary
      allowed_formats: ["jpg", "jpeg", "png"],
      transformation: [
        {
          width: 1000,
          height: 1000,
          crop: "limit", // Giữ tỷ lệ, không crop
          quality: "auto", // Tự động tối ưu chất lượng
        },
      ],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`, // Tên file unique
    };
  },
});

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Helper function để lấy URL từ Cloudinary response
export const getCloudinaryUrl = (file) => {
  if (!file) return null;
  // CloudinaryStorage trả về file với thuộc tính path chứa URL đầy đủ
  if (file.path) return file.path;
  if (file.url) return file.url;
  // Nếu có secure_url (từ Cloudinary response)
  if (file.secure_url) return file.secure_url;
  // Nếu là public_id, tạo URL
  if (file.public_id) {
    return cloudinary.url(file.public_id, {
      secure: true,
    });
  }
  return null;
};
