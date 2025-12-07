import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { format } from "date-fns";
import crypto from "crypto";
import { sendInvoiceEmail } from "../services/emailService.js";

export const getOrder = async (req, res) => {
  try {
    const orders = await Order.find({ status: 1 })
      .populate({
        path: "cart.product",
        select: "name image",
      })
      .sort({ createdAt: -1 })
      .lean(); // Sử dụng lean để đảm bảo trả về plain objects

    const ordersWithFullImagePath = orders.map((order) => ({
      ...order,
      cart: order.cart.map((item) => ({
        ...item,
        product: {
          ...item.product,
          image: `https://cayxanhanphatbe.onrender.com/assets/${item.product.image}`,
        },
      })),
    }));

    res.status(200).json({
      message: "Lấy danh sách đơn hàng thành công!",
      data: ordersWithFullImagePath,
    });
  } catch (error) {
    console.log("Lỗi khi lấy danh sách đơn hàng: ", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const createOrder = async (req, res) => {
  try {
    const token = req.cookies.jwtToken; // Lấy token từ cookie
    console.log("Token: ", token);
    let accountId = null;

    // Kiểm tra token để lấy accountId nếu người dùng đăng nhập
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      accountId = decoded.id; // Lấy accountId từ token
      console.log("decoded: ", decoded);
    }

    const {
      name,
      address,
      number,
      email,
      note,
      paymentMethod,
      discount,
      finalPrice,
      cart,
      couponCode, // Thêm couponCode từ body
      status,
    } = req.body;

    if (!name || !address || !number || !email || !paymentMethod || !cart) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết!" });
    }

    console.log("Received order data:", req.body);

    // Xử lý cart và kiểm tra sản phẩm
    const updatedCart = await Promise.all(
      cart.map(async (item) => {
        const productId = new ObjectId(item.productId);
        const product = await Product.findById(productId);
        if (!product) {
          console.error(`Product with ID ${item.productId} not found`);
          throw new Error("Sản phẩm không tồn tại");
        }
        return {
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
          },
          quantity: item.quantity,
          totalPrice: item.quantity * item.price,
        };
      })
    );

    // Kiểm tra và cập nhật coupon (nếu có)
    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.trim() });

        if (!coupon) {
          return res.status(404).json({ message: "Coupon không tồn tại!" });
        }

        console.log(`Coupon found:`, {
          code: coupon.code,
          currentUsage: coupon.currentUsage,
          maxUsage: coupon.maxUsage,
        });

        if (coupon.currentUsage + 1 > coupon.maxUsage) {
          return res
            .status(400)
            .json({ message: "Coupon đã hết lượt sử dụng!" });
        }

        coupon.currentUsage += 1;
        await coupon.save();
      } catch (error) {
        console.error("Lỗi khi xử lý coupon:", error);
        return res.status(500).json({ message: "Lỗi khi xử lý coupon!" });
      }
    }

    // Tạo đơn hàng mới
    const newOrder = new Order({
      name,
      address,
      number,
      email,
      note,
      paymentMethod,
      discount: discount || 0,
      finalPrice,
      cart: updatedCart,
      accountId,
      status,
    });

    await newOrder.save();

    // Nếu thanh toán qua VNPay
    if (paymentMethod === "Online Payment") {
      const vnp_TmnCode = process.env.VNPAY_TMN_CODE; // Mã website VNPay
      const vnp_HashSecret = process.env.VNPAY_HASH_SECRET; // Key bảo mật
      const vnp_Url = process.env.VNPAY_URL; // URL cổng thanh toán VNPay
      const vnp_ReturnUrl = `${process.env.BE_URL}api/vnpay/vnpay-return`; // URL trả về khi thanh toán xong

      const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      const createDate = format(new Date(), "yyyyMMddHHmmss"); // Format: YYYYMMDDHHmmss
      const expireDate = format(
        new Date(new Date().getTime() + 15 * 60 * 1000),
        "yyyyMMddHHmmss"
      ); // 15 phút sau
      const orderId = newOrder._id.toString(); // ID đơn hàng làm mã giao dịch
      const amount = finalPrice * 100; // Đơn vị: VND (x100)
      const orderInfo = "string";
      const bankCode = "ncb"; // Mã ngân hàng demo

      const params = {
        vnp_Amount: Math.round(amount),
        vnp_Command: "pay",
        vnp_CreateDate: createDate,
        vnp_CurrCode: "VND",
        vnp_ExpireDate: expireDate,
        vnp_IpAddr: "127.0.0.1",
        vnp_Locale: "vn",
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: "other",
        vnp_ReturnUrl: vnp_ReturnUrl,
        vnp_TmnCode: vnp_TmnCode,
        vnp_TxnRef: orderId,
        vnp_Version: "2.1.0",
      };

      // Sắp xếp tham số theo thứ tự từ điển
      const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(String(params[key]))}`)
        .join("&");

      // Tính toán mã bảo mật (secure hash)
      const secureHash = crypto
        .createHmac("sha512", vnp_HashSecret)
        .update(sortedParams) // Dùng tham số đã sắp xếp, không cần stringify
        .digest("hex");

      const paymentUrl = `${vnp_Url}?${sortedParams}&vnp_SecureHash=${secureHash}`;

      // Trả về URL thanh toán
      return res.status(201).json({
        message: "Đơn hàng đã được tạo. Chuyển hướng đến thanh toán VNPay.",
        paymentUrl,
      });
    } else {
      newOrder.status = 1;
      await newOrder.save();
    }

    // Gửi email hóa đơn
    try {
      const invoiceDetails = {
        name,
        email,
        finalPrice: finalPrice,
        discount,
        cart: updatedCart,
      };

      await sendInvoiceEmail(email, invoiceDetails);
      console.log("Email hóa đơn đã được gửi thành công.");
    } catch (emailError) {
      console.error("Lỗi khi gửi email hóa đơn:", emailError);
    }

    res.status(201).json({
      message: "Đơn hàng đã được tạo thành công!",
      data: newOrder,
    });
  } catch (error) {
    console.error("Lỗi tạo đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server khi tạo đơn hàng!" });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, number, email, note, paymentMethod, status } =
      req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });
    }

    if (name) order.name = name;
    if (address) order.address = address;
    if (number) order.number = number;
    if (email) order.email = email;
    if (note) order.note = note;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (status) order.status = status;

    const updatedOrder = await order.save();
    res.status(200).json({
      message: "Cập nhật đơn hàng thành công!",
      data: updatedOrder,
    });
  } catch (error) {
    console.log("Lỗi khi cập nhật đơn hàng: ", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getOrderByToken = async (req, res) => {
  try {
    const token = req.cookies.jwtToken; // Lấy token từ cookie
    let accountId = null;

    // Kiểm tra token để lấy accountId nếu người dùng đăng nhập
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      accountId = decoded.id; // Lấy accountId từ token
    }

    if (!accountId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập!" });
    }

    // Tìm các đơn hàng của người dùng dựa trên accountId
    const orders = await Order.find({ accountId: accountId, status: 1 })
      .populate({
        path: "cart.product",
        select: "name image",
      })
      .sort({ createdAt: -1 })
      .lean(); // Sử dụng lean để đảm bảo trả về plain objects

    const ordersWithFullImagePath = orders.map((order) => ({
      ...order,
      cart: order.cart.map((item) => ({
        ...item,
        product: {
          ...item.product,
          image: `https://cayxanhanphatbe.onrender.com/assets/${item.product.image}`,
        },
      })),
    }));

    res.status(200).json({
      message: "Lấy danh sách đơn hàng thành công!",
      data: ordersWithFullImagePath,
    });
  } catch (error) {
    console.log("Lỗi khi lấy danh sách đơn hàng: ", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
