import express from "express";
import multer from "multer";
import {
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
  getRelatedProducts,
} from "../controllers/product.controller.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

// Error handling middleware cho multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File quá lớn",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi upload file: ${err.message}`,
      });
    }
    // Lỗi từ fileFilter
    if (err.message === "Only JPEG, PNG, and JPG files are allowed!") {
      return res.status(400).json({
        success: false,
        message: "Chỉ chấp nhận file ảnh định dạng JPEG, PNG, JPG",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Lỗi khi upload file",
    });
  }
  next();
};

router.get("/", getProduct);
router.post("/", upload.single("image"), handleMulterError, createProduct);
router.put("/:id", upload.single("image"), handleMulterError, updateProduct);
router.delete("/:id", deleteProduct);
router.get("/relatedProducts/:id", getRelatedProducts);

export default router;
