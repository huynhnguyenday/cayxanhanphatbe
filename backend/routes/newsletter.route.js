import express from "express";
import {
  getNewsletters,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
} from "../controllers/newsletter.controller.js";

const router = express.Router();

router.get("/", getNewsletters); // Lấy danh sách newsletters
router.post("/", createNewsletter); // Tạo newsletter mới
router.put("/:id", updateNewsletter); // Cập nhật newsletter theo ID
router.delete("/:id", deleteNewsletter); // Xóa newsletter theo ID

export default router;
