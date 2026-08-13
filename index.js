const API_URL =
    "https://tribal-rhythm-backend.onrender.com";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";


import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


import {
    getDatabase,
    ref as dbRef,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {

    apiKey: "AIzaSyDeXDwM5_DASJCYqefJbQ-u_B-g1MTPjXM",

    authDomain:
        "tribalrhythm-486bd.firebaseapp.com",

    projectId:
        "tribalrhythm-486bd",

    storageBucket:
        "tribalrhythm-486bd.firebasestorage.app",

    messagingSenderId:
        "566528037279",

    appId:
        "1:566528037279:web:b475312ea2c721d4fd2daa",

    databaseURL:
        "https://tribalrhythm-486bd-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);

const storage =
    getStorage(app);

const rtdb =
    getDatabase(app);

const auth =
    getAuth(app);


document.addEventListener("DOMContentLoaded", () => {

    const uploadButton =
        document.getElementById("heroUploadBtn");

    if (!uploadButton) return;

    uploadButton.addEventListener("click", (event) => {

        event.preventDefault();

        // ================= LOGGED-IN USER =================

        if (auth.currentUser) {

            document.getElementById("upload")?.scrollIntoView({
                behavior: "smooth"
            });

            return;
        }


        // ================= LOGIN / REGISTER POPUP =================

        Swal.fire({

            icon: "info",

            title: `
                <div style="
                    font-size:24px;
                    font-weight:700;
                    color:#d4af37;
                    margin-bottom:5px;
                ">
                    📤 Upload Your Talent
                </div>
            `,

            html: `
                <div style="
                    font-size:15px;
                    line-height:1.6;
                    color:#555;
                    margin-top:5px;
                ">

                    <p style="margin-bottom:12px;">
                        Upload your <b>Dance, Song & Cultural Video</b>
                        on Tribal Rhythm.
                    </p>

                    <div style="
                        background:linear-gradient(
                            135deg,
                            #fff8dc,
                            #fff
                        );
                        border:1px solid #d4af37;
                        border-radius:12px;
                        padding:12px;
                        margin:10px 0;
                    ">

                        <div style="
                            font-weight:600;
                            color:#333;
                            margin-bottom:5px;
                        ">
                            🔐 Login required
                        </div>

                        <small style="color:#666;">
                            Please login or register before
                            uploading your video.
                        </small>

                    </div>

                </div>
            `,

            showCancelButton: true,
            showDenyButton: true,

            confirmButtonText: "🆕 Register",
            denyButtonText: "🔐 Login",
            cancelButtonText: "❌ Cancel",

            confirmButtonColor: "#d4af37",
            denyButtonColor: "#198754",
            cancelButtonColor: "#6c757d",

            reverseButtons: true,

            allowOutsideClick: true,
            allowEscapeKey: true,

            customClass: {

                popup: "tribal-upload-popup",

                title: "tribal-upload-title",

                confirmButton: "tribal-register-btn",

                denyButton: "tribal-login-btn",

                cancelButton: "tribal-cancel-btn"

            }

        }).then((result) => {

            // ================= REGISTER =================

            if (result.isConfirmed) {

                window.location.href =
                    "login.html";

            }


            // ================= LOGIN =================

            if (result.isDenied) {

                window.location.href =
                    "login.html";

            }

        });

    });

});



window.db = db;
window.storage = storage;
window.rtdb = rtdb;
window.auth = auth;

let otpTimerInterval;

let otpTimeLeft = 300;

let resendCooldown = 60;

let resendAttempts = 0;

const MAX_RESEND_ATTEMPTS = 5;

let lastResendTime = 0;


// ================= SEND OTP =================
window.sendOTP = async function () {

    const sendBtn =
        document.getElementById("sendOtpBtn");

    // ================= GET USER DETAILS =================

    const ticketQuantity =
        document.getElementById("ticketQuantity").value;

    const name =
        document.getElementById("ticketName")
            .value
            .trim();

    const mobile =
        document.getElementById("ticketPhone")
            .value
            .trim();

    const email =
        document.getElementById("ticketEmail")
            .value
            .trim()
            .toLowerCase();


    // ================= TICKET QUANTITY =================

    if (!ticketQuantity) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Select Number of Tickets First",
            "warning"
        );

        document
            .getElementById("ticketQuantity")
            .focus();

        return;
    }


    // ================= FULL NAME =================

    if (!name) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Enter Your Full Name",
            "warning"
        );

        document
            .getElementById("ticketName")
            .focus();

        return;
    }


    if (name.length < 3) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Enter a Valid Full Name",
            "warning"
        );

        document
            .getElementById("ticketName")
            .focus();

        return;
    }


    // ================= MOBILE =================

    if (!mobile) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Enter Your Mobile Number",
            "warning"
        );

        document
            .getElementById("ticketPhone")
            .focus();

        return;
    }


    if (!/^[6-9]\d{9}$/.test(mobile)) {

        Swal.fire(
            "Tribal Rhythm",
            "Enter Valid 10 Digit Mobile Number",
            "warning"
        );

        document
            .getElementById("ticketPhone")
            .focus();

        return;
    }


    // ================= EMAIL =================

    if (!email) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Enter Your Email Address",
            "warning"
        );

        document
            .getElementById("ticketEmail")
            .focus();

        return;
    }


    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Enter a Valid Email Address",
            "warning"
        );

        document
            .getElementById("ticketEmail")
            .focus();

        return;
    }


    // ================= RATE LIMIT CHECK =================

    const now = Date.now();

    if (
        lastResendTime !== 0 &&
        now - lastResendTime <
        resendCooldown * 1000
    ) {

        const remaining = Math.ceil(
            (
                resendCooldown * 1000 -
                (now - lastResendTime)
            ) / 1000
        );

        Swal.fire(
            "Please Wait",
            `Please wait ${remaining} seconds before requesting another OTP.`,
            "warning"
        );

        return;
    }


    // ================= RESET PREVIOUS VERIFICATION =================

    localStorage.removeItem("ticketVerified");
    localStorage.removeItem("ticketEmail");


    // ================= DISABLE BUTTON =================
    // Validation complete hone ke BAAD hi disable hoga

    sendBtn.disabled = true;
    sendBtn.innerText = "Sending OTP...";


    try {

        // ================= SEND OTP TO BACKEND =================

        const response = await fetch(
            "https://tribal-rhythm-backend.onrender.com/send-otp",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    mobile
                })
            }
        );


        // ================= RESPONSE CHECK =================

        if (!response.ok) {
            throw new Error(
                `Server Error: ${response.status}`
            );
        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "OTP send failed"
            );
        }


        // ================= OTP SENT SUCCESSFULLY =================

        console.log(
            "Email OTP Sent Successfully ✅"
        );


        // ================= UPDATE RATE LIMIT =================

        lastResendTime = Date.now();


        // ================= SHOW OTP SECTION =================

        document
            .getElementById("otpSection")
            .style.display = "block";


        // ================= RESET OTP UI =================

        document
            .getElementById("ticketOTP")
            .value = "";

        document
            .getElementById("ticketOTP")
            .style.display = "block";


        document
            .getElementById("verifyOtpBtn")
            .style.display = "block";


        document
            .getElementById("otpTimer")
            .style.display = "inline";


        document
            .getElementById("otpVerifiedMessage")
            .style.display = "none";


        // ================= START OTP TIMER =================

        startOtpTimer();


        // ================= MASK EMAIL =================

        const emailParts =
            email.split("@");

        const username =
            emailParts[0];

        const domain =
            emailParts[1];

        const maskedEmail =
            "******" +
            username.slice(-4) +
            "@" +
            domain;


        // ================= SUCCESS ALERT =================

        Swal.fire({

            icon: "success",

            title: "OTP Sent Successfully",

            html: `
                <b>Your OTP has been sent to your Email ID.</b>
                <br><br>

                <span style="
                    color:#0d6efd;
                    font-size:16px;
                    font-weight:bold;
                ">
                    ${maskedEmail}
                </span>
            `,

            confirmButtonText: "OK"

        });


    } catch (err) {

        console.error(
            "Send OTP Error:",
            err
        );


        Swal.fire(
            "Tribal Rhythm",
            err.message === "Failed to fetch"
                ? "Unable to connect to server. Please try again."
                : "Unable to send OTP. Please try again.",
            "error"
        );


    } finally {

        // ================= ENABLE BUTTON AGAIN =================

        sendBtn.disabled = false;

        sendBtn.innerText =
            "Send Email OTP";
    }

};


// ================= OTP TIMER =================

function startOtpTimer() {

    clearInterval(otpTimerInterval);

    otpTimeLeft = 300;

    const timer =
        document.getElementById("otpTimer");

    const resendLink =
        document.getElementById("resendOtpLink");


    resendLink.style.display = "none";

    timer.style.display = "inline";


    otpTimerInterval = setInterval(() => {

        let minutes =
            Math.floor(otpTimeLeft / 60);

        let seconds =
            otpTimeLeft % 60;


        seconds =
            seconds < 10
                ? "0" + seconds
                : seconds;


        timer.innerText =
            `OTP valid for ${minutes}:${seconds}`;


        otpTimeLeft--;


        if (otpTimeLeft < 0) {

            clearInterval(otpTimerInterval);


            timer.innerText =
                "OTP expired";


            resendLink.style.display =
                "inline";

        }

    }, 1000);

}

// ================= RESEND OTP =================

window.resendOTP = async function () {

    // ================= USER DETAILS =================

    const name =
        document
            .getElementById("ticketName")
            .value
            .trim();

    const mobile =
        document
            .getElementById("ticketPhone")
            .value
            .trim();

    const email =
        document
            .getElementById("ticketEmail")
            .value
            .trim()
            .toLowerCase();


    // ================= NAME VALIDATION =================

    if (!name || name.length < 3) {

        Swal.fire(
            "Tribal Rhythm",
            "Please enter a valid Full Name.",
            "warning"
        );

        return;
    }


    // ================= MOBILE VALIDATION =================

    if (!/^[6-9]\d{9}$/.test(mobile)) {

        Swal.fire(
            "Tribal Rhythm",
            "Please enter a valid 10 digit Mobile Number.",
            "warning"
        );

        return;
    }


    // ================= EMAIL VALIDATION =================

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        Swal.fire(
            "Tribal Rhythm",
            "Please enter a valid Email Address.",
            "warning"
        );

        return;
    }


    // ================= CLEAR OLD OTP =================

    localStorage.removeItem("emailOTP");
    localStorage.removeItem("otpExpiry");

    document
        .getElementById("ticketOTP")
        .value = "";

    document
        .getElementById("resendOtpLink")
        .style.display = "none";


    // ================= NEW EXPIRY =================

    localStorage.setItem(
        "otpExpiry",
        Date.now() + (5 * 60 * 1000)
    );


    // ================= SEND NEW OTP =================

    try {

        const response = await fetch(
            "https://tribal-rhythm-backend.onrender.com/send-otp",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    mobile
                })
            }
        );


        const result = await response.json();

        console.log("RESEND OTP RESPONSE:", result);


        if (!response.ok || !result.success) {

            Swal.fire(
                "Tribal Rhythm",
                result.message || "Failed to send OTP.",
                "error"
            );

            return;
        }


        Swal.fire(
            "Tribal Rhythm",
            "New OTP sent successfully.",
            "success"
        );


    } catch (error) {

        console.error("RESEND OTP ERROR:", error);

        Swal.fire(
            "Tribal Rhythm",
            "Unable to send OTP. Please try again.",
            "error"
        );

    }

};

// ================= VERIFY OTP =================
window.verifyOTP = async function () {
    const email = document.getElementById("ticketEmail")
        .value
        .trim()
        .toLowerCase();

    const otp = document.getElementById("ticketOTP")
        .value
        .trim();

    if (otp.length !== 6) {
        Swal.fire(
            "Tribal Rhythm",
            "Enter 6 digit OTP",
            "warning"
        );
        return;
    }

    try {
        const res = await fetch(
            "https://tribal-rhythm-backend.onrender.com/verify-otp",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    otp
                })
            }
        );


        const data = await res.json();


        if (!data.success) {

            Swal.fire(
                "Invalid OTP",
                "Please enter correct OTP",
                "error"
            );

            return;
        }
        localStorage.setItem("ticketId", data.ticketId);


        localStorage.setItem(
            "ticketVerified",
            "true"
        );


        localStorage.setItem(
            "ticketEmail",
            email
        );


        clearInterval(otpTimerInterval);


        document.getElementById("ticketOTP")
            .style.display = "none";


        document.getElementById("verifyOtpBtn")
            .style.display = "none";


        document.getElementById("otpTimer")
            .style.display = "none";


        document.getElementById("resendOtpLink")
            .style.display = "none";


        document.getElementById("otpVerifiedMessage")
            .style.display = "block";


        Swal.fire(
            "Success",
            "OTP Verified Successfully",
            "success"
        );


    }
    catch (err) {

        console.log(err);

        Swal.fire(
            "Error",
            "OTP verification failed",
            "error"
        );

    }

};


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


async function loadNews() {

    try {

        const snapshot =
            await getDocs(collection(db, "news"));

        let newsHTML = "";

        snapshot.forEach(doc => {

            const data = doc.data();

            newsHTML += `
                <span class="news-item">
                    🔥 ${escapeHTML(data.text || "")}
                </span>
            `;

        });

        document.getElementById("newsMarquee").innerHTML =
            newsHTML ||
            `
                <span class="news-item">
                    🛕 Welcome to Tribal Rhythm 2026 |
                    📍 Padia, Rairangpur Block |
                    📅 16 July 2026 – 24 July 2026 |
                    🎭 Traditional Dance • Music • Culture • Food • Exhibition |
                    🙏 Jai Jagannath 🙏
                </span>
            `;

    } catch (error) {

        console.error("News Error:", error);

        document.getElementById("newsMarquee").innerHTML =
            "Failed To Load News";

    }
}


// load up coming section

function getProgramDate(dateValue, timeValue = "") {
    if (!dateValue) return null;

    // Firestore Timestamp
    if (typeof dateValue.toDate === "function") {
        return dateValue.toDate();
    }

    // HTML datetime-local / ISO date
    const value = String(dateValue).includes("T")
        ? String(dateValue)
        : `${dateValue}T${timeValue || "00:00"}`;

    const result = new Date(value);
    return Number.isNaN(result.getTime()) ? null : result;
}

function formatProgramDate(date) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: true
    }).format(date);
}

async function loadUpcoming() {
    const container = document.querySelector(".card-container");
    if (!container) return;

    try {
        const snap = await getDocs(collection(db, "upcoming"));

        if (snap.empty) {
            container.innerHTML =
                `<p style="color:yellow;text-align:center;">
                    No Upcoming Programs Found
                </p>`;
            return;
        }

        let html = "";

        snap.forEach((doc) => {
            const data = doc.data();

            // Firestore fields: date, time, endDate, endTime
            const startDate = getProgramDate(data.date, data.time);
            const endDate = getProgramDate(data.endDate, data.endTime);

            const startMs = startDate ? startDate.getTime() : "";
            const endMs = endDate ? endDate.getTime() : "";

            html += `
                <div class="col-md-4 mb-4">
                    <div class="gold-card">
                        <h4 style="color:gold;">
                            ${escapeHTML(data.title || "No Title")}
                        </h4>

                        <p>📍 ${escapeHTML(data.place || "No Place")}</p>

                        <p>
                            📅 <b>Date & Time:</b><br>
                            ${startDate ? formatProgramDate(startDate) : "Date not announced"}
                        </p>

                        <div
                            class="countdown"
                            data-start="${startMs}"
                            data-end="${endMs}">
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        updateCountdown();

    } catch (error) {
        console.error("Upcoming Error:", error);
        container.innerHTML =
            `<p style="color:red;text-align:center;">
                ❌ Firestore Error
            </p>`;
    }
}

window.loadUpcoming = loadUpcoming;

function updateCountdown() {
    document.querySelectorAll(".countdown").forEach((card) => {
        const startTime = Number(card.dataset.start);
        const endTime = Number(card.dataset.end);
        const now = Date.now();

        if (!startTime) {
            card.innerHTML = "⚠️ Date not available";
            return;
        }

        if (now < startTime) {
            let diff = startTime - now;

            const days = Math.floor(diff / 86400000);
            diff %= 86400000;
            const hours = Math.floor(diff / 3600000);
            diff %= 3600000;
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            card.innerHTML =
                `⏳ Starts in: <b>${days}d ${hours}h ${minutes}m ${seconds}s</b>`;
            return;
        }

        if (!endTime || now <= endTime) {
            card.innerHTML = "🎉 Program is live now";
            return;
        }

        card.innerHTML = "❌ Program Ended";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadUpcoming();
    updateCountdown();
    setInterval(updateCountdown, 1000);
});


/* ================= LIVE ================= */
window.openLive = function (url) {
    document.getElementById("liveFrame").src = url;
    document.getElementById("liveModal").style.display = "flex";
};

window.closeLive = function () {
    document.getElementById("liveModal").style.display = "none";
    document.getElementById("liveFrame").src = "";
};


window.openExternal = function (url) {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (newWindow) {
        newWindow.opener = null;
    }
};


/* ================= CHAT ================= */
window.sendChat = function () {
    let input = document.getElementById("chatInput");
    let msg = document.getElementById("chatMessages");

    if (!input.value.trim()) return;

    msg.innerHTML += "<br>👤 " + input.value;
    input.value = "";
};


/* ================= YOUTUBE UPLOAD ================= */
window.uploadYouTube = async function () {

    let t = document.getElementById("ytTitle").value.trim();
    let l = document.getElementById("ytLink").value.trim();

    if (!t || !l) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please fill all details",
            icon: "warning"
        });
        return;
    }

    try {
        await addDoc(collection(db, "youtube"), {
            title: t,
            link: l,
            createdAt: new Date()
        });

        Swal.fire({
            title: "Tribal Rhythm",
            text: "YouTube Video Uploaded Successfully",
            icon: "success"
        });

    } catch (error) {
        console.error(error);

        Swal.fire({
            title: "Tribal Rhythm",
            text: "Upload Failed",
            icon: "error"
        });
    }
};



/* ================= FIREBASE VIDEO UPLOAD ================= */

window.uploadFirebase = async function () {

    try {

        let file = document.getElementById("fbFile").files[0];
        let title = document.getElementById("fbTitle").value.trim();

        // ================= FILE CHECK =================

        if (!file) {

            Swal.fire(
                "Tribal Rhythm",
                "Select Video First",
                "warning"
            );

            return;
        }


        // ================= VIDEO TYPE CHECK =================

        if (!file.type.startsWith("video/")) {

            Swal.fire(
                "Invalid File",
                "Please select a video file only.",
                "error"
            );

            document.getElementById("fbFile").value = "";

            return;
        }


        // ================= VIDEO SIZE LIMIT =================

        const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

        if (file.size > MAX_VIDEO_SIZE) {

            Swal.fire({
                title: "Video Too Large",

                html: `
                    <div style="color:red;font-weight:bold;">
                        ⚠️ Maximum video upload size is 100 MB.
                        <br><br>
                        Your selected video is
                        ${(file.size / (1024 * 1024)).toFixed(2)} MB.
                    </div>
                `,

                icon: "error",

                confirmButtonText: "Choose Another Video"
            });

            document.getElementById("fbFile").value = "";

            return;
        }


        // ================= UPLOAD START =================

        Swal.fire({
            title: "Uploading Video...",
            text: "Please wait. Do not close this page.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });


        // ================= FIREBASE STORAGE =================

        const fileRef = storageRef(
            storage,
            "videos/" + Date.now() + "_" + file.name
        );


        await uploadBytes(fileRef, file);


        // ================= GET DOWNLOAD URL =================

        let url = await getDownloadURL(fileRef);


        // ================= SAVE VIDEO DATA =================

        await addDoc(collection(db, "videos"), {

            title: title || "Untitled",

            videoUrl: url,

            fileName: file.name,

            fileSize: file.size,

            fileType: file.type,

            createdAt: new Date()

        });


        // ================= SUCCESS =================

        Swal.fire({
            title: "Upload Successful 🎉",

            html: `
                <b>Video uploaded successfully.</b>
                <br><br>
                File Size:
                ${(file.size / (1024 * 1024)).toFixed(2)} MB
            `,

            icon: "success"
        });


        // Clear form

        document.getElementById("fbFile").value = "";
        document.getElementById("fbTitle").value = "";


    } catch (error) {

        console.error(
            "Firebase Video Upload Error:",
            error
        );


        Swal.fire({
            title: "Upload Failed",

            text: error.message ||
                "Unable to upload video.",

            icon: "error"
        });

    }

};


window.watchYouTube = function () {

    let link = document.getElementById("ytLink").value.trim();

    if (!link) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Enter YouTube Link First",
            icon: "warning"
        });
        return;
    }

    let videoId = "";

    if (link.includes("watch?v=")) {
        videoId = link.split("v=")[1].split("&")[0];
    } else if (link.includes("youtu.be/")) {
        videoId = link.split("youtu.be/")[1];
    }

    if (!videoId) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Invalid YouTube Link",
            icon: "error"
        });
        return;
    }

    openLive(`https://www.youtube.com/embed/${videoId}`);
};



window.watchFirebase = async function () {
    try {
        const snap = await getDocs(collection(db, "videos"));

        let lastVideo = null;

        snap.forEach(doc => {
            lastVideo = doc.data().videoUrl;
        });

        if (!lastVideo) {
            Swal.fire({
                title: "Tribal Rhythm",
                text: " Video  Not Found I",
                icon: "warning"
            });
            return;
        }

        openLive(lastVideo);

    } catch (error) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Failed To Load Video",
            icon: "error"
        });
        console.error(error);
    }
};



/* ================= SAVE TICKET ================= */
window.saveTicket = function () {
    const name = prompt("Enter Name:");
    const event = "Karam Puja";

    if (!name) return;

    push(dbRef(rtdb, "tickets"), {
        name,
        event,
        time: Date.now()
    });

    Swal.fire({
        title: "Tribal Rhythm",
        text: "Ticket Booked Successfully!",
        icon: "success"
    });
};


/* ================= GO TO TICKET ================= */
window.goToTicket = function () {

    // ================= USER DETAILS =================
    const name = document.getElementById("ticketName").value.trim();
    const mobile = document.getElementById("ticketPhone").value.trim();
    const email = document.getElementById("ticketEmail").value.trim();
    const ticketQuantity =
        document.getElementById("ticketQuantity").value;

    // ================= FULL NAME CHECK =================
    if (!name) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please enter your Full Name first.",
            icon: "warning",
            confirmButtonText: "OK"
        });
        document.getElementById("ticketName").focus();
        return;
    }

    if (name.length < 3) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please enter a valid Full Name.",
            icon: "warning",
            confirmButtonText: "OK"
        });
        document.getElementById("ticketName").focus();
        return;
    }

    // ================= MOBILE CHECK =================
    if (!mobile) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please enter your Mobile Number.",
            icon: "warning",
            confirmButtonText: "OK"
        });
        document.getElementById("ticketPhone").focus();
        return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please enter a valid 10 digit Mobile Number.",
            icon: "warning",
            confirmButtonText: "OK"
        });
        document.getElementById("ticketPhone").focus();
        return;
    }

    // ================= EMAIL CHECK =================
    if (!email) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please enter your Email Address.",
            icon: "warning",
            confirmButtonText: "OK"
        });
        document.getElementById("ticketEmail").focus();
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please enter a valid Email Address.",
            icon: "warning",
            confirmButtonText: "OK"
        });
        document.getElementById("ticketEmail").focus();
        return;
    }

    // ================= TICKET QUANTITY CHECK =================
    if (!ticketQuantity) {
        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please select Number of Tickets first.",
            icon: "warning",
            confirmButtonText: "OK"
        });
        document.getElementById("ticketQuantity").focus();
        return;
    }

    // ================= OTP VERIFICATION CHECK =================
    const verified =
        localStorage.getItem("ticketVerified");

    const verifiedEmail =
        (localStorage.getItem("ticketEmail") || "")
            .trim()
            .toLowerCase();

    const currentEmail =
        email.toLowerCase();

    if (
        verified !== "true" ||
        !verifiedEmail ||
        verifiedEmail !== currentEmail
    ) {

        Swal.fire({
            title: "Tribal Rhythm",
            text: "Please verify your Email OTP first.",
            icon: "warning",
            confirmButtonText: "Verify OTP"
        });

        document.getElementById("otpSection").style.display = "block";
        document.getElementById("ticketOTP").focus();

        return;
    }

    // ================= ALL VALID =================
    document.getElementById("ticket").scrollIntoView({
        behavior: "smooth"
    });

    const section = document.getElementById("ticket");

    section.style.border = "2px solid gold";

    setTimeout(() => {
        section.style.border = "none";
    }, 2000);
};



/* ================= PAYMENT ================= */
window.payNow = async function () {

    // ================= DEBUG =================

    console.log(
        "BOOK NOW CHECK:",
        localStorage.getItem("ticketVerified"),
        localStorage.getItem("ticketEmail"),
        document.getElementById("ticketEmail").value
    );

    // ================= OTP + EMAIL VERIFICATION =================

    const verified =
        localStorage.getItem("ticketVerified");

    const verifiedEmail =
        (localStorage.getItem("ticketEmail") || "")
            .trim()
            .toLowerCase();

    const currentEmail =
        document
            .getElementById("ticketEmail")
            .value
            .trim()
            .toLowerCase();

    console.log("OTP STATUS:", verified);
    console.log("VERIFIED EMAIL:", verifiedEmail);
    console.log("CURRENT EMAIL:", currentEmail);

    if (
        verified !== "true" ||
        !verifiedEmail ||
        verifiedEmail !== currentEmail
    ) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Verify OTP First",
            "warning"
        );

        return;
    }

    // ================= SELECTED PASS =================
    const selected =
        document.querySelector('input[name="ticketType"]:checked');

    if (!selected) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Select a Pass",
            "warning"
        );

        return;
    }

    const type = selected.value;

    // ================= TICKET QUANTITY =================
    const ticketQuantity =
        document.getElementById("ticketQuantity").value;

    if (!ticketQuantity) {

        Swal.fire(
            "Tribal Rhythm",
            "Please Select Number of Tickets First",
            "warning"
        );

        return;
    }

    // ================= USER DETAILS =================
    const name =
        document.getElementById("ticketName").value.trim();

    const phone =
        document.getElementById("ticketPhone").value.trim();

    const email =
        document.getElementById("ticketEmail").value.trim();


    


    // ================= VALIDATION =================
    if (name.length < 3) {

        Swal.fire(
            "Tribal Rhythm",
            "Enter Valid Name",
            "warning"
        );

        return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {

        Swal.fire(
            "Tribal Rhythm",
            "Invalid Mobile Number",
            "warning"
        );

        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

        Swal.fire(
            "Tribal Rhythm",
            "Invalid Email",
            "warning"
        );

        return;
    }


    // ================= PRICE =================
    const amountMap = {
        General: 499,
        VIP: 999,
        Group: 399
    };

    const amount =
        amountMap[type] * Number(ticketQuantity);


    try {

        // ================= CREATE RAZORPAY ORDER =================
        const res = await fetch(`${API_URL}/create-order`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                amount,
                email
            })

        });

        const data = await res.json();

        if (!data.success) {

            Swal.fire(
                "Tribal Rhythm",
                data.message,
                "error"
            );

            return;
        }


        // ================= RAZORPAY =================
        const options = {

            key: data.key,
            amount: data.amount,
            currency: data.currency,
            order_id: data.id,

            name: "Tribal Rhythm",

            description: type + " Ticket",

            handler: async function (response) {

                try {

                    // ================= VERIFY PAYMENT =================
                    const verify = await fetch(
                        `${API_URL}/verify-payment`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                ...response,
                                email
                            })
                        }
                    );

                    const result =
                        await verify.json();

                    if (!result.success) {

                        Swal.fire(
                            "Payment Verification Failed",
                            "",
                            "error"
                        );

                        return;
                    }


                    // ================= TICKET ID =================
                    const now = new Date();

                    const random =
                        Math.random()
                            .toString(36)
                            .substring(2, 8)
                            .toUpperCase();

                    const ticketId =
                        `TR-${now.getFullYear()}${String(
                            now.getMonth() + 1
                        ).padStart(2, "0")}${String(
                            now.getDate()
                        ).padStart(2, "0")}-${random}`;


                    // ================= SAVE BOOKING =================

                    await addDoc(
                        collection(db, "bookings"),
                        {

                            ticketId,

                            name,

                            phone,

                            email,

                            ticketType: type,

                            ticketQuantity:
                                Number(ticketQuantity),

                            paymentId:
                                response.razorpay_payment_id,

                            orderId:
                                response.razorpay_order_id,

                            status:
                                "success",

                            entryStatus:
                                "unused",

                            createdAt:
                                new Date()

                        }
                    );


                    // ================= SEND SUCCESS EMAIL =================

                    const emailResponse = await fetch(
                        `${API_URL}/send-registration-email`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                name,
                                email,
                                ticketId
                            })
                        }
                    );

                    const emailResult = await emailResponse.json();

                    console.log("EMAIL RESPONSE:", emailResult);

                    if (!emailResponse.ok || !emailResult.success) {

                        console.error(
                            "Email sending failed:",
                            emailResult
                        );

                        Swal.fire(
                            "Payment Successful",
                            "Payment successful, but confirmation email could not be sent.",
                            "warning"
                        );

                    } else {

                        console.log("Success email sent successfully");

                    }

                    // ================= SEND SUCCESS SMS MSG91 =================

                    try {

                        const smsResponse = await fetch(
                            `${API_URL}/send-payment-success-sms`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type": "application/json"
                                },

                                body: JSON.stringify({

                                    name: name,
                                    mobile: phone,
                                    ticketId: ticketId,
                                    amount: amount

                                })
                            }
                        );


                        const smsResult = await smsResponse.json();

                        console.log(
                            "MSG91 SMS RESPONSE:",
                            smsResult
                        );


                    }
                    catch (error) {

                        console.log(
                            "SMS ERROR:",
                            error
                        );

                    }


                    // ================= GENERATE TICKET =================
                    generateTicketPDF(
                        name,
                        phone,
                        type,
                        response.razorpay_payment_id,
                        ticketId
                    );


                    Swal.fire(
                        "Success",
                        "Payment Verified Successfully. Confirmation email sent successfully.",
                        "success"
                    );

                } catch (err) {

                    console.log(err);

                    Swal.fire({

                        icon: "success",

                        title: "Booking Successful",

                        html: `

<h3>🎉 Ticket Booked Successfully</h3>

<p>Your payment has been verified.</p>

<p>✅ Ticket ID : <b>${ticketId}</b></p>

<p>📧 Confirmation Email Sent</p>

<p>🎫 PDF Ticket Downloaded</p>

`,

                        confirmButtonText: "OK"

                    });

                }

            }

        };

        const rzp = new Razorpay(options);

        rzp.open();

    } catch (error) {

        console.log(error);

        Swal.fire(
            "Error",
            "Something went wrong",
            "error"
        );

    }

};



window.generateTicketPDF = function (
    name,
    phone,
    type,
    paymentId,
    ticketId
) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logo = new Image();
    logo.src = "tribalweblogo.png";

    // ===============================
    // PART 1 : PREMIUM HEADER DESIGN
    // ===============================


    // Page Border
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(2);
    doc.roundedRect(5, 5, 200, 287, 5, 5);

    // Inner Border
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(0.5);
    doc.roundedRect(8, 8, 194, 281, 4, 4);

    // Header Background
    doc.setFillColor(18, 18, 18);
    doc.rect(5, 5, 200, 35, "F");

    // Golden Line
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(1.5);
    doc.line(5, 40, 205, 40);

    // Title
    doc.setTextColor(255, 215, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TRIBAL RHYTHM", 60, 20);

    // Subtitle
    doc.setFontSize(11);
    doc.text("OFFICIAL EVENT ENTRY PASS", 60, 28);

    // Verified
    doc.setFontSize(9);
    doc.text("Verified Digital Ticket", 60, 34);

    // Powered By
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 220);
    doc.text("Powered by Zentro Nex", 60, 38);

    // Reset Text Color
    doc.setTextColor(0, 0, 0);

    // Divider
    doc.setDrawColor(180, 180, 180);
    doc.line(20, 48, 190, 48);

    // User Information Title
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("ATTENDEE DETAILS", 20, 58);

    // Normal Font
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Details
    doc.text("Name :", 20, 72);
    doc.text(name, 60, 72);

    doc.text("Phone :", 20, 82);
    doc.text(phone, 60, 82);

    doc.text("Ticket :", 20, 92);
    doc.text(type, 60, 92);

    doc.text("Payment ID :", 20, 102);
    doc.text(paymentId, 60, 102);

    // Event Box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(20, 112, 170, 42, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("EVENT DETAILS", 28, 122);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text("Event : Ratha Yatra 2026", 28, 132);
    doc.text("Venue : Rairangpur, Odisha", 28, 140);
    doc.text("Date : 16 July 2026", 28, 148);

    // ==========================================
    // PART 2 : WATERMARK + SECURITY BACKGROUND
    // ==========================================
    // Logo
    doc.addImage(logo, "PNG", 15, 10, 28, 28);

    // Light Gray Watermark
    doc.setTextColor(235, 235, 235);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);

    for (let y = 30; y <= 280; y += 35) {
        doc.text("TRIBAL RHYTHM", 15, y, { angle: 45 });
    }

    // Reset Text Color
    doc.setTextColor(0, 0, 0);

    // ----------------------------
    // SECURITY PATTERN
    // ----------------------------

    doc.setDrawColor(240, 240, 240);

    for (let x = 10; x <= 200; x += 8) {
        doc.line(x, 40, x, 285);
    }

    for (let y = 40; y <= 285; y += 8) {
        doc.line(10, y, 200, y);
    }

    // ----------------------------
    // GOLD SECURITY LINE
    // ----------------------------

    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(0.8);

    doc.line(15, 160, 195, 160);

    // ----------------------------
    // SECURITY CODE
    // ----------------------------

    const securityCode =
        Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text(
        "Security Code : " + securityCode,
        20,
        170
    );

    // ----------------------------
    // UNIQUE TICKET ID
    // ----------------------------

    // const ticketId =
    //     "TR-" +
    //     Date.now();

    doc.text(
        "Ticket ID : " + ticketId,
        20,
        180
    );

    // ----------------------------
    // VERIFIED STAMP
    // ----------------------------

    doc.setFillColor(0, 170, 70);
    doc.circle(170, 170, 13, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("VERIFIED", 159, 172);

    // Reset Color
    doc.setTextColor(0, 0, 0);

    // ----------------------------
    // OFFICIAL SEAL
    // ----------------------------

    doc.setDrawColor(255, 180, 0);
    doc.setLineWidth(1);

    doc.circle(170, 210, 18);

    doc.setFontSize(8);
    doc.text("TRIBAL", 162, 206);
    doc.text("RHYTHM", 160, 212);
    doc.text("OFFICIAL", 160, 218);


    // =======================================
    // PART 3 : QR + SECURITY + FOOTER
    // =======================================

    // Ticket Number
    const ticketNumber =
        "TR-" +
        new Date().getFullYear() +
        "-" +
        Math.floor(Math.random() * 999999);

    // QR Data
    const qrData =
        `TRIBAL RHYTHM
Ticket No : ${ticketNumber}
Name : ${name}
Phone : ${phone}
Ticket : ${type}
Payment : ${paymentId}`;

    // QR Container
    const qrDiv = document.createElement("div");

    new QRCode(qrDiv, {
        text: qrData,
        width: 80,
        height: 80
    });

    // QR Image
    const qrImage =
        qrDiv.querySelector("img");

    if (qrImage) {

        doc.addImage(
            qrImage.src,
            "PNG",
            145,
            185,
            40,
            40);

    }

    // Ticket Number
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");

    doc.text(
        "Ticket No : " + ticketNumber,
        20,
        195
    );

    // Entry Status
    doc.setTextColor(0, 130, 0);

    doc.setFontSize(14);

    doc.text(
        "ENTRY STATUS : VERIFIED",
        20,
        205
    );

    doc.setTextColor(0, 0, 0);

    // Security Notice
    doc.setFontSize(10);

    doc.text(
        "✓ QR Verification Required",
        20,
        218
    );

    doc.text(
        "✓ Duplicate Ticket Invalid",
        20,
        226
    );

    doc.text(
        "✓ Tampered Ticket Rejected",
        20,
        234
    );

    doc.text(
        "✓ Carry Valid ID Proof",
        20,
        242
    );

    // Footer Line
    doc.setDrawColor(255, 215, 0);

    doc.line(
        15,
        255,
        195,
        255
    );

    // Footer
    doc.setFontSize(9);

    doc.text(
        "Official Ticket - Tribal Rhythm",
        20,
        265
    );

    doc.setFontSize(8);

    doc.text(
        "Powered & Operated by Zentro Nex",
        20,
        271
    );

    doc.text(
        "www.tribalrhythm.in",
        20,
        277
    );

    // Digital Signature
    doc.setFont("courier", "bold");

    doc.setFontSize(13);

    doc.text(
        "Authorized Signature",
        135,
        272
    );


    // =======================================
    // PART 4 : FINAL PREMIUM FINISH
    // =======================================

    // Gold Hologram Badge
    doc.setFillColor(255, 215, 0);
    doc.circle(180, 40, 10, "F");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("VIP", 176, 42);

    // Reset
    doc.setTextColor(0, 0, 0);

    // Official Seal
    doc.setDrawColor(255, 180, 0);
    doc.setLineWidth(1);

    doc.circle(180, 65, 12);

    doc.setFontSize(7);
    doc.text("TRIBAL", 174, 62);
    doc.text("RHYTHM", 172, 66);
    doc.text("OFFICIAL", 171, 70);

    // Premium Divider
    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(0.8);

    doc.line(20, 248, 190, 248);

    // Rules
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.text("IMPORTANT RULES", 20, 255);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text("• Carry a valid Photo ID.", 20, 262);
    doc.text("• QR Code must be scanned at entry.", 20, 267);
    doc.text("• Ticket is valid for one person only.", 20, 272);
    doc.text("• Screenshot or edited ticket may be rejected.", 20, 277);

    // Version
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);

    doc.text("Ticket Version : TR-V2.0", 145, 286);

    doc.setTextColor(0, 0, 0);

    logo.onload = function () {

        doc.addImage(logo, "PNG", 15, 8, 28, 28);

        doc.save("TribalTicket.pdf");

    };
};


window.goCompetition = function () {

    let email = localStorage.getItem("email");
    let ticket = localStorage.getItem("ticket");

    if (email && ticket) {
        window.location.href = "competition.html";
    } else {
        window.location.href = "register.html";
    }
};


document
    .getElementById("ticketPhone")
    .addEventListener("input", function () {

        if (this.value.length > 10) {
            this.value =
                this.value.slice(0, 10);
        }

        document
            .getElementById("phoneWarning")
            .style.display =
            this.value.length === 10
                ? "none"
                : "block";
    });


// ================= EMAIL CHANGE SECURITY =================

document
    .getElementById("ticketEmail")
    .addEventListener("input", function () {

        const verifiedEmail =
            localStorage.getItem("ticketEmail");

        const currentEmail =
            this.value.trim().toLowerCase();

        if (
            verifiedEmail &&
            verifiedEmail !== currentEmail
        ) {

            localStorage.removeItem("ticketVerified");
            localStorage.removeItem("ticketEmail");

            document.getElementById(
                "otpVerifiedMessage"
            ).style.display = "none";

            Swal.fire(
                "Tribal Rhythm",
                "Email changed. Please verify OTP again.",
                "warning"
            );
        }

    });


onAuthStateChanged(auth, (user) => {
    const uploadSection = document.getElementById("upload");

    if (uploadSection) {
        uploadSection.hidden = !user;
    }
});


loadNews();


window.logout = async function () {

    try {

        if (window.auth && typeof signOut === "function") {

            await signOut(window.auth);

        }

        localStorage.clear();

        window.location.href = "login.html";

    } catch (err) {

        console.error("Logout error:", err);

    }

};



window.toggleHistory = function () {

    const panel =
        document.getElementById("historyPanel");

    if (!panel) return;

    panel.style.display =
        panel.style.display === "flex"
            ? "none"
            : "flex";
};




window.openGallery = function (src) {

    const modal =
        document.getElementById("galleryModal");

    const preview =
        document.getElementById("galleryPreview");

    if (!modal || !preview) return;

    preview.src = src;

    modal.style.display = "flex";
};


window.closeGallery = function () {

    const modal =
        document.getElementById("galleryModal");

    if (!modal) return;

    modal.style.display = "none";
};


window.openNews = function (text) {

    const textElement =
        document.getElementById(
            "fullNewsText"
        );

    const modal =
        document.getElementById(
            "newsModal"
        );

    if (!textElement || !modal) return;

    textElement.innerText =
        text || "";

    modal.style.display =
        "flex";
};


window.closeNews = function () {

    const modal =
        document.getElementById(
            "newsModal"
        );

    if (!modal) return;

    modal.style.display =
        "none";
};


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const typeElement =
            document.getElementById(
                "typeText"
            );

        if (!typeElement) return;

        const text =
            "WELCOME TO TRIBAL RHYTHM";

        let i = 0;

        function typeWriter() {

            if (i < text.length) {

                typeElement.innerHTML +=
                    text.charAt(i);

                i++;

                setTimeout(
                    typeWriter,
                    100
                );
            }
        }

        typeWriter();
    }
);





document.addEventListener("DOMContentLoaded", function () {
    updateCountdown();
    setInterval(updateCountdown, 1000);
});






window.bookNow = function () {

    if (typeof window.payNow === "function") {
        window.payNow();
    } else {
        console.error("payNow() function not found.");
    }

};







document.addEventListener("DOMContentLoaded", function () {

    if (typeof window.loadUpcoming === "function") {
        window.loadUpcoming();
    }

});



document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".nav-link").forEach(link => {

        link.addEventListener("click", function () {

            // Dropdown toggle ko ignore karo
            if (this.classList.contains("dropdown-toggle")) {
                return;
            }

            const nav = document.querySelector(".navbar-collapse");

            if (!nav || typeof bootstrap === "undefined") {
                return;
            }

            const bsCollapse =
                bootstrap.Collapse.getInstance(nav);

            if (bsCollapse) {
                bsCollapse.hide();
            }

        });

    });

});