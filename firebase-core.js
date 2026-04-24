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

// Khởi tạo
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Gắn các hàm dùng chung lên window để file HTML nào cũng gọi được
window.db = db; // Cho phép các file khác dùng kho dữ liệu

// 1. Hệ thống Toast thông báo (Dùng chung cho toàn web)
window.showInGameToast = function(msg, isWelcome = true) {
    let toast = document.createElement("div");
    toast.innerText = msg;
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; 
        background: ${isWelcome ? '#a3b492' : '#ff477e'}; 
        color: white; padding: 12px 25px; border-radius: 50px; 
        font-weight: bold; font-family: 'Nunito', sans-serif; 
        z-index: 99999; box-shadow: 0 8px 25px rgba(0,0,0,0.1); 
        transform: translateY(100px); opacity: 0; transition: all 0.5s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transform = "translateY(0)"; toast.style.opacity = "1"; }, 100);
    setTimeout(() => { toast.style.transform = "translateY(100px)"; toast.style.opacity = "0"; }, 3500);
    setTimeout(() => { toast.remove(); }, 4000);
}

// 2. NGƯỜI GÁC CỔNG (Tự động chạy ở mọi trang)
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.currentUserUid = user.uid;
        window.currentUserEmail = user.email;
        let name = user.email.split('@')[0];
        
        // Hiện thông báo góc trái
        window.showInGameToast("✨ Chào " + name + "! Bạn đang học cùng SnapEnglish.");

        // Nếu trang có phần hiển thị tên thì tự động đổi tên
        let brandSpan = document.querySelector('.brand span');
        if (brandSpan) brandSpan.innerText = "Chào " + name;

    } else {
        window.showInGameToast("⚠️ Bạn chưa đăng nhập! Kết quả học tập sẽ không được lưu.", false);
    }
});
