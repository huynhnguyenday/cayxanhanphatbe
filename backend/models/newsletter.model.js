import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    gmail: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId, // Tham chiếu tới Coupon
      ref: "Coupon", // Tên model Coupon
    },
    checkbox: {
      type: Boolean,
      default: false, // Giá trị mặc định là `false`
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
); // Tự động thêm `createdAt` và `updatedAt`

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

export default Newsletter;
