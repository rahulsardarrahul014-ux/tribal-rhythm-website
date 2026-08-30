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

    // ================= TICKET TYPE CHECK =================

    const selectedTicket =
        document.querySelector(
            'input[name="ticketType"]:checked'
        );

    if (!selectedTicket) {

        Swal.fire(
            "Tribal Rhythm",
            "Please select Ticket Type first.",
            "warning"
        );

        return;
    }

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


    // ================= RESEND COOLDOWN CHECK =================

    const now = Date.now();

    if (
        lastResendTime !== 0 &&
        now - lastResendTime < resendCooldown * 1000
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


        // ================= RESEND SUCCESS =================

        // 🔴 ADD THESE TWO LINES HERE
        startOtpTimer();
        lastResendTime = Date.now();


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
        // localStorage.setItem("ticketId", data.ticketId);


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

        // ================= SHOW TICKET SECTION AFTER OTP =================

        const ticketSection = document.getElementById("ticket");

        if (ticketSection) {
            ticketSection.style.display = "block";

            setTimeout(() => {
                ticketSection.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }, 300);
        }


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



// ================= DANCE CLASS SELECTION =================
let selectedClassName = "";
let selectedClassFee = 0;

window.selectClass = function (className, fee) {
    selectedClassName = className;
    selectedClassFee = fee;

    localStorage.removeItem("classVerified");
    localStorage.removeItem("classEmail");

    document.getElementById("classFormBox").style.display = "block";

    document.getElementById("selectedClassText").innerHTML =
        `<b>${className}</b><br>Monthly Fee: <b>₹${fee}</b>`;

    document.getElementById("classSuccessMessage").style.display = "none";
    document.getElementById("classOtpSection").style.display = "none";
    document.getElementById("classOTP").value = "";

    document.getElementById("classFormBox").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
};


// ================= SEND CLASS EMAIL OTP =================
window.sendClassOTP = async function () {
    const name = document.getElementById("className").value.trim();
    const mobile = document.getElementById("classMobile").value.trim();
    const email = document.getElementById("classEmail").value.trim().toLowerCase();

    if (!selectedClassName) {
        Swal.fire("Tribal Rhythm", "Please select a class first.", "warning");
        return;
    }

    if (!name || name.length < 3) {
        Swal.fire("Tribal Rhythm", "Please enter a valid full name.", "warning");
        document.getElementById("className").focus();
        return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        Swal.fire("Tribal Rhythm", "Enter a valid 10 digit mobile number.", "warning");
        document.getElementById("classMobile").focus();
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Swal.fire("Tribal Rhythm", "Please enter a valid email address.", "warning");
        document.getElementById("classEmail").focus();
        return;
    }

    try {
        Swal.fire({
            title: "Sending OTP...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch(`${API_URL}/send-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                mobile,
                email
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to send OTP.");
        }

        document.getElementById("classOtpSection").style.display = "block";
        document.getElementById("classOTP").value = "";
        document.getElementById("classOTP").focus();

        Swal.fire("OTP Sent", "OTP has been sent to your email address.", "success");

    } catch (error) {
        Swal.fire(
            "Tribal Rhythm",
            error.message || "Unable to send OTP. Please try again.",
            "error"
        );
    }
};


// ================= VERIFY CLASS EMAIL OTP =================
window.verifyClassOTP = async function () {
    const email = document.getElementById("classEmail").value.trim().toLowerCase();
    const otp = document.getElementById("classOTP").value.trim();

    if (otp.length !== 6) {
        Swal.fire("Tribal Rhythm", "Enter the 6 digit OTP.", "warning");
        return;
    }

    try {
        Swal.fire({
            title: "Verifying OTP...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch(`${API_URL}/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                otp
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Invalid OTP.");
        }

        localStorage.setItem("classVerified", "true");
        localStorage.setItem("classEmail", email);
        localStorage.setItem("className", selectedClassName);
        localStorage.setItem("classFee", selectedClassFee);
        localStorage.setItem(
            "classMobile",
            document.getElementById("classMobile").value.trim()
        );

        document.getElementById("classOtpSection").style.display = "none";

        const successBox =
            document.getElementById("classSuccessMessage");

        successBox.style.display = "block";

        successBox.innerHTML = `
    ✓ Email OTP Verified Successfully!<br><br>

    <b>${selectedClassName}</b><br>
    Monthly Fee: <b>₹${selectedClassFee}</b><br><br>

    <button
        type="button"
        class="btn btn-warning"
        onclick="payForClass()">
        💳 Pay ₹${selectedClassFee} & Join Class
    </button>
`;

        Swal.fire(
            "Registration Successful",
            `${selectedClassName} class ke liye aapka registration successful hai.`,
            "success"
        );

    } catch (error) {
        Swal.fire(
            "Verification Failed",
            error.message || "OTP verification failed. Please try again.",
            "error"
        );
    }
};


// =====================================================
// DANCE CLASS RAZORPAY PAYMENT
// =====================================================

window.payForClass = async function () {

    try {

        // ================= OTP CHECK =================

        const verified =
            localStorage.getItem("classVerified");

        const verifiedEmail =
            localStorage.getItem("classEmail");

        const email =
            document.getElementById("classEmail")
                .value
                .trim()
                .toLowerCase();

        if (
            verified !== "true" ||
            !verifiedEmail ||
            verifiedEmail !== email
        ) {

            Swal.fire(
                "Tribal Rhythm",
                "Please verify Email OTP first.",
                "warning"
            );

            return;
        }


        // ================= USER DETAILS =================

        const name =
            document.getElementById("className")
                .value
                .trim();

        const mobile =
            document.getElementById("classMobile")
                .value
                .trim();

        const className =
            selectedClassName;

        const classFee =
            Number(selectedClassFee);


        // ================= VALIDATION =================

        if (!name || name.length < 3) {

            Swal.fire(
                "Tribal Rhythm",
                "Please enter valid name.",
                "warning"
            );

            return;
        }


        if (!/^[6-9]\d{9}$/.test(mobile)) {

            Swal.fire(
                "Tribal Rhythm",
                "Please enter valid 10 digit mobile number.",
                "warning"
            );

            return;
        }


        if (!className || !classFee) {

            Swal.fire(
                "Tribal Rhythm",
                "Please select a dance class.",
                "warning"
            );

            return;
        }


        // ================= CREATE ORDER =================

        Swal.fire({
            title: "Preparing Payment...",
            text: "Please wait",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });


        const orderResponse =
            await fetch(
                `${API_URL}/create-class-order`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name,
                        mobile,
                        email,
                        className,
                        classFee

                    })
                }
            );


        const orderData =
            await orderResponse.json();


        console.log(
            "CLASS ORDER:",
            orderData
        );


        if (
            !orderResponse.ok ||
            !orderData.success
        ) {

            Swal.close();

            Swal.fire(
                "Payment Error",
                orderData.message ||
                "Unable to create payment order.",
                "error"
            );

            return;
        }


        Swal.close();


        // ================= RAZORPAY =================

        const options = {

            key:
                orderData.key,

            amount:
                orderData.amount,

            currency:
                orderData.currency,

            order_id:
                orderData.id,

            name:
                "Tribal Rhythm",

            description:
                `${className} Dance Class`,

            prefill: {

                name,
                email,
                contact:
                    mobile

            },

            theme: {
                color: "#FFD700"
            },


            // ================= PAYMENT SUCCESS =================

            handler:
                async function (response) {

                    try {

                        Swal.fire({

                            title:
                                "Verifying Payment...",

                            text:
                                "Please wait",

                            allowOutsideClick:
                                false,

                            didOpen: () => {
                                Swal.showLoading();
                            }

                        });


                        // ================= VERIFY =================

                        const verifyResponse =
                            await fetch(
                                `${API_URL}/verify-class-payment`,
                                {
                                    method: "POST",

                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },

                                    body:
                                        JSON.stringify({

                                            ...response,

                                            name,
                                            mobile,
                                            email,
                                            className

                                        })
                                }
                            );


                        const result =
                            await verifyResponse.json();


                        console.log(
                            "CLASS PAYMENT RESULT:",
                            result
                        );


                        if (
                            !verifyResponse.ok ||
                            !result.success
                        ) {

                            Swal.close();

                            Swal.fire(
                                "Payment Verification Failed",
                                result.message ||
                                "Unable to verify payment.",
                                "error"
                            );

                            return;
                        }


                        // ================= SUCCESS =================

                        Swal.close();


                        localStorage.setItem(
                            "classPaymentVerified",
                            "true"
                        );

                        localStorage.setItem(
                            "classBookingId",
                            result.bookingId
                        );


                        Swal.fire({

                            icon: "success",

                            title:
                                "Payment Successful 🎉",

                            html: `

                                <p>
                                    Welcome to
                                    <b>Tribal Rhythm</b>
                                </p>

                                <p>
                                    Class:
                                    <b>${className}</b>
                                </p>

                                <p>
                                    Amount Paid:
                                    <b>₹${result.amount}</b>
                                </p>

                                <p>
                                    Booking ID:
                                    <b>${result.bookingId}</b>
                                </p>

                                <hr>

                                <p>
                                    📧 Confirmation Email:
                                    ${result.emailSent
                                    ? "Sent ✅"
                                    : "Failed ⚠️"}
                                </p>

                                <p>
                                    📱 Message:
                                    ${result.smsSent
                                    ? "Sent ✅"
                                    : "Failed ⚠️"}
                                </p>

                                <br>

                                <a
                                    href="${result.whatsappLink}"
                                    target="_blank"
                                    class="btn btn-success">
                                    💬 Open WhatsApp Class
                                </a>

                            `,

                            confirmButtonText:
                                "OK"

                        });

                    }

                    catch (error) {

                        console.error(
                            "CLASS PAYMENT ERROR:",
                            error
                        );

                        Swal.close();

                        Swal.fire(
                            "Error",
                            "Payment may have succeeded. Please contact Tribal Rhythm.",
                            "error"
                        );

                    }

                },


            modal: {

                ondismiss:
                    function () {

                        console.log(
                            "Class payment window closed"
                        );

                    }

            }

        };


        const rzp =
            new Razorpay(options);


        rzp.on(
            "payment.failed",
            function (response) {

                console.error(
                    "CLASS PAYMENT FAILED:",
                    response
                );

                Swal.fire(
                    "Payment Failed",
                    response.error?.description ||
                    "Payment could not be completed.",
                    "error"
                );

            }
        );


        rzp.open();

    }

    catch (error) {

        console.error(
            "CLASS PAYMENT START ERROR:",
            error
        );

        Swal.close();

        Swal.fire(
            "Error",
            "Unable to start payment.",
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


// =====================================================
// NEWS SYSTEM
// =====================================================

// ================= LOAD LATEST NEWS =================

async function loadNews() {

    const marquee =
        document.getElementById("newsMarquee");

    if (!marquee) {
        console.warn("newsMarquee element not found.");
        return;
    }

    try {

        const snapshot =
            await getDocs(
                collection(db, "news")
            );

        let newsHTML = "";

        snapshot.forEach((newsDoc) => {

            const data =
                newsDoc.data();

            const text =
                String(data.text || "").trim();

            if (!text) return;

            newsHTML += `
                <span class="news-item">
                    🔥 ${escapeHTML(text)}
                </span>
            `;

        });


        // ================= NEWS AVAILABLE =================

        if (newsHTML.trim()) {

            marquee.innerHTML =
                newsHTML;

        }

        // ================= NO NEWS =================

        else {

            marquee.innerHTML = `
                <span class="news-item">

                    🛕 Welcome to Tribal Rhythm 2026 |

                    📍 Padia, Rairangpur Block |

                    📅 16 July 2026 – 24 July 2026 |

                    🎭 Traditional Dance • Music • Culture • Food • Exhibition |

                    🙏 Jai Jagannath 🙏

                </span>
            `;

        }

    } catch (error) {

        console.error(
            "News Loading Error:",
            error
        );

        marquee.innerHTML = `
            <span class="news-item">
                📢 Unable to load latest news.
            </span>
        `;

    }

}



// =====================================================
// OPEN OLD NEWS HISTORY
// =====================================================

window.openNewsHistory = async function () {

    const modal =
        document.getElementById(
            "newsHistoryModal"
        );

    const list =
        document.getElementById(
            "oldNewsList"
        );


    if (!modal || !list) {

        console.error(
            "News History HTML elements not found."
        );

        return;

    }


    // ================= OPEN MODAL =================

    modal.style.display =
        "flex";


    // ================= LOADING =================

    list.innerHTML = `
        <p class="text-light text-center">
            ⏳ Loading old news...
        </p>
    `;


    try {

        const snapshot =
            await getDocs(
                collection(db, "news")
            );


        // ================= NO NEWS =================

        if (snapshot.empty) {

            list.innerHTML = `
                <p class="text-light text-center">
                    📰 No news available.
                </p>
            `;

            return;

        }


        let oldNewsHTML = "";


        // ================= ALL NEWS =================

        snapshot.forEach((newsDoc) => {

            const data =
                newsDoc.data();


            const text =
                String(
                    data.text ||
                    "News Update"
                ).trim();


            if (!text) return;


            // ================= DATE =================

            let dateText = "";


            if (data.createdAt) {

                try {

                    let newsDate;


                    // Firestore Timestamp

                    if (
                        typeof data.createdAt.toDate ===
                        "function"
                    ) {

                        newsDate =
                            data.createdAt.toDate();

                    }

                    // JavaScript Date / String

                    else {

                        newsDate =
                            new Date(
                                data.createdAt
                            );

                    }


                    if (
                        !Number.isNaN(
                            newsDate.getTime()
                        )
                    ) {

                        dateText =
                            newsDate.toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                }
                            );

                    }

                } catch (dateError) {

                    console.warn(
                        "News date error:",
                        dateError
                    );

                }

            }


            oldNewsHTML += `

                <div
                    class="news-history-item"
                    style="
                        padding:15px;
                        margin-bottom:12px;
                        border:1px solid rgba(255,215,0,0.35);
                        border-radius:12px;
                        background:rgba(255,255,255,0.05);
                    "
                >

                    <div
                        class="news-history-text"
                        style="
                            color:#ffffff;
                            font-size:15px;
                            line-height:1.6;
                        "
                    >

                        📰
                        ${escapeHTML(text)}

                    </div>


                    ${dateText
                    ? `
                                <div
                                    class="news-history-date"
                                    style="
                                        color:#ffd700;
                                        font-size:12px;
                                        margin-top:8px;
                                    "
                                >
                                    📅 ${dateText}
                                </div>
                            `
                    : ""
                }

                </div>

            `;

        });


        // ================= DISPLAY =================

        if (oldNewsHTML.trim()) {

            list.innerHTML =
                oldNewsHTML;

        } else {

            list.innerHTML = `
                <p class="text-light text-center">
                    📰 No news available.
                </p>
            `;

        }


    } catch (error) {

        console.error(
            "News History Error:",
            error
        );


        list.innerHTML = `
            <p
                class="text-danger text-center"
            >
                ❌ Failed to load old news.
            </p>
        `;

    }

};



// =====================================================
// CLOSE OLD NEWS HISTORY
// =====================================================

window.closeNewsHistory = function () {

    const modal =
        document.getElementById(
            "newsHistoryModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

};



// =====================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// =====================================================

document.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "newsHistoryModal"
            );


        if (!modal) return;


        if (
            event.target === modal
        ) {

            modal.style.display =
                "none";

        }

    }
);


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


        // ================= DATE NOT AVAILABLE =================

        if (!startTime) {

            card.innerHTML =
                "⚠️ Date not available";

            return;
        }


        // ================= PROGRAM NOT STARTED =================

        if (now < startTime) {

            let diff = startTime - now;

            const days =
                Math.floor(diff / 86400000);

            diff %= 86400000;

            const hours =
                Math.floor(diff / 3600000);

            diff %= 3600000;

            const minutes =
                Math.floor(diff / 60000);

            const seconds =
                Math.floor((diff % 60000) / 1000);


            card.innerHTML =
                `⏳ Starts in: <b>${days}d ${hours}h ${minutes}m ${seconds}s</b>`;

            return;
        }


        // ================= PROGRAM LIVE =================

        if (endTime && now <= endTime) {

            card.innerHTML =
                "🎉 Program is live now";

            return;
        }


        // ================= PROGRAM ENDED =================

        card.innerHTML = `
            <div style="
                color:#ffd700;
                font-weight:700;
                line-height:1.6;
            ">
                📅 Program Ended
                <br>

                <span style="
                    color:#ffffff;
                    font-weight:500;
                ">
                    New program is announced soon by
                    Tribal Rhythm Team.
                </span>
            </div>
        `;

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

    // OTP verified + all details filled
    const ticketSection = document.getElementById("ticket");

    if (!ticketSection) {
        console.error("Ticket section not found.");
        return;
    }

    ticketSection.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    ticketSection.style.border = "2px solid gold";

    setTimeout(() => {
        ticketSection.style.border = "none";
    }, 2000);
};



/* ================= PAYMENT ================= */

// ================= PAYMENT =================

window.payNow = async function () {

    try {

        // =====================================================
        // 1. OTP EMAIL VERIFICATION CHECK
        // =====================================================

        const verified =
            localStorage.getItem("ticketVerified");

        const verifiedEmail =
            (
                localStorage.getItem("ticketEmail") ||
                ""
            )
                .trim()
                .toLowerCase();

        const currentEmail =
            (
                document.getElementById("ticketEmail")?.value ||
                ""
            )
                .trim()
                .toLowerCase();

        console.log(
            "BOOK NOW CHECK:",
            {
                verified,
                verifiedEmail,
                currentEmail
            }
        );

        if (
            verified !== "true" ||
            !verifiedEmail ||
            verifiedEmail !== currentEmail
        ) {

            await Swal.fire(
                "Tribal Rhythm",
                "Please Verify OTP First",
                "warning"
            );

            return;

        }

        // =====================================================
        // 2. SELECT PASS
        // =====================================================

        const selected =
            document.querySelector(
                'input[name="ticketType"]:checked'
            );

        if (!selected) {

            await Swal.fire(
                "Tribal Rhythm",
                "Please Select a Pass",
                "warning"
            );

            return;

        }

        const type =
            selected.value;

        // =====================================================
        // 3. QUANTITY
        // =====================================================

        const ticketQuantity =
            Number(
                document.getElementById(
                    "ticketQuantity"
                )?.value
            );

        if (
            !Number.isInteger(ticketQuantity) ||
            ticketQuantity < 1
        ) {

            await Swal.fire(
                "Tribal Rhythm",
                "Please Select Number of Tickets First",
                "warning"
            );

            return;

        }

        // =====================================================
        // 4. USER DETAILS
        // =====================================================

        const name =
            document
                .getElementById("ticketName")
                .value
                .trim();

        const phone =
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

        // =====================================================
        // 5. VALIDATION
        // =====================================================

        if (name.length < 3) {

            await Swal.fire(
                "Tribal Rhythm",
                "Enter Valid Name",
                "warning"
            );

            return;

        }

        if (
            !/^[6-9]\d{9}$/.test(phone)
        ) {

            await Swal.fire(
                "Tribal Rhythm",
                "Invalid Mobile Number",
                "warning"
            );

            return;

        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            await Swal.fire(
                "Tribal Rhythm",
                "Invalid Email",
                "warning"
            );

            return;

        }

        // =====================================================
        // 6. SHOW PROCESSING
        // =====================================================

        Swal.fire({

            title:
                "Preparing Payment...",

            text:
                "Please wait",

            allowOutsideClick:
                false,

            didOpen: () => {

                Swal.showLoading();

            }

        });

        // =====================================================
        // 7. CREATE RAZORPAY ORDER
        // =====================================================

        const orderResponse =
            await fetch(
                `${API_URL}/create-order`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            email,

                            ticketType:
                                type,

                            ticketQuantity:
                                ticketQuantity

                        })

                }
            );

        const orderData =
            await orderResponse.json();

        console.log(
            "CREATE ORDER RESPONSE:",
            orderData
        );

        if (
            !orderResponse.ok ||
            !orderData.success
        ) {

            Swal.close();

            await Swal.fire(

                "Payment Error",

                orderData.message ||
                "Unable to create payment order",

                "error"

            );

            return;

        }

        Swal.close();

        // =====================================================
        // 8. RAZORPAY OPTIONS
        // =====================================================

        const options = {

            key:
                orderData.key,

            amount:
                orderData.amount,

            currency:
                orderData.currency,

            order_id:
                orderData.id,

            name:
                "Tribal Rhythm",

            description:
                `${type} Ticket x ${ticketQuantity}`,

            prefill: {

                name,

                email,

                contact:
                    phone

            },

            theme: {

                color:
                    "#FFD700"

            },

            // =================================================
            // 9. RAZORPAY SUCCESS
            // =================================================

            handler: async function (response) {

                console.log("RAZORPAY RESPONSE:", response);

                console.log("PAYMENT PHONE VALUE:", phone);
                console.log("PAYMENT PHONE TYPE:", typeof phone);
                console.log("PAYMENT PHONE LENGTH:", String(phone).length);

                try {

                    Swal.fire({
                        title: "Verifying Payment...",
                        text: "Please wait. Do not close this window.",
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // ================= VERIFY PAYMENT =================

                    const verifyResponse = await fetch(
                        `${API_URL}/verify-payment`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({

                                razorpay_payment_id:
                                    response.razorpay_payment_id,

                                razorpay_order_id:
                                    response.razorpay_order_id,

                                razorpay_signature:
                                    response.razorpay_signature,

                                name: name,

                                mobile: phone,

                                email: email,

                                ticketType: type,

                                ticketQuantity: ticketQuantity

                            })
                        }
                    );

                    // ================= SAFE RESPONSE =================

                    const responseText =
                        await verifyResponse.text();

                    console.log(
                        "VERIFY PAYMENT RAW RESPONSE:",
                        responseText
                    );

                    let result;

                    try {
                        result = JSON.parse(responseText);
                    } catch (jsonError) {

                        console.error(
                            "VERIFY PAYMENT JSON ERROR:",
                            jsonError
                        );

                        Swal.close();

                        await Swal.fire(
                            "Payment Successful",
                            "Payment was successful, but the verification server returned an invalid response. Payment ID: " +
                            response.razorpay_payment_id,
                            "warning"
                        );

                        return;
                    }

                    console.log(
                        "VERIFY PAYMENT RESPONSE:",
                        result
                    );

                    // ================= BACKEND ERROR =================

                    if (!verifyResponse.ok || !result.success) {

                        Swal.close();

                        await Swal.fire(
                            "Payment Verification Failed",
                            result.message ||
                            "Payment was received but verification failed.",
                            "error"
                        );

                        return;
                    }

                    // ================= VERIFIED SUCCESS =================

                    Swal.close();

                    localStorage.setItem(
                        "paymentVerified",
                        "true"
                    );

                    if (result.ticketId) {

                        localStorage.setItem(
                            "ticketId",
                            result.ticketId
                        );

                    }

                    // ================= GENERATE PDF =================

                    generateTicketPDF(
                        name,
                        phone,
                        type,
                        response.razorpay_payment_id,
                        result.ticketId,
                        "Ratha Yatra 2026",
                        "Rairangpur, Odisha",
                        "16 July 2026",
                        ticketQuantity,
                        result.amount
                    );

                    // ================= FINAL SUCCESS =================

                    await Swal.fire({

                        icon: "success",

                        title: "Booking Successful 🎉",

                        html: `

                <h3>
                    Ticket Booked Successfully
                </h3>

                <p>
                    Your payment has been
                    verified successfully.
                </p>

                <p>
                    🎟️ Ticket ID:
                    <b>
                        ${result.ticketId || "Generated"}
                    </b>
                </p>

                <p>
                    💰 Amount Paid:
                    <b>
                        ₹${result.amount || 0}
                    </b>
                </p>

                <p>
                    📧 Email:
                    ${result.emailSent
                                ? "Sent ✅"
                                : "Failed ⚠️"
                            }
                </p>

                <p>
                    📱 SMS:
                    ${result.smsSent
                                ? "Sent ✅"
                                : "Failed ⚠️"
                            }
                </p>

                <p>
                    🎫 PDF Ticket Generated
                </p>

            `,

                        confirmButtonText: "OK"

                    });

                } catch (error) {

                    console.error(
                        "PAYMENT VERIFY ERROR:",
                        error
                    );

                    Swal.close();

                    await Swal.fire({

                        icon: "warning",

                        title: "Payment Successful",

                        html: `
                <p>
                    Your payment may have been successful,
                    but the verification response could not
                    be received.
                </p>

                <p>
                    <b>Razorpay Payment ID:</b><br>
                    ${response.razorpay_payment_id}
                </p>

                <small>
                    Please keep this Payment ID for support.
                </small>
            `,

                        confirmButtonText: "OK"

                    });

                }

            },

            // =================================================
            // 14. PAYMENT FAILED
            // =================================================

            modal: {

                ondismiss:
                    function () {

                        console.log(
                            "Razorpay payment window closed"
                        );

                    }

            }

        };

        // =====================================================
        // 15. OPEN RAZORPAY
        // =====================================================

        const rzp =
            new Razorpay(options);

        rzp.on(
            "payment.failed",
            function (response) {

                console.error(
                    "RAZORPAY PAYMENT FAILED:",
                    response
                );

                Swal.fire(

                    "Payment Failed",

                    response.error?.description ||
                    "Payment could not be completed.",

                    "error"

                );

            }
        );

        rzp.open();

    } catch (error) {

        console.error(
            "PAY NOW ERROR:",
            error
        );

        Swal.close();

        await Swal.fire(

            "Error",

            "Something went wrong while starting payment.",

            "error"

        );

    }

};





// =====================================================
// PREMIUM TRIBAL RHYTHM TICKET PDF GENERATOR
// =====================================================

window.generateTicketPDF = function (
    name,
    phone,
    type,
    paymentId,
    ticketId,
    eventName = "Tribal Rhythm Event",
    venue = "Rairangpur, Odisha",
    eventDate = "",
    quantity = 1,
    amount = 0
) {

    try {

        // =====================================================
        // CHECK LIBRARIES
        // =====================================================

        if (!window.jspdf || !window.jspdf.jsPDF) {

            Swal.fire(
                "PDF Error",
                "jsPDF library is not loaded.",
                "error"
            );

            return;
        }


        if (typeof QRCode === "undefined") {

            Swal.fire(
                "PDF Error",
                "QR Code library is not loaded.",
                "error"
            );

            return;
        }


        if (typeof JsBarcode === "undefined") {

            Swal.fire(
                "PDF Error",
                "Barcode library is not loaded.",
                "error"
            );

            return;
        }


        const { jsPDF } = window.jspdf;


        // =====================================================
        // SAFE VALUES
        // =====================================================

        name = String(name || "Guest");

        phone = String(phone || "");

        type = String(type || "GENERAL").toUpperCase();

        paymentId = String(paymentId || "N/A");

        ticketId = String(ticketId || "N/A");

        eventName = String(
            eventName || "Tribal Rhythm Event"
        );

        venue = String(
            venue || "Rairangpur, Odisha"
        );

        eventDate = String(
            eventDate || "Date Not Announced"
        );

        quantity = Number(quantity) || 1;

        amount = Number(amount) || 0;


        // =====================================================
        // CATEGORY
        // =====================================================

        let category = "GENERAL";

        if (type.includes("VIP")) {

            category = "VIP";

        } else if (
            type.includes("GROUP")
        ) {

            category = "GROUP";

        } else {

            category = "GENERAL";

        }


        // =====================================================
        // PDF - ATM CARD SIZE
        // =====================================================

        // 85.60mm x 53.98mm
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: [85.6, 53.98]
        });


        // =====================================================
        // COLORS
        // =====================================================

        const BLACK = [12, 12, 12];

        const DARK_BLACK = [5, 5, 5];

        const GOLD = [212, 175, 55];

        const BRIGHT_GOLD = [255, 215, 0];

        const WHITE = [255, 255, 255];

        const GREY = [170, 170, 170];

        const GREEN = [0, 170, 90];


        // =====================================================
        // CATEGORY DESIGN
        // =====================================================

        let categoryText = "GENERAL PASS";

        let categoryGold = GOLD;


        if (category === "VIP") {

            categoryText = "VIP PREMIUM PASS";

            categoryGold = BRIGHT_GOLD;

        }

        else if (category === "GROUP") {

            categoryText = "GROUP PASS";

            categoryGold = [230, 190, 60];

        }

        else {

            categoryText = "GENERAL PASS";

            categoryGold = GOLD;

        }


        // =====================================================
        // BACKGROUND
        // =====================================================

        doc.setFillColor(...DARK_BLACK);

        doc.rect(
            0,
            0,
            85.6,
            53.98,
            "F"
        );


        // =====================================================
        // GOLD OUTER BORDER
        // =====================================================

        doc.setDrawColor(...categoryGold);

        doc.setLineWidth(0.8);

        doc.roundedRect(
            1.5,
            1.5,
            82.6,
            50.98,
            3,
            3
        );


        // =====================================================
        // INNER BORDER
        // =====================================================

        doc.setDrawColor(80, 70, 40);

        doc.setLineWidth(0.25);

        doc.roundedRect(
            3,
            3,
            79.6,
            47.98,
            2,
            2
        );


        // =====================================================
        // HEADER GOLD LINE
        // =====================================================

        doc.setFillColor(...categoryGold);

        doc.rect(
            3,
            3,
            79.6,
            0.8,
            "F"
        );


        // =====================================================
        // LOGO
        // =====================================================

        const logo = new Image();

        logo.src = "tribalweblogo.png";


        // =====================================================
        // HEADER
        // =====================================================

        doc.setTextColor(...categoryGold);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.text(
            "TRIBAL RHYTHM",
            7,
            10
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(4.2);

        doc.setTextColor(...WHITE);

        doc.text(
            "OFFICIAL EVENT ENTRY PASS",
            7,
            13.5
        );


        // =====================================================
        // CATEGORY BADGE
        // =====================================================

        doc.setFillColor(...categoryGold);

        doc.roundedRect(
            48,
            6,
            29,
            7,
            1.5,
            1.5,
            "F"
        );


        doc.setTextColor(...BLACK);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(5.2);

        doc.text(
            categoryText,
            62.5,
            10.3,
            {
                align: "center"
            }
        );


        // =====================================================
        // HEADER DIVIDER
        // =====================================================

        doc.setDrawColor(
            100,
            90,
            60
        );

        doc.setLineWidth(0.25);

        doc.line(
            5,
            16,
            80,
            16
        );


        // =====================================================
        // EVENT NAME
        // =====================================================

        doc.setTextColor(...WHITE);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(7.5);


        let eventDisplay = eventName;

        if (eventDisplay.length > 32) {

            eventDisplay =
                eventDisplay.substring(
                    0,
                    32
                ) + "...";

        }


        doc.text(
            eventDisplay,
            7,
            21
        );


        // =====================================================
        // EVENT DETAILS
        // =====================================================

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(4.6);

        doc.setTextColor(...GREY);


        doc.text(
            "DATE",
            7,
            26
        );

        doc.text(
            eventDate,
            7,
            29
        );


        doc.text(
            "VENUE",
            25,
            26
        );

        let venueDisplay = venue;

        if (venueDisplay.length > 23) {

            venueDisplay =
                venueDisplay.substring(
                    0,
                    23
                ) + "...";

        }

        doc.text(
            venueDisplay,
            25,
            29
        );


        doc.text(
            "QTY",
            58,
            26
        );

        doc.setTextColor(...WHITE);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(6);

        doc.text(
            String(quantity),
            58,
            29
        );


        // =====================================================
        // ATTENDEE
        // =====================================================

        doc.setTextColor(...GREY);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(4.3);

        doc.text(
            "ATTENDEE",
            7,
            34
        );


        doc.setTextColor(...WHITE);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(6.5);


        let nameDisplay = name;

        if (nameDisplay.length > 25) {

            nameDisplay =
                nameDisplay.substring(
                    0,
                    25
                ) + "...";

        }


        doc.text(
            nameDisplay,
            7,
            38
        );


        // =====================================================
        // PHONE
        // =====================================================

        doc.setTextColor(...GREY);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(4.3);

        doc.text(
            "PHONE",
            7,
            42
        );


        doc.setTextColor(...WHITE);

        doc.setFontSize(5.2);

        doc.text(
            phone,
            7,
            45
        );


        // =====================================================
        // AMOUNT
        // =====================================================

        doc.setTextColor(...GREY);

        doc.setFontSize(4.3);

        doc.text(
            "AMOUNT PAID",
            35,
            42
        );


        doc.setTextColor(...categoryGold);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(7);

        doc.text(
            "Rs. " + amount,
            35,
            46
        );


        // =====================================================
        // TICKET ID
        // =====================================================

        doc.setTextColor(...GREY);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(4);

        doc.text(
            "TICKET ID",
            53,
            34
        );


        doc.setTextColor(...WHITE);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(4.5);


        let ticketDisplay = ticketId;

        if (ticketDisplay.length > 17) {

            ticketDisplay =
                ticketDisplay.substring(
                    0,
                    17
                );

        }


        doc.text(
            ticketDisplay,
            53,
            37.5
        );


        // =====================================================
        // PAYMENT ID
        // =====================================================

        doc.setTextColor(...GREY);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(3.8);

        doc.text(
            "PAYMENT",
            53,
            41.5
        );


        doc.setTextColor(...WHITE);

        doc.setFontSize(3.8);


        let paymentDisplay = paymentId;

        if (paymentDisplay.length > 18) {

            paymentDisplay =
                paymentDisplay.substring(
                    0,
                    18
                );

        }


        doc.text(
            paymentDisplay,
            53,
            44.5
        );


        // =====================================================
        // VERIFIED
        // =====================================================

        doc.setFillColor(...GREEN);

        doc.roundedRect(
            53,
            46,
            20,
            4.2,
            1,
            1,
            "F"
        );


        doc.setTextColor(...WHITE);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(3.8);

        doc.text(
            "✓ VERIFIED",
            63,
            48.8,
            {
                align: "center"
            }
        );


        // =====================================================
        // SECURITY CODE
        // =====================================================

        const securityCode =
            Math.random()
                .toString(36)
                .substring(2, 10)
                .toUpperCase();


        // =====================================================
        // QR DATA
        // =====================================================

        const qrData =
            `TRIBAL RHYTHM
Event: ${eventName}
Ticket ID: ${ticketId}
Name: ${name}
Phone: ${phone}
Category: ${category}
Quantity: ${quantity}
Amount: Rs.${amount}
Payment: ${paymentId}
Security: ${securityCode}`;


        // =====================================================
        // QR CONTAINER
        // =====================================================

        const qrDiv =
            document.createElement("div");


        qrDiv.style.position =
            "absolute";

        qrDiv.style.left =
            "-9999px";


        document.body.appendChild(
            qrDiv
        );


        // =====================================================
        // GENERATE QR
        // =====================================================

        new QRCode(
            qrDiv,
            {
                text: qrData,

                width: 250,

                height: 250,

                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );


        // =====================================================
        // BARCODE CONTAINER
        // =====================================================

        const barcodeCanvas =
            document.createElement(
                "canvas"
            );


        barcodeCanvas.style.position =
            "absolute";

        barcodeCanvas.style.left =
            "-9999px";


        document.body.appendChild(
            barcodeCanvas
        );


        // =====================================================
        // BARCODE DATA
        // =====================================================

        const barcodeData =
            ticketId !== "N/A"
                ? ticketId
                : securityCode;


        // =====================================================
        // GENERATE BARCODE
        // =====================================================

        JsBarcode(
            barcodeCanvas,
            barcodeData,
            {
                format: "CODE128",

                width: 2,

                height: 45,

                displayValue: true,

                fontSize: 12,

                margin: 5,

                background: "#ffffff",

                lineColor: "#000000"
            }
        );


        // =====================================================
        // SAVE PDF AFTER ASSETS READY
        // =====================================================

        logo.onload = function () {

            try {

                // =================================================
                // ADD LOGO
                // =================================================

                doc.addImage(
                    logo,
                    "PNG",
                    76,
                    16.8,
                    4.5,
                    4.5
                );

            }

            catch (logoError) {

                console.warn(
                    "Logo error:",
                    logoError
                );

            }


            // =================================================
            // QR
            // =================================================

            setTimeout(
                function () {

                    try {

                        const qrCanvas =
                            qrDiv.querySelector(
                                "canvas"
                            );


                        if (qrCanvas) {

                            doc.addImage(
                                qrCanvas.toDataURL(
                                    "image/png"
                                ),
                                "PNG",
                                75,
                                23,
                                6.5,
                                6.5
                            );

                        }

                    }

                    catch (qrError) {

                        console.error(
                            "QR Error:",
                            qrError
                        );

                    }


                    // =================================================
                    // BARCODE
                    // =================================================

                    try {

                        doc.addImage(
                            barcodeCanvas.toDataURL(
                                "image/png"
                            ),
                            "PNG",
                            7,
                            47.5,
                            40,
                            5
                        );

                    }

                    catch (barcodeError) {

                        console.error(
                            "Barcode Error:",
                            barcodeError
                        );

                    }


                    // =================================================
                    // CLEANUP
                    // =================================================

                    qrDiv.remove();

                    barcodeCanvas.remove();


                    // =================================================
                    // SAVE
                    // =================================================

                    doc.save(
                        "TribalRhythm-" +
                        ticketId +
                        ".pdf"
                    );


                },
                500
            );

        };


        // =====================================================
        // LOGO ERROR
        // =====================================================

        logo.onerror = function () {

            console.warn(
                "Logo not loaded."
            );


            setTimeout(
                function () {

                    try {

                        const qrCanvas =
                            qrDiv.querySelector(
                                "canvas"
                            );


                        if (qrCanvas) {

                            doc.addImage(
                                qrCanvas.toDataURL(
                                    "image/png"
                                ),
                                "PNG",
                                75,
                                23,
                                6.5,
                                6.5
                            );

                        }


                        // =============================================
                        // BARCODE
                        // =============================================

                        doc.addImage(
                            barcodeCanvas.toDataURL(
                                "image/png"
                            ),
                            "PNG",
                            7,
                            47.5,
                            40,
                            5
                        );


                    }

                    catch (error) {

                        console.error(
                            "Ticket asset error:",
                            error
                        );

                    }


                    qrDiv.remove();

                    barcodeCanvas.remove();


                    doc.save(
                        "TribalRhythm-" +
                        ticketId +
                        ".pdf"
                    );


                },
                500
            );

        };


    }

    catch (error) {

        console.error(
            "GENERATE PDF ERROR:",
            error
        );


        Swal.fire(
            "PDF Error",
            "Unable to generate ticket PDF.",
            "error"
        );

    }

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



// ================= TICKET PHONE VALIDATION =================
const ticketPhoneInput = document.getElementById("ticketPhone");

if (ticketPhoneInput) {
    ticketPhoneInput.addEventListener("input", function () {
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }

        const phoneWarning = document.getElementById("phoneWarning");

        if (phoneWarning) {
            phoneWarning.style.display =
                this.value.length === 10 ? "none" : "block";
        }
    });
}


// ================= EMAIL CHANGE SECURITY =================
const ticketEmailInput = document.getElementById("ticketEmail");

if (ticketEmailInput) {
    ticketEmailInput.addEventListener("input", function () {
        const verifiedEmail = localStorage.getItem("ticketEmail");
        const currentEmail = this.value.trim().toLowerCase();

        if (verifiedEmail && verifiedEmail !== currentEmail) {
            localStorage.removeItem("ticketVerified");
            localStorage.removeItem("ticketEmail");

            const verifiedMessage =
                document.getElementById("otpVerifiedMessage");

            if (verifiedMessage) {
                verifiedMessage.style.display = "none";
            }

            Swal.fire(
                "Tribal Rhythm",
                "Email changed. Please verify OTP again.",
                "warning"
            );
        }
    });
}



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





// document.addEventListener("DOMContentLoaded", function () {
//     updateCountdown();
//     setInterval(updateCountdown, 1000);
// });




// ================= SELECT TICKET PASS =================
window.selectTicket = function (ticketType) {
    const radio = document.querySelector(
        `input[name="ticketType"][value="${ticketType}"]`
    );

    if (radio) {
        radio.checked = true;
    }

    const ticketPrices = {
        General: "₹499",
        VIP: "₹999",
        Group: "₹399 / Person"
    };

    const selectedTicketText =
        document.getElementById("selectedTicketText");

    if (selectedTicketText) {
        selectedTicketText.innerHTML =
            `<b>${ticketType} Pass Selected</b><br>Price: <b>${ticketPrices[ticketType]}</b>`;
    }

    document.getElementById("ticketFormBox").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
};





window.bookNow = function () {

    if (typeof window.payNow === "function") {
        window.payNow();
    } else {
        console.error("payNow() function not found.");
    }

};







// document.addEventListener("DOMContentLoaded", function () {

//     if (typeof window.loadUpcoming === "function") {
//         window.loadUpcoming();
//     }

// });



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