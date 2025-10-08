import mongoose from "mongoose";
import Newsletter from "../models/newsletter.model.js";

// Lấy danh sách newsletter
export const getNewsletters = async (req, res) => {
  try {
    const newsletters = await Newsletter.find({ status: false }).populate(
      "coupon"
    );
    res.status(200).json({ success: true, data: newsletters });
  } catch (error) {
    console.error("Error in fetching newsletters:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Tạo mới một newsletter
export const createNewsletter = async (req, res) => {
  const { gmail, coupon, checkbox, status } = req.body;

  if (!gmail) {
    return res
      .status(400)
      .json({ success: false, message: "Gmail are required" });
  }

  try {
    const newNewsletter = new Newsletter({ gmail, coupon, checkbox, status });
    await newNewsletter.save();

    res.status(201).json({ success: true, data: newNewsletter });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Duplicate entry detected" });
    }
    console.error("Error in creating newsletter:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Cập nhật một newsletter
export const updateNewsletter = async (req, res) => {
  const { id } = req.params;
  const { gmail, coupon, checkbox, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Newsletter ID" });
  }

  try {
    const updatedNewsletter = await Newsletter.findByIdAndUpdate(
      id,
      { gmail, coupon, checkbox, status },
      { new: true }
    );

    if (!updatedNewsletter) {
      return res.status(404).json({
        success: false,
        message: "Newsletter not found",
      });
    }

    res.status(200).json({ success: true, data: updatedNewsletter });
  } catch (error) {
    console.error("Error in updating newsletter:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Xóa một newsletter
export const deleteNewsletter = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Newsletter ID" });
  }

  try {
    const deletedNewsletter = await Newsletter.findByIdAndDelete(id);

    if (!deletedNewsletter) {
      return res.status(404).json({
        success: false,
        message: "Newsletter not found",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Newsletter deleted successfully" });
  } catch (error) {
    console.error("Error in deleting newsletter:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
