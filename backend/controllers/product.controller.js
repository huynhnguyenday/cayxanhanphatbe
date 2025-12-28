import Product from "../models/product.model.js";
import mongoose from "mongoose";
import Category from "../models/category.model.js";
import { getCloudinaryUrl } from "../middleware/cloudinary.js";
export const getProduct = async (req, res) => {
  const { searchTerm } = req.query; // Get search term from query parameters

  try {
    // If there's a search term, filter products by name (case-insensitive search)
    const products = await Product.find({
      name: new RegExp(searchTerm, "i"), // 'i' for case-insensitive
    }).populate("category", "name");

    // Image đã là URL Cloudinary, không cần thêm prefix
    const productsWithFullImagePath = products.map((product) => ({
      ...product.toObject(),
      image: product.image, // URL Cloudinary đã đầy đủ
    }));

    // Return filtered products based on search term
    res.status(200).json({
      success: true,
      data: productsWithFullImagePath,
    });
  } catch (error) {
    console.error("Error in fetching products: ", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const createProduct = async (req, res) => {
  console.log("=== CREATE PRODUCT REQUEST ===");
  console.log("Body:", req.body);
  console.log("File:", req.file);
  console.log("Content-Type:", req.headers["content-type"]);

  const product = req.body;

  if (!product.name)
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Image is required" });
  }
  if (!product.sell_price)
    return res
      .status(400)
      .json({ success: false, message: "Sell price is required" });
  if (!product.price)
    return res
      .status(400)
      .json({ success: false, message: "Price is required" });
  if (!product.category)
    return res
      .status(400)
      .json({ success: false, message: "Category is required" });

  if (product.sell_price > product.price) {
    return res
      .status(400)
      .json({ success: false, message: "Sell price should not exceed price" });
  }

  try {
    const categoryExists = await Category.findById(product.category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${product.name}$`, "i") },
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm đã tồn tại",
      });
    }

    // Lấy URL từ Cloudinary
    const imageUrl = getCloudinaryUrl(req.file);

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Lỗi khi upload ảnh lên Cloudinary",
      });
    }

    const newProduct = new Product({
      ...product,
      image: imageUrl, // Lưu URL Cloudinary
    });

    await newProduct.save();
    const populatedProduct = await Product.findById(newProduct._id).populate(
      "category",
      "name"
    );
    const productWithFullImagePath = {
      ...populatedProduct.toObject(),
      image: populatedProduct.image, // URL Cloudinary đã đầy đủ
    };
    res.status(201).json({ success: true, data: productWithFullImagePath });
  } catch (error) {
    console.log("Error in creating product", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Product ID" });
  }

  try {
    // Kiểm tra nếu `category` tồn tại
    if (product.category) {
      const categoryExists = await Category.findById(product.category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
    }

    // Tìm sản phẩm trùng tên nhưng loại trừ sản phẩm hiện tại (dựa trên `_id`)
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${product.name}$`, "i") },
      _id: { $ne: id }, // Loại trừ sản phẩm đang cập nhật
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm đã tồn tại",
      });
    }

    // Lấy sản phẩm hiện tại để giữ lại ảnh cũ nếu không có ảnh mới
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let updatedImageUrl = currentProduct.image; // Giữ ảnh cũ nếu không có ảnh mới
    if (req.file) {
      // Lấy URL từ Cloudinary
      const imageUrl = getCloudinaryUrl(req.file);
      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Lỗi khi upload ảnh lên Cloudinary",
        });
      }
      updatedImageUrl = imageUrl; // Cập nhật ảnh mới nếu có
    }

    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...product, image: updatedImageUrl },
      { new: true }
    ).populate("category", "name");

    // URL Cloudinary đã đầy đủ
    const productWithFullImagePath = {
      ...updatedProduct.toObject(),
      image: updatedProduct.image || null,
    };

    res.status(200).json({ success: true, data: productWithFullImagePath });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Product ID" });
  }

  try {
    await Product.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error in deleting products: ", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Id không hợp lệ",
      });
    }

    // Lấy sản phẩm hiện tại
    const product = await Product.findById(id).populate("category", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    // Lấy các sản phẩm cùng danh mục, loại trừ sản phẩm hiện tại
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
    });

    // Image đã là URL Cloudinary, không cần thêm prefix
    const productsWithFullImagePath = relatedProducts.map((relatedProduct) => ({
      ...relatedProduct.toObject(),
      image: relatedProduct.image, // URL Cloudinary đã đầy đủ
    }));

    res.status(200).json({
      success: true,
      data: productsWithFullImagePath,
    });
  } catch (error) {
    console.error("Error fetching related products:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
