import express from "express";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  getCouponById,
  useCoupon,
  getValidCoupons,
  sendCoupons,
} from "../controllers/coupon.controller.js";

const router = express.Router();

// CRUD routes cho Coupon
router.get("/valid-coupons", getValidCoupons);
router.get("/", getAllCoupons); // Lấy danh sách coupon
router.get("/:id", getCouponById); // Lấy coupon theo code
router.post("/send-coupon", sendCoupons);
router.post("/", createCoupon); // Tạo coupon mới
router.put("/use", useCoupon);
router.put("/:id", updateCoupon); // Cập nhật coupon
router.delete("/:id", deleteCoupon); // Xóa coupon

export default router;
