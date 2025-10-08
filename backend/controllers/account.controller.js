import mongoose from "mongoose";
import Account from "../models/account.model.js";
import jwt from "jsonwebtoken";

export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find();
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    console.error("Error fetching accounts: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createAccount = async (req, res) => {
  const { username, password, numbers, gmail, role } = req.body;

  const missingFields = [];
  if (!username) missingFields.push("username");
  if (!password) missingFields.push("password");
  if (!numbers) missingFields.push("numbers");
  if (!gmail) missingFields.push("gmail");
  if (!role) missingFields.push("role");

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing fields: ${missingFields.join(", ")}`,
    });
  }

  const validRoles = ["admin", "staff", "customer"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
    });
  }

  try {
    // Kiểm tra username và gmail đã tồn tại chưa
    const existingGmail = await Account.findOne({ gmail });
    if (existingGmail) {
      return res.status(400).json({
        success: false,
        field: "gmail",
        message: "Gmail đã tồn tại",
      });
    }

    // Kiểm tra nếu `username` đã tồn tại
    const existingUsername = await Account.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        field: "username",
        message: "Tên đăng nhập đã tồn tại",
      });
    }

    // Tạo tài khoản mới
    const newAccount = new Account({
      username,
      password,
      gmail,
      numbers,
      role,
      isActive: 2,
    });
    const savedAccount = await newAccount.save();

    // Tạo JWT token
    const token = jwt.sign(
      {
        id: savedAccount._id,
        username: savedAccount.username,
        role: savedAccount.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      success: true,
      data: savedAccount,
      token,
    });
  } catch (error) {
    console.error("Error creating account:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createCustomerAccount = async (req, res) => {
  const { username, password, numbers, gmail } = req.body; // Bỏ role từ req.body

  const missingFields = [];
  if (!username) missingFields.push("username");
  if (!password) missingFields.push("password");
  if (!numbers) missingFields.push("numbers");
  if (!gmail) missingFields.push("gmail");

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing fields: ${missingFields.join(", ")}`,
    });
  }

  try {
    const existingGmail = await Account.findOne({ gmail });
    if (existingGmail) {
      return res.status(400).json({
        success: false,
        message: "Gmail đã tồn tại",
      });
    }

    // Kiểm tra nếu `username` đã tồn tại
    const existingUsername = await Account.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Tên đăng nhập đã tồn tại",
      });
    }
    // Tạo tài khoản mới với role mặc định là "customer"
    const newAccount = new Account({
      username,
      password,
      gmail,
      numbers,
      role: "customer",
      isActive: 2, // Đặt mặc định role là "customer"
    });
    const savedAccount = await newAccount.save();

    // Tạo JWT token
    const token = jwt.sign(
      {
        id: savedAccount._id,
        username: savedAccount.username,
        role: savedAccount.role,
      },
      process.env.JWT_SECRET, // Bí mật được lưu trong biến môi trường
      { expiresIn: "1h" } // Thời gian sống của token (1 giờ)
    );

    // Trả về thông tin tài khoản và token
    res.status(201).json({
      success: true,
      data: savedAccount,
      token, // Token được trả về
    });
  } catch (error) {
    console.error("Error creating customer account:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateAccount = async (req, res) => {
  const { id } = req.params;
  const account = req.body;

  // Kiểm tra ID hợp lệ
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid account ID" });
  }

  try {
    // Nếu có yêu cầu cập nhật Gmail, kiểm tra Gmail có tồn tại hay không
    if (account.gmail) {
      const existingGmail = await Account.findOne({ gmail: account.gmail });
      if (existingGmail && existingGmail._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: "Gmail đã tồn tại",
        });
      }
    }

    // Nếu có yêu cầu cập nhật Username, kiểm tra Username có tồn tại hay không
    if (account.username) {
      const existingUsername = await Account.findOne({
        username: account.username,
      });
      if (existingUsername && existingUsername._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: "Tên đăng nhập đã tồn tại",
        });
      }
    }

    // Cập nhật tài khoản
    const updatedAccount = await Account.findByIdAndUpdate(id, account, {
      new: true,
    });

    if (!updatedAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    // Trả về dữ liệu tài khoản đã cập nhật
    res.status(200).json({ success: true, data: updatedAccount });
  } catch (error) {
    console.error("Error updating account:", error); // Log lỗi để debug
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAccountsById = async (req, res) => {
  const { id } = req.params;

  // Kiểm tra xem ID có hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Id không hợp lệ",
    });
  }

  try {
    // Tìm tài khoản theo ID
    const account = await Account.findById(id);

    // Nếu không tìm thấy tài khoản
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản",
      });
    }

    // Trả về dữ liệu tài khoản
    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Lỗi khi tìm tài khoản: ", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const updateGmailAndNumbers = async (req, res) => {
  const { id } = req.params; // Lấy ID từ params
  const { gmail, numbers } = req.body; // Lấy dữ liệu từ body request

  // Kiểm tra ID có hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid account ID" });
  }

  // Kiểm tra xem có trường nào không được cung cấp
  if (!gmail && !numbers) {
    return res.status(400).json({
      success: false,
      message: "At least one of 'gmail' or 'numbers' is required",
    });
  }

  try {
    // Kiểm tra xem có gmail mới không và nó có trùng không
    if (gmail) {
      const existingGmail = await Account.findOne({ gmail });
      if (existingGmail && existingGmail._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: "Gmail already in use by another account",
        });
      }
    }

    // Kiểm tra xem có số điện thoại mới không và nó có trùng không
    if (numbers) {
      const existingNumbers = await Account.findOne({ numbers });
      if (existingNumbers && existingNumbers._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use by another account",
        });
      }
    }

    // Cập nhật thông tin chỉ khi có dữ liệu hợp lệ
    const updatedAccount = await Account.findByIdAndUpdate(
      id,
      { gmail, numbers },
      { new: true } // Trả về dữ liệu sau khi cập nhật
    );

    // Kiểm tra xem tài khoản có tồn tại không
    if (!updatedAccount) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      data: updatedAccount,
      message: "Account updated successfully",
    });
  } catch (error) {
    console.error("Error updating account:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
