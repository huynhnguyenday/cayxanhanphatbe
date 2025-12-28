import axios from "axios";

/**
 * Hàm tự động ping server để giữ service luôn hoạt động
 * Render sẽ tắt service sau 30 phút không có request
 * Hàm này sẽ ping mỗi 14 phút để đảm bảo service không bị tắt
 */
export const startKeepAlive = () => {
  // Ưu tiên: RENDER_EXTERNAL_URL (Render tự động set) > BE_URL > localhost
  const serverUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BE_URL ||
    `http://localhost:${process.env.PORT || 5000}`;

  // Loại bỏ dấu / ở cuối nếu có
  const baseUrl = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
  const healthCheckUrl = `${baseUrl}/api/health`;

  console.log(`🔄 Keep-alive service started`);
  console.log(`📍 Server URL: ${baseUrl}`);
  console.log(`🏥 Health check: ${healthCheckUrl}`);
  console.log(`⏰ Ping interval: 14 minutes`);

  // Ping ngay khi khởi động (sau 1 giây để server sẵn sàng)
  setTimeout(() => {
    pingServer(healthCheckUrl);
  }, 1000);

  // Ping mỗi 14 phút (840000ms) - trước khi Render timeout 30 phút
  const intervalTime = 14 * 60 * 1000; // 14 phút

  const interval = setInterval(() => {
    pingServer(healthCheckUrl);
  }, intervalTime);

  // Trả về interval để có thể clear nếu cần
  return interval;
};

/**
 * Hàm ping server
 */
const pingServer = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 5000, // Timeout 5 giây
    });
    console.log(
      `✅ Keep-alive ping successful: ${new Date().toLocaleString()}`
    );
  } catch (error) {
    console.error(`❌ Keep-alive ping failed: ${error.message}`);
    // Không throw error để không làm crash server
  }
};
