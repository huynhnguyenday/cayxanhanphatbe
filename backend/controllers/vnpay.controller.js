import crypto from "crypto";
import Order from "../models/order.model.js";
import mongoose from "mongoose";
import { sendInvoiceEmail } from "../services/emailService.js";
import Product from "../models/product.model.js";

export const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const vnp_SecureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const queryString = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join("&");

    const secureHash = crypto
      .createHmac("sha512", process.env.VNPAY_HASH_SECRET)
      .update(queryString)
      .digest("hex");

    if (vnp_SecureHash !== secureHash) {
      return res
        .status(400)
        .json({ message: "Giao dịch không hợp lệ (Sai mã hash)." });
    }

    const vnp_ResponseCode = vnp_Params["vnp_ResponseCode"];
    if (vnp_ResponseCode !== "00") {
      return res.redirect("http://localhost:5173/order-fail");
    }

    const orderId = new mongoose.Types.ObjectId(vnp_Params["vnp_TxnRef"]);
    const paymentAmount = parseInt(vnp_Params["vnp_Amount"]) / 100;

    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      { status: 1, paymentMethod: "Online Payment", paymentAmount },
      { new: true }
    ).populate("cart.product", "name"); // Populate để lấy tên sản phẩm

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    // Lấy danh sách tên sản phẩm
    const productNames = order.cart.map((item) => item.product.name);

    // Gửi email hóa đơn (bao gồm tên sản phẩm)
    try {
      const invoiceDetails = {
        name: order.name,
        email: order.email,
        finalPrice: order.finalPrice,
        discount: order.discount,
        cart: order.cart,
        productNames, // Thêm danh sách tên sản phẩm vào hóa đơn
      };

      await sendInvoiceEmail(order.email, invoiceDetails);
    } catch (emailError) {
      console.error("Lỗi khi gửi email xác nhận thanh toán:", emailError);
    }

    res.redirect(`http://localhost:5173/order-success?orderId=${orderId}`);
  } catch (error) {
    console.error("Lỗi khi xử lý VNPay return:", error);
    res.status(500).json({ message: "Lỗi server khi xử lý VNPay return." });
  }
};
