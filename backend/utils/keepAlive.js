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

  // Ping ngay lập tức (đã đợi đủ thời gian ở server.js)
  console.log(`🔍 Starting first keep-alive ping...`);
  pingServer(healthCheckUrl);

  // Ping mỗi 14 phút (840000ms) - trước khi Render timeout 30 phút
  const intervalTime = 14 * 60 * 1000; // 14 phút

  const interval = setInterval(() => {
    pingServer(healthCheckUrl);
  }, intervalTime);

  // Trả về interval để có thể clear nếu cần
  return interval;
};

/**
 * Hàm ping server với retry logic
 */
const pingServer = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 10000, // Timeout 10 giây
        validateStatus: (status) => status < 500, // Chấp nhận status < 500
      });
      
      if (response.status === 200) {
        console.log(
          `✅ Keep-alive ping successful: ${new Date().toLocaleString()}`
        );
        return; // Thành công, thoát khỏi hàm
      } else {
        console.warn(
          `⚠️  Keep-alive ping returned status ${response.status}, retrying...`
        );
      }
    } catch (error) {
      const errorMsg = error.response 
        ? `Status ${error.response.status}: ${error.response.statusText}`
        : error.message;
      
      if (i < retries - 1) {
        console.warn(
          `⚠️  Keep-alive ping attempt ${i + 1}/${retries} failed: ${errorMsg}, retrying in 2s...`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Đợi 2 giây trước khi retry
      } else {
        console.error(
          `❌ Keep-alive ping failed after ${retries} attempts: ${errorMsg}`
        );
      }
    }
  }
};
