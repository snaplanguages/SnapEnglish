
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

// Gắn db lên window để các file khác dùng được
window.db = db; 

// 1. Hệ thống Toast thông báo (Đã tinh chỉnh màu sắc pastel hợp với giao diện)
window.showInGameToast = function(msg, isWelcome = true) {
    let toast = document.createElement("div");
    toast.innerText = msg;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: ${isWelcome ? '#88b04b' : '#bc4749'}; 
        color: white; padding: 15px 25px; border-radius: 12px; 
        font-weight: 700; font-family: 'Quicksand', sans-serif; 
        z-index: 99999; box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
        transform: translateY(100px); opacity: 0; transition: all 0.4s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transform = "translateY(0)"; toast.style.opacity = "1"; }, 100);
    setTimeout(() => { toast.style.transform = "translateY(100px)"; toast.style.opacity = "0"; }, 3500);
    setTimeout(() => { toast.remove(); }, 4000);
}

// 2. Kiểm tra đăng nhập (Tự động chạy ở mọi trang)
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.currentUserUid = user.uid;
        window.currentUserEmail = user.email;
        let name = user.email.split('@')[0];
        
        // Hiện thông báo chào mừng
        window.showInGameToast("✨ Chào " + name + "! Bạn đang học cùng SnapEnglish.");

        // Tự động đổi tên trên Header nếu có thẻ span trong .brand
        let brandSpan = document.querySelector('.brand span');
        if (brandSpan) brandSpan.innerText = "Chào " + name;

    } else {
        window.showInGameToast("⚠️ Bạn chưa đăng nhập! Kết quả học tập sẽ không được lưu.", false);
    }
});

// 3. HỆ THỐNG LƯU ĐIỂM ĐA NĂNG (Dùng cho Full Test và Từng Part)
window.luuDiemTOEIC = async function(correct, total, testTitle, skill, partName, isFullTest = false) {
    if (!window.currentUserUid) {
        window.showInGameToast("⚠️ Chưa đăng nhập! Điểm sẽ không được lưu.", false);
        return;
    }
    
    // Tính điểm: Nếu là Full Test (quy đổi thang 495), nếu là Part lẻ (quy ra tỷ lệ phần trăm 100%)
    let scoreConverted = isFullTest 
        ? Math.round(((correct / total) * 495) / 5) * 5 
        : Math.round((correct / total) * 100);

    let timestamp = Date.now();
    let docId = window.currentUserUid + "_toeic_" + timestamp;

    try {
        await setDoc(doc(window.db, "user_toeic_scores", docId), {
            email: window.currentUserEmail,
            skill: skill,               // 'Reading' hoặc 'Listening'
            testName: testTitle,        // Ví dụ: 'Test 1 - 2018'
            partName: partName,         // Ví dụ: 'Full Reading', 'Part 5', 'Part 1'
            correctQ: correct,
            totalQ: total,
            score: scoreConverted,      // Điểm quy đổi (495 hoặc 100%)
            isFullTest: isFullTest,     // true hoặc false
            date: new Date().toLocaleDateString('vi-VN'),
            timestamp: timestamp
        });
        window.showInGameToast(`☁️ Đã lưu điểm ${partName} lên hệ thống!`);
    } catch (e) {
        console.error("Lỗi khi lưu điểm:", e);
        window.showInGameToast("❌ Lỗi mạng: Không thể lưu điểm lúc này.", false);
    }
}
