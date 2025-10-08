import Coupon from "../models/coupon.model.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
// Tạo coupon mới
export const createCoupon = async (req, res) => {
  try {
    const { code, discountValue, maxUsage } = req.body;

    // Kiểm tra xem mã coupon đã tồn tại chưa
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: "Mã giảm giá đã tồn tại!" });
    }

    // Tạo coupon mới
    const coupon = new Coupon({
      code,
      discountValue,
      maxUsage,
      currentUsage: 0, // Ban đầu số lần sử dụng là 0
    });

    await coupon.save();

    res.status(201).json({
      message: "Coupon đã được tạo thành công!",
      data: coupon,
    });
  } catch (error) {
    console.error("Lỗi tạo coupon:", error);
    res.status(500).json({ message: "Lỗi server khi tạo coupon!" });
  }
};

// Lấy tất cả các coupon
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find(); // Lấy tất cả coupons
    res.status(200).json({ data: coupons });
  } catch (error) {
    console.error("Lỗi lấy danh sách coupon:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách coupon!" });
  }
};

// Lấy coupon theo ID
export const getCouponById = async (req, res) => {
  try {
    const couponId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({ message: "Mã coupon không hợp lệ!" });
    }

    // Tìm coupon theo ObjectId
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon không tìm thấy!" });
    }

    // Trả về coupon
    res.status(200).json({ data: coupon });
  } catch (error) {
    console.error("Lỗi khi lấy coupon:", error);
    res.status(500).json({ message: "Lỗi server khi lấy coupon!" });
  }
};

// Lấy các coupon có currentUsage < maxUsage
export const getValidCoupons = async (req, res) => {
  try {
    // Lấy tất cả các coupon từ cơ sở dữ liệu
    const coupons = await Coupon.find();

    // Lọc các coupon hợp lệ (currentUsage < maxUsage)
    const validCoupons = coupons.filter(
      (coupon) => coupon.currentUsage < coupon.maxUsage
    );

    // Nếu không có coupon hợp lệ
    if (validCoupons.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không có coupon hợp lệ!" });
    }

    // Trả về danh sách coupon hợp lệ
    res.status(200).json({ success: true, data: validCoupons });
  } catch (error) {
    console.error("Lỗi khi lấy các coupon hợp lệ:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy các coupon hợp lệ!",
    });
  }
};

// Cập nhật coupon
export const updateCoupon = async (req, res) => {
  const { id } = req.params; // Lấy id từ params
  const { code, discountValue, maxUsage, currentUsage } = req.body; // Lấy thông tin từ body

  // Kiểm tra xem id có hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Coupon ID" });
  }

  // Kiểm tra giá trị hợp lệ của currentUsage và maxUsage
  if (currentUsage < 0 || maxUsage < 0 || currentUsage > maxUsage) {
    return res.status(400).json({
      success: false,
      message: "Giá trị currentUsage hoặc maxUsage không hợp lệ!",
    });
  }

  try {
    // Tìm coupon theo ID và cập nhật
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { code, discountValue, maxUsage, currentUsage },
      { new: true }
    );

    // Kiểm tra nếu coupon không tồn tại
    if (!updatedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon không tìm thấy" });
    }

    res.status(200).json({ success: true, data: updatedCoupon });
  } catch (error) {
    console.error("Lỗi khi cập nhật coupon: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Xóa coupon theo ID
export const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id; // Nhận couponId từ tham số trong URL

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({ message: "Mã coupon không hợp lệ!" });
    }

    // Xóa coupon theo ObjectId
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon không tìm thấy!" });
    }

    res.status(200).json({ message: "Coupon đã được xóa thành công!" });
  } catch (error) {
    console.error("Lỗi khi xóa coupon:", error);
    res.status(500).json({ message: "Lỗi server khi xóa coupon!" });
  }
};

// Sử dụng coupon
export const useCoupon = async (req, res) => {
  try {
    const { id } = req.body; // Nhận ObjectId từ body

    // Kiểm tra ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ!" });
    }

    // Tìm coupon theo ObjectId
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon không tìm thấy!" });
    }

    // Kiểm tra nếu coupon đã hết lượt sử dụng
    if (coupon.currentUsage >= coupon.maxUsage) {
      return res.status(400).json({ message: "Coupon đã hết lượt sử dụng!" });
    }

    // Tăng số lần sử dụng lên 1
    coupon.currentUsage += 1;
    await coupon.save();

    res.status(200).json({
      message: "Áp dụng coupon thành công!",
      data: coupon,
    });
  } catch (error) {
    console.error("Lỗi khi áp dụng coupon:", error);
    res.status(500).json({ message: "Lỗi server khi áp dụng coupon!" });
  }
};

// Endpoint để gửi coupon qua email
export const sendCoupons = async (req, res) => {
  const { emails, couponCode } = req.body;

  if (!emails || !emails.length || !couponCode) {
    return res.status(400).json({
      success: false,
      message: "Danh sách email hoặc mã coupon không hợp lệ.",
    });
  }

  try {
    // Logic gửi email với mã coupon
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const sendPromises = emails.map((email) =>
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "[cayxanhanphat] Nhận mã coupon giảm giá!",
        text: `Cảm ơn bạn đã quan tâm đến chương trình của chúng tôi. Bamos Coffee xin gửi bạn mã coupon: ${couponCode}`,
      })
    );

    await Promise.all(sendPromises);

    res.status(200).json({
      success: true,
      message: "Đã gửi coupon thành công.",
    });
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi gửi email.",
    });
  }
};
