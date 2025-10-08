import express from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  updateProduct,
  getRelatedProducts,
} from "../controllers/product.controller.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.get("/", getProduct);
router.post("/", upload.single("image"), createProduct);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);
router.get("/relatedProducts/:id", getRelatedProducts);

export default router;
