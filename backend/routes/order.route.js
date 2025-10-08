import express from "express";
import {
  createOrder,
  getOrder,
  getOrderByToken,
  updateOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

router.get("/token", getOrderByToken);
router.get("/", getOrder);
router.post("/", createOrder);
router.put("/:id", updateOrder);

export default router;
