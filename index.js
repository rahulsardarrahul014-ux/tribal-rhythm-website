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

        // ===============================
        // CHECK LIBRARIES
        // ===============================

        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error("jsPDF library not found.");
            Swal.fire(
                "PDF Error",
                "PDF library is not loaded.",
                "error"
            );
            return;
        }

        if (typeof QRCode === "undefined") {
            console.error("QRCode library not found.");
            Swal.fire(
                "PDF Error",
                "QR Code library is not loaded.",
                "error"
            );
            return;
        }


        const { jsPDF } = window.jspdf;

        const doc = new jsPDF();

        // ===============================
        // SAFE VALUES
        // ===============================

        name = String(name || "Guest");
        phone = String(phone || "");
        type = String(type || "General");
        paymentId = String(paymentId || "N/A");
        ticketId = String(ticketId || "N/A");
        eventName = String(eventName || "Tribal Rhythm Event");
        venue = String(venue || "Rairangpur, Odisha");
        eventDate = String(eventDate || "Date Not Announced");
        quantity = Number(quantity) || 1;
        amount = Number(amount) || 0;


        // ===============================
        // LOGO
        // ===============================

        const logo = new Image();

        logo.src = "tribalweblogo.png";

        // const signature = new Image();
        // signature.src = "rahul-signature.png";


        // ===============================
        // PAGE BORDER
        // ===============================

        doc.setDrawColor(212, 175, 55);
        doc.setLineWidth(2);

        doc.roundedRect(
            5,
            5,
            200,
            287,
            5,
            5
        );


        // ===============================
        // INNER BORDER
        // ===============================

        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(0.5);

        doc.roundedRect(
            8,
            8,
            194,
            281,
            4,
            4
        );


        // ===============================
        // HEADER BACKGROUND
        // ===============================

        doc.setFillColor(18, 18, 18);

        doc.rect(
            5,
            5,
            200,
            35,
            "F"
        );


        // ===============================
        // GOLD HEADER LINE
        // ===============================

        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(1.5);

        doc.line(
            5,
            40,
            205,
            40
        );


        // ===============================
        // HEADER TITLE
        // ===============================

        doc.setTextColor(255, 215, 0);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(22);

        doc.text(
            "TRIBAL RHYTHM",
            60,
            20
        );


        // ===============================
        // SUBTITLE
        // ===============================

        doc.setFontSize(11);

        doc.text(
            "OFFICIAL EVENT ENTRY PASS",
            60,
            28
        );


        // ===============================
        // VERIFIED
        // ===============================

        doc.setFontSize(9);

        doc.text(
            "Verified Digital Ticket",
            60,
            34
        );


        // ===============================
        // POWERED BY
        // ===============================

        doc.setFontSize(8);

        doc.setTextColor(
            220,
            220,
            220
        );

        doc.text(
            "Powered by Zentro Nex",
            60,
            38
        );


        // ===============================
        // RESET COLOR
        // ===============================

        doc.setTextColor(
            0,
            0,
            0
        );


        // ===============================
        // DIVIDER
        // ===============================

        doc.setDrawColor(
            180,
            180,
            180
        );

        doc.line(
            20,
            48,
            190,
            48
        );


        // ===============================
        // ATTENDEE DETAILS
        // ===============================

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(15);

        doc.text(
            "ATTENDEE DETAILS",
            20,
            58
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(11);


        // NAME

        doc.text(
            "Name :",
            20,
            70
        );

        doc.text(
            name,
            60,
            70
        );


        // PHONE

        doc.text(
            "Phone :",
            20,
            80
        );

        doc.text(
            phone,
            60,
            80
        );


        // TICKET

        doc.text(
            "Ticket :",
            20,
            90
        );

        doc.text(
            type,
            60,
            90
        );


        // QUANTITY

        doc.text(
            "Quantity :",
            20,
            100
        );

        doc.text(
            String(quantity),
            60,
            100
        );


        // PAYMENT ID

        doc.text(
            "Payment ID :",
            20,
            110
        );

        doc.setFontSize(9);

        doc.text(
            paymentId,
            60,
            110
        );


        // ===============================
        // EVENT BOX
        // ===============================

        doc.setFillColor(
            245,
            245,
            245
        );

        doc.roundedRect(
            20,
            120,
            170,
            42,
            3,
            3,
            "F"
        );


        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(13);

        doc.text(
            "EVENT DETAILS",
            28,
            130
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(10);


        // EVENT

        doc.text(
            "Event : " + eventName,
            28,
            140
        );


        // VENUE

        doc.text(
            "Venue : " + venue,
            28,
            148
        );


        // DATE

        doc.text(
            "Date : " + eventDate,
            28,
            156
        );


        // ===============================
        // WATERMARK
        // ===============================

        doc.setTextColor(
            235,
            235,
            235
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(28);


        for (
            let y = 30;
            y <= 280;
            y += 35
        ) {

            doc.text(
                "TRIBAL RHYTHM",
                15,
                y,
                {
                    angle: 45
                }
            );

        }


        // ===============================
        // RESET
        // ===============================

        doc.setTextColor(
            0,
            0,
            0
        );


        // ===============================
        // SECURITY GRID
        // ===============================

        doc.setDrawColor(
            240,
            240,
            240
        );

        doc.setLineWidth(0.2);


        for (
            let x = 10;
            x <= 200;
            x += 8
        ) {

            doc.line(
                x,
                40,
                x,
                285
            );

        }


        for (
            let y = 40;
            y <= 285;
            y += 8
        ) {

            doc.line(
                10,
                y,
                200,
                y
            );

        }


        // ===============================
        // GOLD SECURITY LINE
        // ===============================

        doc.setDrawColor(
            255,
            215,
            0
        );

        doc.setLineWidth(0.8);

        doc.line(
            15,
            168,
            195,
            168
        );


        // ===============================
        // SECURITY CODE
        // ===============================

        const securityCode =
            Math.random()
                .toString(36)
                .substring(2, 10)
                .toUpperCase();


        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.text(
            "Security Code : " +
            securityCode,
            20,
            178
        );


        // ===============================
        // TICKET ID
        // ===============================

        doc.text(
            "Ticket ID : " +
            ticketId,
            20,
            188
        );


        // ===============================
        // VERIFIED STAMP
        // ===============================

        doc.setFillColor(
            0,
            170,
            70
        );

        doc.circle(
            170,
            175,
            13,
            "F"
        );


        doc.setTextColor(
            255,
            255,
            255
        );

        doc.setFontSize(9);

        doc.text(
            "VERIFIED",
            158,
            177
        );


        // ===============================
        // RESET COLOR
        // ===============================

        doc.setTextColor(
            0,
            0,
            0
        );


        // ===============================
        // QR CODE DATA
        // ===============================

        const qrData =
            `TRIBAL RHYTHM
Event : ${eventName}
Ticket ID : ${ticketId}
Name : ${name}
Phone : ${phone}
Ticket : ${type}
Quantity : ${quantity}
Amount : ₹${amount}
Payment : ${paymentId}
Security : ${securityCode}`;


        // ===============================
        // QR CONTAINER
        // ===============================

        const qrDiv =
            document.createElement("div");

        qrDiv.style.position =
            "absolute";

        qrDiv.style.left =
            "-9999px";

        document.body.appendChild(
            qrDiv
        );


        // ===============================
        // GENERATE QR
        // ===============================

        new QRCode(
            qrDiv,
            {
                text: qrData,
                width: 150,
                height: 150,
                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );


        // ===============================
        // ENTRY STATUS
        // ===============================

        doc.setTextColor(
            0,
            130,
            0
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(13);

        doc.text(
            "ENTRY STATUS : VERIFIED",
            20,
            214
        );


        // ===============================
        // RESET
        // ===============================

        doc.setTextColor(
            0,
            0,
            0
        );


        // ===============================
        // SECURITY NOTICE
        // ===============================

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(9);


        doc.text(
            "✓ QR Verification Required",
            20,
            224
        );


        doc.text(
            "✓ Duplicate Ticket Invalid",
            20,
            231
        );


        doc.text(
            "✓ Tampered Ticket Rejected",
            20,
            238
        );


        doc.text(
            "✓ Carry Valid Photo ID",
            20,
            245
        );


        // ===============================
        // AMOUNT
        // ===============================

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.text(
            "Amount Paid : ₹" +
            amount,
            20,
            252
        );


        // ===============================
        // IMPORTANT RULES
        // ===============================

        doc.setDrawColor(
            255,
            215,
            0
        );

        doc.setLineWidth(0.8);

        doc.line(
            20,
            258,
            190,
            258
        );


        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(9);

        doc.text(
            "IMPORTANT RULES",
            20,
            266
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(7.5);


        doc.text(
            "• Carry a valid Photo ID.",
            20,
            272
        );


        doc.text(
            "• QR Code must be scanned at entry.",
            20,
            277
        );


        doc.text(
            "• Duplicate or edited tickets may be rejected.",
            20,
            282
        );


        // ===============================
        // RAHUL SARDAR REAL HAND SIGNATURE
        // ===============================

        const signature = new Image();

        signature.src = "rahul-signature.png";


        // ===============================
        // FOOTER
        // ===============================

        doc.setFontSize(7);

        doc.setTextColor(
            100,
            100,
            100
        );

        doc.text(
            "Official Ticket - Tribal Rhythm",
            20,
            288
        );


        doc.text(
            "TR-V3.0",
            180,
            288
        );


        // ===============================
        // VIP BADGE
        // ===============================

        doc.setFillColor(
            255,
            215,
            0
        );

        doc.circle(
            180,
            40,
            10,
            "F"
        );


        doc.setTextColor(
            0,
            0,
            0
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(7);

        doc.text(
            type === "VIP"
                ? "VIP"
                : "PASS",
            175,
            42
        );


        // ===============================
        // OFFICIAL SEAL
        // ===============================

        doc.setDrawColor(
            255,
            180,
            0
        );

        doc.setLineWidth(1);

        doc.circle(
            180,
            65,
            12
        );


        doc.setFontSize(6.5);

        doc.text(
            "TRIBAL",
            174,
            62
        );

        doc.text(
            "RHYTHM",
            172,
            66
        );

        doc.text(
            "OFFICIAL",
            171,
            70
        );


        // ===============================
        // LOGO LOAD
        // ===============================

        logo.onload = function () {

            try {

                doc.addImage(
                    logo,
                    "PNG",
                    15,
                    10,
                    28,
                    28
                );

            } catch (logoError) {

                console.warn(
                    "Logo could not be added:",
                    logoError
                );

            }


            // ===============================
            // ADD QR CODE
            // ===============================

            setTimeout(
                function () {

                    try {

                        const qrCanvas =
                            qrDiv.querySelector(
                                "canvas"
                            );

                        const qrImage =
                            qrDiv.querySelector(
                                "img"
                            );


                        if (qrCanvas) {

                            doc.addImage(
                                qrCanvas.toDataURL(
                                    "image/png"
                                ),
                                "PNG",
                                145,
                                185,
                                40,
                                40
                            );

                        } else if (qrImage) {

                            doc.addImage(
                                qrImage.src,
                                "PNG",
                                145,
                                185,
                                40,
                                40
                            );

                        }


                    } catch (qrError) {

                        console.error(
                            "QR Error:",
                            qrError
                        );

                    }


                    // ===============================
                    // REMOVE QR CONTAINER
                    // ===============================

                    qrDiv.remove();


                    // ===============================
                    // SAVE PDF
                    // ===============================

                    doc.save(
                        "TribalRhythm-" +
                        ticketId +
                        ".pdf"
                    );

                },
                300
            );

        };


        // ===============================
        // LOGO ERROR
        // ===============================

        logo.onerror = function () {

            console.warn(
                "Logo not loaded. Saving PDF without logo."
            );


            setTimeout(
                function () {

                    try {

                        const qrCanvas =
                            qrDiv.querySelector(
                                "canvas"
                            );

                        const qrImage =
                            qrDiv.querySelector(
                                "img"
                            );


                        if (qrCanvas) {

                            doc.addImage(
                                qrCanvas.toDataURL(
                                    "image/png"
                                ),
                                "PNG",
                                145,
                                185,
                                40,
                                40
                            );

                        } else if (qrImage) {

                            doc.addImage(
                                qrImage.src,
                                "PNG",
                                145,
                                185,
                                40,
                                40
                            );

                        }

                    } catch (error) {

                        console.error(
                            "QR Error:",
                            error
                        );

                    }


                    qrDiv.remove();


                    doc.save(
                        "TribalRhythm-" +
                        ticketId +
                        ".pdf"
                    );

                },
                300
            );

        };

    } catch (error) {

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





document.addEventListener("DOMContentLoaded", function () {
    updateCountdown();
    setInterval(updateCountdown, 1000);
});




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