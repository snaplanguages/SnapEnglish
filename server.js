require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Lấy API key từ file .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tạo cổng kết nối cho Frontend gửi dữ liệu lên
app.post('/api/chat', async (req, res) => {
    try {
        // Nhận 3 thông tin từ HTML gửi lên
        const { userTranslation, expectedAnswer, originalVietnamese } = req.body;

        // Câu lệnh ra lệnh cho AI (Chuyển từ HTML sang đây cho bảo mật)
        const prompt = `
            Bạn là một giáo viên chấm bài dịch tiếng Anh.
            Câu gốc: "${originalVietnamese}"
            Câu mẫu chuẩn: "${expectedAnswer}"
            Câu học sinh dịch: "${userTranslation}"

            Hãy chấm điểm và nhận xét ngắn gọn. TRẢ VỀ DUY NHẤT một chuỗi JSON hợp lệ, không có markdown, với định dạng sau:
            {
                "accuracy": <số nguyên từ 0 đến 100 thể hiện độ chính xác>,
                "feedback": "<nhận xét bằng tiếng Việt, chỉ ra lỗi sai nếu có>"
            }
        `;

        // Gọi Gemini (Dùng bản 1.5 flash cho nhanh và ổn định)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        // Xử lý chuỗi JSON rác (nếu AI lỡ trả về kèm markdown ```json)
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            text = text.substring(jsonStartIndex, jsonEndIndex + 1);
        }

        // Trả kết quả về cho HTML
        res.json(JSON.parse(text));

    } catch (error) {
        console.error("Lỗi gọi API:", error);
        res.status(500).json({ error: "Lỗi từ Server: " + error.message });
    }
});

// Bật máy chủ ở cổng 3000
app.listen(3000, () => {
    console.log('🚀 Máy chủ Backend đang chạy tại: http://localhost:3000');
});