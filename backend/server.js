import express from "express";
import { connectDB } from "./config/db.js";
import productRoutes from "./routes/product.route.js";
import accountRoutes from "./routes/account.route.js";
import loginRoutes from "./routes/loginForm.route.js";
import categoryRoutes from "./routes/category.route.js";
import blogRoutes from "./routes/blog.route.js";
import mainPage from "./routes/mainPage.route.js";
import couponRoutes from "./routes/coupon.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import newsletterRoutes from "./routes/newsletter.route.js";
import vnpayRoutes from "./routes/vnpay.route.js";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { startKeepAlive } from "./utils/keepAlive.js";

dotenv.config();

const app = express();
app.use(cookieParser());
const corsOptions = {
  origin: [
    "https://cayxanhanphat.vercel.app",
    "http://localhost:5173",
    "https://cayxanhanphat.com",
    "https://www.cayxanhanphat.com",
  ],
  credentials: true,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/api/blogs", blogRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/mainPages", mainPage);
app.use("/api/auth", loginRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/newsletters", newsletterRoutes);
app.use("/api/vnpay", vnpayRoutes);

// Health check endpoint để keep-alive
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is alive",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (phải đặt cuối cùng)
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  connectDB();
  console.log(`Server started on port ${port}...`);

  // Bắt đầu keep-alive service
  // Chạy nếu có RENDER_EXTERNAL_URL (Render tự động set) hoặc BE_URL được cấu hình
  if (process.env.RENDER_EXTERNAL_URL || process.env.BE_URL) {
    startKeepAlive();
  } else {
    console.log(
      "⚠️  Keep-alive disabled (no BE_URL or RENDER_EXTERNAL_URL found)"
    );
    console.log("💡 Set BE_URL environment variable to enable keep-alive");
  }
});
