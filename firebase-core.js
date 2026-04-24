// File: firebase-core.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBlTU4B563sSsTVbLai_je29l6eC8T-cm0",
    authDomain: "snapenglish-cb6e2.firebaseapp.com",
    projectId: "snapenglish-cb6e2",
    storageBucket: "snapenglish-cb6e2.firebasestorage.app",
    messagingSenderId: "373152038413",
    appId: "1:373152038413:web:19284622571390f8585f44"
};

// Khởi tạo Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Gắn các hàm dùng chung lên window để file HTML nào cũng gọi được
window.db = db;

// --- 1. HỆ THỐNG TOAST THÔNG BÁO ---
window.showInGameToast = function(msg, isSuccess = true) {
    let toast = document.createElement("div");
    toast.innerText = msg;
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; 
        background: ${isSuccess ? '#a3b492' : '#ff477e'}; 
        color: white; padding: 12px 25px; border-radius: 50px; 
        font-weight: bold; font-family: 'Quicksand', sans-serif; 
        z-index: 99999; box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
        transform: translateY(100px); opacity: 0; transition: all 0.5s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transform = "translateY(0)"; toast.style.opacity = "1"; }, 100);
    setTimeout(() => { toast.style.transform = "translateY(100px)"; toast.style.opacity = "0"; }, 3500);
    setTimeout(() => { toast.remove(); }, 4000);
}

// --- 2. NGƯỜI GÁC CỔNG (Kiểm tra đăng nhập) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.currentUserUid = user.uid;
        window.currentUserEmail = user.email;
        let name = user.email.split('@')[0];
        
        window.showInGameToast("✨ Chào " + name + "! Bạn đang học cùng SnapEnglish.");

        let brandSpan = document.querySelector('.brand span');
        if (brandSpan) brandSpan.innerText = "Chào " + name;
    } else {
        window.showInGameToast("⚠️ Bạn chưa đăng nhập! Kết quả học tập sẽ không được lưu.", false);
    }
});

// --- 3. HÀM LÕI ĐẨY DỮ LIỆU LÊN FIRESTORE (Tránh viết lại code nhiều lần) ---
async function pushScoreToTracker(dataPayload) {
    if (!window.currentUserUid) {
        window.showInGameToast("⚠️ Chưa đăng nhập! Điểm sẽ không được lưu lên Tracker.", false);
        return;
    }
    
    let timestamp = Date.now();
    let docId = window.currentUserUid + "_toeic_" + timestamp;
    
    // Bổ sung thông tin chung vào gói dữ liệu
    dataPayload.email = window.currentUserEmail;
    dataPayload.date = new Date().toLocaleDateString('vi-VN');
    dataPayload.timestamp = timestamp;

    try {
        await setDoc(doc(window.db, "user_toeic_scores", docId), dataPayload);
        window.showInGameToast(`☁️ Đã đồng bộ điểm ${dataPayload.skill} lên Tracker!`);
    } catch (e) {
        console.error("Lỗi khi lưu điểm:", e);
        window.showInGameToast("❌ Lỗi mạng: Không thể lưu điểm lúc này.", false);
    }
}

// --- 4. BỘ HÀM LƯU ĐIỂM DÀNH CHO CÁC FILE HTML GỌI ---

// Tính điểm TOEIC quy đổi (Thang 5 - 495)
function convertToToeicScale(correct, total) {
    if (correct === 0) return 5;
    let score = Math.round(((correct / total) * 495) / 5) * 5;
    if (score > 495) return 495;
    if (score < 5) return 5;
    return score;
}

// 4.1. Lưu điểm Full Reading (100 câu)
window.luuDiemTOEICReadingFull = function(correct, total, testTitle) {
    let scoreConverted = convertToToeicScale(correct, total);
    pushScoreToTracker({
        skill: "Reading",
        testName: testTitle,
        partName: "Full Reading",
        correctQ: correct,
        totalQ: total,
        score: scoreConverted
    });
};

// 4.2. Lưu điểm Full Listening (100 câu)
window.luuDiemTOEICListeningFull = function(correct, total, testTitle) {
    let scoreConverted = convertToToeicScale(correct, total);
    pushScoreToTracker({
        skill: "Listening",
        testName: testTitle,
        partName: "Full Listening",
        correctQ: correct,
        totalQ: total,
        score: scoreConverted
    });
};

// 4.3. Lưu điểm từng Part lẻ (Part 1 đến Part 7)
// Vì Part lẻ không quy đổi chuẩn ra 495 được, ta sẽ lưu số câu đúng và Tỷ lệ %
window.luuDiemTOEICPart = function(skill, partNumber, correct, total, testTitle) {
    let percentScore = Math.round((correct / total) * 100); // Lấy % làm điểm
    pushScoreToTracker({
        skill: skill, // Truyền vào "Reading" hoặc "Listening"
        testName: testTitle,
        partName: "Part " + partNumber,
        correctQ: correct,
        totalQ: total,
        score: percentScore // Lưu % cho Part lẻ
    });
};
