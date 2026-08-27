
import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getFirestore,
    collection,
    onSnapshot,
    updateDoc,
    deleteDoc,
    setDoc,
    doc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where
}
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    updatePassword,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
}
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const API_BASE =
    "https://tribal-rhythm-backend.onrender.com";

/* 🔥 FIREBASE CONFIG */
const firebaseConfig = {
    apiKey: "AIzaSyDeXDwM5_DASJCYqefJbQ-u_B-g1MTPjXM",
    authDomain: "tribalrhythm-486bd.firebaseapp.com",
    projectId: "tribalrhythm-486bd",
    storageBucket: "tribalrhythm-486bd.firebasestorage.app",
    messagingSenderId: "566528037279",
    appId: "1:566528037279:web:b475312ea2c721d4fd2daa"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);
const storage = getStorage(app);

const OWNER_EMAIL =
    "rahulsardarrahul014@gmail.com";

/* ================= MOBILE INPUT LIMIT ================= */

function setupMobileLimit(inputId) {

    const input = document.getElementById(inputId);

    if (!input) return;

    input.addEventListener("input", function () {

        // Only numbers
        this.value = this.value.replace(/\D/g, "");

        // Maximum 10 digits
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }

    });

}

setupMobileLimit("mobile");
setupMobileLimit("whatsapp");


/* ================= ADMIN SECURITY ================= */

// const OWNER_EMAIL = "rahulsardarrahul014@gmail.com";

async function isApprovedAdmin() {

    const user = auth.currentUser;

    if (!user) {
        return false;
    }

    // Owner email check
    if (user.email !== OWNER_EMAIL) {
        return false;
    }

    // Email verification
    if (!user.emailVerified) {
        return false;
    }

    // Admin Firestore document check
    const adminSnap = await getDoc(
        doc(db, "admins", user.uid)
    );

    if (!adminSnap.exists()) {
        return false;
    }

    const admin = adminSnap.data();

    if (admin.status !== "Active") {
        return false;
    }

    if (admin.approvalStatus !== "Approved") {
        return false;
    }

    return true;
}





/* ================= SWEETALERT HELPERS ================= */

function showSuccess(message, title = "Success") {
    return Swal.fire({
        icon: "success",
        title: title,
        text: message,
        confirmButtonText: "OK",
        confirmButtonColor: "#d4af37"
    });
}

function showError(message, title = "Error") {
    return Swal.fire({
        icon: "error",
        title: title,
        text: message,
        confirmButtonText: "OK",
        confirmButtonColor: "#d4af37"
    });
}

function showWarning(message, title = "Warning") {
    return Swal.fire({
        icon: "warning",
        title: title,
        text: message,
        confirmButtonText: "OK",
        confirmButtonColor: "#d4af37"
    });
}

function showInfo(message, title = "Information") {
    return Swal.fire({
        icon: "info",
        title: title,
        text: message,
        confirmButtonText: "OK",
        confirmButtonColor: "#d4af37"
    });
}

/* ✅ AUTH STATE */


/* ✅ OWNER ONLY AUTH STATE */
onAuthStateChanged(auth, async (user) => {

    if (!user) {

        document.getElementById("login").style.display =
            "flex";

        document.getElementById("side").style.display =
            "none";

        document.getElementById("main").style.display =
            "none";

        return;
    }

    /* 🔒 OWNER ONLY */
    if (user.email !== OWNER_EMAIL) {

        await showError(
            "Only the owner can access the Admin Panel.",
            "Access Denied"
        );

        await signOut(auth);


        document.getElementById("login").style.display =
            "flex";

        document.getElementById("side").style.display =
            "none";

        document.getElementById("main").style.display =
            "none";

        return;
    }

    /* ✅ OWNER */
    start();

});

let chart;
let otpVerified = false;
let otpTime = 60;
let otpInterval = null;







/* ================= LOGIN ================= */

window.login = async () => {



    const emailValue =
        document.getElementById("email").value.trim();

    const passValue =
        document.getElementById("password").value.trim();

    if (!emailValue || !passValue) {

        document.getElementById("msg").innerText =
            "Fill all fields";
        return;

    }



    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                emailValue,
                passValue
            );

        const user = userCredential.user;

        if (user.email !== OWNER_EMAIL) {

            showError("Owner access only", "Access Denied");

            await signOut(auth);

            return;
        }

        if (!user.emailVerified) {
            showWarning("Please verify your email first.");
            await signOut(auth);
            return;
        }

        console.log("Login success:", user.email);

        // 🔒 ADMIN CHECK
        const adminSnap =
            await getDoc(
                doc(db, "admins", user.uid)
            );

        if (!adminSnap.exists()) {
            showError("Admin record is missing.");
            await signOut(auth);
            return;
        }

        const admin = adminSnap.data();

        if (admin.status !== "Active") {
            showError("This admin account is disabled.", "Account Disabled");
            await signOut(auth);
            return;
        }

        if (admin.approvalStatus !== "Approved") {
            showWarning("Admin approval is still pending.", "Approval Pending");
            await signOut(auth);
            return;
        }

        start();

    }

    catch (error) {

        console.log(error);

        if (error.code === "auth/invalid-credential") {

            showError(
                "Wrong Email or Password",
                "Login Failed"
            );

        }
        else if (error.code === "auth/user-not-found") {

            showError(
                "Admin account not found.",
                "Login Failed"
            );

        }
        else {

            showError(
                error.message,
                "Login Failed"
            );

        }

    }

};

window.resetPass = () => {

    const emailValue =
        document.getElementById("email")
            .value
            .trim();

    if (!emailValue) {

        showWarning(
            "Please enter your email address.",
            "Email Required"
        );

        return;
    }

    sendPasswordResetEmail(auth, emailValue)

        .then(() => {

            showSuccess(
                "Password reset email has been sent.",
                "Reset Email Sent"
            );

        })

        .catch((e) => {

            showError(e.message);

        });

};
window.signup = async (event) => {

    // 🔥 IMPORTANT: Form submit ko page reload karne se roko
    if (event) {
        event.preventDefault();
    }

    console.log("🔥 CREATE ADMIN ACCOUNT BUTTON CLICKED");

    // ==============================
    // 1. OTP CHECK
    // ==============================

    if (!otpVerified) {

        showWarning(
            "Please verify Email OTP first.",
            "OTP Verification Required"
        );

        return;
    }

    // ==============================
    // 2. GET FORM VALUES
    // ==============================

    const emailElement =
        document.getElementById("email");

    const passwordElement =
        document.getElementById("password");

    const adminNameElement =
        document.getElementById("adminName");

    const mobileElement =
        document.getElementById("mobile");

    const whatsappElement =
        document.getElementById("whatsapp");

    const roleElement =
        document.getElementById("role");

    const idTypeElement =
        document.getElementById("idType");

    const idNumberElement =
        document.getElementById("idNumber");

    // 🔥 ELEMENT CHECK
    if (
        !emailElement ||
        !passwordElement ||
        !adminNameElement ||
        !mobileElement ||
        !roleElement ||
        !idTypeElement ||
        !idNumberElement
    ) {

        showError(
            "Some registration form fields are missing. Please check admin.html.",
            "Form Error"
        );

        console.error("❌ Required form element missing");

        return;
    }

    const emailValue =
        emailElement.value.trim();

    const passValue =
        passwordElement.value.trim();

    const adminName =
        adminNameElement.value.trim();

    const mobile =
        mobileElement.value.trim();

    const whatsapp =
        whatsappElement?.value.trim() || "";

    const role =
        roleElement.value;

    const idType =
        idTypeElement.value;

    const idNumber =
        idNumberElement.value.trim();

    const photoFile =
        document.getElementById("profilePhoto")?.files[0];

    const idFile =
        document.getElementById("idProof")?.files[0];

    // ==============================
    // 3. REQUIRED FIELD CHECK
    // ==============================

    if (
        !emailValue ||
        !passValue ||
        !adminName ||
        !mobile ||
        !idType ||
        !idNumber
    ) {

        showWarning(
            "Please fill all required fields.",
            "Missing Information"
        );

        return;
    }

    // ==============================
    // 4. OWNER EMAIL CHECK
    // ==============================

    if (emailValue.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {

        showError(
            "Only the owner email can create an admin account.",
            "Access Denied"
        );

        return;
    }

    // ==============================
    // 5. MOBILE VALIDATION
    // ==============================

    if (!mobile) {

        showWarning(
            "Please enter your mobile number.",
            "Mobile Number Required"
        );

        mobileElement.focus();

        return;
    }

    if (mobile.length !== 10) {

        showWarning(
            "Mobile number must contain exactly 10 digits.",
            "Invalid Mobile Number"
        );

        mobileElement.focus();

        return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {

        showWarning(
            "Please enter a valid Indian mobile number starting with 6, 7, 8 or 9.",
            "Invalid Mobile Number"
        );

        mobileElement.focus();

        return;
    }

    // ==============================
    // 6. PASSWORD VALIDATION
    // ==============================

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(passValue)) {

        showWarning(
            "Password must contain at least 8 characters, uppercase, lowercase, number and special character.",
            "Weak Password"
        );

        return;
    }

    // ==============================
    // 7. CONFIRM PASSWORD
    // ==============================

    const confirmPassword =
        document.getElementById("confirmPassword")?.value.trim();

    if (!confirmPassword) {

        showWarning(
            "Please enter confirm password.",
            "Password Required"
        );

        return;
    }

    if (passValue !== confirmPassword) {

        showError(
            "Password and Confirm Password do not match.",
            "Password Mismatch"
        );

        return;
    }

    // ==============================
    // 8. CREATE FIREBASE AUTH ACCOUNT
    // ==============================

    let user = null;

    try {

        Swal.fire({
            title: "Creating Admin Account...",
            text: "Please wait while your account is being created.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                emailValue,
                passValue
            );

        user =
            userCredential.user;

        console.log(
            "✅ Firebase Auth account created:",
            user.uid
        );

        // ==============================
        // 9. PROFILE PHOTO UPLOAD
        // ==============================

        let photoURL = "";

        if (photoFile) {

            const photoRef = ref(
                storage,
                "admins/profile/" +
                user.uid +
                "/" +
                Date.now() +
                "_" +
                photoFile.name
            );

            await uploadBytes(
                photoRef,
                photoFile
            );

            photoURL =
                await getDownloadURL(photoRef);
        }

        // ==============================
        // 10. ID PROOF UPLOAD
        // ==============================

        let idProofURL = "";

        if (idFile) {

            const idRef = ref(
                storage,
                "admins/idproof/" +
                user.uid +
                "/" +
                Date.now() +
                "_" +
                idFile.name
            );

            await uploadBytes(
                idRef,
                idFile
            );

            idProofURL =
                await getDownloadURL(idRef);
        }

        // ==============================
        // 11. FIRESTORE ADMIN DATA
        // ==============================

        await setDoc(
            doc(db, "admins", user.uid),
            {

                uid: user.uid,

                adminName: adminName,

                email: user.email,

                mobile: mobile,

                whatsapp: whatsapp,

                role: role,

                idType: idType,

                idNumber: idNumber,

                idProofURL: idProofURL,

                profilePhotoURL: photoURL,

                approvalStatus: "Pending",

                emailVerified: false,

                status: "Pending",

                createdAt: new Date()

            }
        );

        console.log(
            "✅ Admin Firestore document created."
        );

        // ==============================
        // 12. FIREBASE EMAIL VERIFICATION
        // ==============================

        await sendEmailVerification(user);

        // ==============================
        // 13. SUCCESS SWEETALERT
        // ==============================

        await Swal.fire({
            icon: "success",
            title: "🎉 Admin Account Created",
            html: `
                <div style="text-align:left">
                    <b>Admin:</b> ${adminName}<br>
                    <b>Email:</b> ${emailValue}<br>
                    <b>Status:</b> Pending Approval<br><br>

                    Verification email has been sent to your email address.
                    <br><br>

                    Please verify your email and wait for owner approval.
                </div>
            `,
            confirmButtonText: "OK",
            confirmButtonColor: "#d4af37"
        });

        // ==============================
        // 14. LOGOUT
        // ==============================

        await signOut(auth);

        // ==============================
        // 15. RESET FORM
        // ==============================

        document
            .getElementById("adminRegistrationForm")
            ?.reset();

        otpVerified = false;

    } catch (e) {

        console.error(
            "❌ Admin signup error:",
            e
        );

        // Loading SweetAlert close
        Swal.close();

        // ==============================
        // CLEANUP AUTH ACCOUNT
        // ==============================

        if (user) {

            try {

                await deleteUser(user);

                console.log(
                    "Auth account deleted because signup failed."
                );

            } catch (deleteError) {

                console.error(
                    "Account cleanup failed:",
                    deleteError
                );
            }
        }

        // ==============================
        // ERROR SWEETALERT
        // ==============================

        if (e.code === "auth/email-already-in-use") {

            showError(
                "This email already has a Firebase account.",
                "Account Already Exists"
            );

        }

        else if (e.code === "auth/invalid-email") {

            showError(
                "Please enter a valid email address.",
                "Invalid Email"
            );

        }

        else if (e.code === "auth/weak-password") {

            showError(
                "Firebase rejected this password. Please use a stronger password.",
                "Weak Password"
            );

        }

        else {

            showError(
                e.message ||
                "Admin account creation failed.",
                "Signup Failed"
            );
        }
    }
};


/* ================= ADMIN FORM SUBMIT ================= */

document
    .getElementById("adminRegistrationForm")
    ?.addEventListener("submit", signup);



window.logout = () => {

    signOut(auth)
        .then(() => {

            location.reload();

        });

};



window.changePassword = async () => {

    const newPass =
        document.getElementById("newPassword")?.value.trim();

    if (!newPass) {

        showWarning(
            "Please enter a new password.",
            "Password Required"
        );

        return;
    }

    if (!auth.currentUser) {

        showError(
            "Please login first.",
            "Login Required"
        );

        return;
    }

    try {

        await updatePassword(
            auth.currentUser,
            newPass
        );

        showSuccess(
            "Your password has been updated successfully.",
            "Password Updated"
        );

    } catch (error) {

        console.error(error);

        showError(
            error.message,
            "Password Update Failed"
        );

    }
};



/* ================= START ================= */

async function start() {

    const allowed = await isApprovedAdmin();

    if (!allowed) {

        await signOut(auth);

        document.getElementById("login").style.display = "flex";
        document.getElementById("side").style.display = "none";
        document.getElementById("main").style.display = "none";

        showError(
            "You are not authorized to access the Admin Panel.",
            "Access Denied"
        );

        return;
    }

    // Existing start() code continues here

    const loginDiv = document.getElementById("login");
    const sideDiv = document.getElementById("side");
    const mainDiv = document.getElementById("main");
    const snap =
        await getDoc(
            doc(db, "admins", auth.currentUser.uid)
        );

    const admin = snap.data();

    const adminWelcome = document.getElementById("adminWelcome");
    const adminInfo = document.getElementById("adminInfo");
    const adminPhoto = document.getElementById("adminPhoto");

    if (adminWelcome) {
        adminWelcome.innerHTML =
            `Welcome ${admin.adminName || "Admin"}`;
    }

    if (adminInfo) {
        const lastLogin = admin.lastLogin?.toDate
            ? admin.lastLogin.toDate()
            : (admin.lastLogin ? new Date(admin.lastLogin) : null);

        adminInfo.innerHTML = `
                    ${admin.email || ""}<br>
                    Role: ${admin.role || "Admin"}<br>
                    Last Login:
                    ${lastLogin ? lastLogin.toLocaleString() : "N/A"}
                `;
    }

    if (adminPhoto) {
        adminPhoto.src =
            admin.profilePhotoURL || "user.png";
    }

    if (loginDiv) loginDiv.style.display = "none";
    if (sideDiv) sideDiv.style.display = "block";
    if (mainDiv) mainDiv.style.display = "block";
    // SHOW ADMIN SECTIONS AFTER LOGIN ONLY

    document.getElementById("emails").style.display = "block";
    document.getElementById("sms").style.display = "block";
    document.getElementById("notification").style.display = "block";
    document.getElementById("reports").style.display = "block";
    document.getElementById("settings").style.display = "block";
    document.getElementById("logs").style.display = "block";
    document.getElementById("backup").style.display = "block";


    startScheduler();
    loadLeaderboard();
}






/* ================= EVENT SCHEDULER ================= */

window.addEvent = async () => {
    const eventNameEl = document.getElementById("eventName");
    const startTimeEl = document.getElementById("startTime");
    const endTimeEl = document.getElementById("endTime");
    const locationEl = document.getElementById("location");

    if (!eventNameEl || !startTimeEl || !endTimeEl || !locationEl) {
        showError("Event form fields are missing.");
        return;
    }

    if (!eventNameEl.value || !startTimeEl.value || !endTimeEl.value || !locationEl.value) {
        showWarning("Fill all event fields.");
        return;
    }

    await addDoc(collection(db, "events"), {
        name: eventNameEl.value.trim(),
        start: new Date(startTimeEl.value),
        end: new Date(endTimeEl.value),
        location: locationEl.value.trim(),
        status: "upcoming"
    });

    showSuccess("Event scheduled successfully.", "Event Scheduled");
};

function startScheduler() {

    onSnapshot(collection(db, "events"), async snap => {

        let now = new Date();
        let html = "";
        let bookingOpen = false;

        for (let d of snap.docs) {

            let e = d.data();
            let status = "upcoming";

            const eventStart = e.start?.toDate
                ? e.start.toDate()
                : new Date(e.start);

            const eventEnd = e.end?.toDate
                ? e.end.toDate()
                : new Date(e.end);

            if (now >= eventStart && now <= eventEnd) {
                status = "live";
                bookingOpen = true;
            }
            else if (now > eventEnd) {
                status = "completed";
            }

            if (e.status !== status) {
                await updateDoc(doc(db, "events", d.id), { status });
            }

            html += `
            <div class="card-pro">
                <b>${e.name}</b><br>
                📍 ${e.location}<br>
                ⏰ ${new Date(e.start).toLocaleString()}<br>
                Status: <b>${status}</b>
            </div>`;
        }

        // 🔥 AUTO BOOKING CONTROL
        await updateDoc(doc(db, "settings", "competition"), {
            booking: bookingOpen ? "open" : "closed"
        });

        document.getElementById("eventList").innerHTML = html;
    });
}

/* ================= LIVE CONTROL ================= */
/* NEWS */
window.addNews = async () => {
    const newsInput = document.getElementById("newsInput");

    if (!newsInput || !newsInput.value.trim()) {

        showWarning(
            "Please enter news before adding.",
            "News Required"
        );

        return;
    }

    await addDoc(collection(db, "news"), {
        text: newsInput.value.trim(),
        time: Date.now()
    });

    newsInput.value = "";
    showSuccess(
        "News has been added successfully.",
        "News Added"
    );

};

/* 🎯 JUDGE SCORING */


window.submitScore = async () => {

    let judge = auth.currentUser?.email;

    if (!judge) {
        showWarning("Login required.");
        return;
    }

    let name = document.getElementById("pname").value.trim();
    let category = document.getElementById("pcat").value.trim();
    let score = Number(document.getElementById("pscore").value);

    if (!name || !category) {
        showWarning("Fill all scoring fields.");
        return;
    }

    if (score < 0 || score > 100) {
        showWarning("Score must be between 0 and 100.");
        return;
    }

    // 🔥 1. CHECK EVENT TIME (LIVE / CLOSED)
    let now = new Date();
    let isLive = false;

    const eventSnap = await getDocs(collection(db, "events"));

    eventSnap.forEach(d => {
        let e = d.data();

        let start = new Date(e.start);
        let end = new Date(e.end);

        if (now >= start && now <= end) {
            isLive = true;
        }
    });

    if (!isLive) {
        showError(
            "Scoring is closed or the entry is late.",
            "Scoring Closed"
        );
        return;
    }

    // 🔥 2. SETTINGS CHECK (extra safety)
    const settingsSnap = await getDoc(doc(db, "settings", "competition"));
    const settings = settingsSnap.data();

    if (settings?.booking === "closed") {
        showError(
            "Scoring has been closed by the admin.",
            "Scoring Closed"
        );
        return;
    }

    // 🔥 3. DUPLICATE BLOCK
    const q = query(
        collection(db, "scores"),
        where("name", "==", name),
        where("category", "==", category),
        where("judge", "==", judge)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
        showWarning(
            "You have already scored this participant.",
            "Duplicate Score"
        );
        return;
    }

    // ✅ SAVE SCORE
    await addDoc(collection(db, "scores"), {
        name,
        category,
        score,
        judge,
        time: Date.now()
    });

    showSuccess("Score submitted successfully.", "Score Submitted");
};
window.generateCertificate = async () => {

    const { jsPDF } = window.jspdf;

    // 🔥 scores से winner निकालो
    const snap = await getDocs(collection(db, "scores"));

    let map = {};

    snap.forEach(d => {
        let s = d.data();

        if (!map[s.category]) map[s.category] = {};

        if (!map[s.category][s.name]) {
            map[s.category][s.name] = 0;
        }

        map[s.category][s.name] += s.score;
    });

    // 👉 first category का winner निकाल रहे हैं (simple version)
    let firstCat = Object.keys(map)[0];

    if (!firstCat) {

        showWarning(
            "No scoring category is available.",
            "No Category"
        );

        return;
    }

    let arr = [];

    for (let name in map[firstCat]) {
        arr.push({ name, score: map[firstCat][name] });
    }

    arr.sort((a, b) => b.score - a.score);

    if (arr.length === 0) {

        showWarning(
            "No scores are available to generate a certificate.",
            "No Scores"
        );

        return;
    }

    let winner = arr[0];

    // 🎨 PDF बनाओ
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Certificate of Achievement", 50, 30);

    doc.setFontSize(16);
    doc.text(`This is awarded to`, 70, 60);

    doc.setFontSize(20);
    doc.text(`${winner.name}`, 80, 80);

    doc.setFontSize(14);
    doc.text(`For securing 1st position in ${firstCat}`, 40, 100);

    doc.text("Tribal Rhythm Event", 70, 130);

    doc.save("certificate.pdf");
    showSuccess(
        `Certificate generated successfully for ${winner.name}.`,
        "Certificate Generated"
    );
};

window.updateLive = () => {
    updateDoc(doc(db, "settings", "competition"), {
        youtube: document.getElementById("yt").value
    });
};

window.updateTopic = () => {
    updateDoc(doc(db, "settings", "competition"), {
        topic: document.getElementById("topic").value
    });
};



window.setTime = () => {
    updateDoc(doc(db, "settings", "competition"), {
        time: new Date(document.getElementById("time").value)
    });
};

window.lock = () =>
    updateDoc(doc(db, "settings", "competition"), { status: "locked" });

window.unlock = () =>
    updateDoc(doc(db, "settings", "competition"), { status: "unlocked" });

/* ================= DATA ================= */


function loadLeaderboard() {

    onSnapshot(collection(db, "scores"), snap => {

        let map = {};

        snap.forEach(d => {
            let s = d.data();

            if (!map[s.category]) map[s.category] = {};

            if (!map[s.category][s.name]) {
                map[s.category][s.name] = {
                    total: 0,
                    judges: {}
                };
            }

            map[s.category][s.name].total += s.score;

            // 🔥 judge-wise
            map[s.category][s.name].judges[s.judge] = s.score;
        });

        let html = "";

        for (let cat in map) {

            let arr = [];

            for (let name in map[cat]) {
                arr.push({
                    name: name,
                    total: map[cat][name].total,
                    judges: map[cat][name].judges
                });
            }

            arr.sort((a, b) => b.total - a.total);

            html += `<div class="card-pro"><h5>🏆 ${cat}</h5>`;

            arr.slice(0, 5).forEach((u, i) => {

                let judgeHTML = "";

                for (let j in u.judges) {
                    judgeHTML += `<div style="font-size:12px">👨‍⚖️ ${j}: ${u.judges[j]}</div>`;
                }

                // 🥇 Winner
                if (i === 0) {
                    html += `
                    <div style="
                        background: gold;
                        color: black;
                        padding: 10px;
                        border-radius: 10px;
                        margin-bottom:5px;
                        box-shadow: 0 0 10px gold;
                    ">
                        👑 ${u.name} - ${u.total}
                        ${judgeHTML}
                    </div>`;
                }

                else {
                    html += `
                    <div>
                        #${i + 1} ${u.name} - ${u.total}
                        ${judgeHTML}
                    </div>`;
                }

            });

            html += `</div>`;
        }

        document.getElementById("leaderboard").innerHTML = html;
    });
}

/* ================= ACTIONS ================= */

window.approveUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), {
        status: "approved"
    });


    const adminDoc =
        await getDoc(
            doc(db, "admins", uid)
        );

    const admin =
        adminDoc.data();

    if (admin?.email) {
        try {
            await fetch(`${API_BASE}/send-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: admin.email,
                    subject: "Admin Approval - Tribal Rhythm",
                    message: `Hello ${admin.adminName || "Admin"}, your admin account has been approved.`
                })
            });
        } catch (emailError) {
            console.error("Approval email error:", emailError);
        }
    }

    showSuccess(
        "User has been approved successfully.",
        "User Approved"
    );
};

window.approve = id =>
    updateDoc(doc(db, "bookings", id), { status: "Approved" });

window.remove = id =>
    deleteDoc(doc(db, "bookings", id));

window.scanTicket = async () => {

    let id = document.getElementById("scanInput").value.trim();

    if (!id) {

        showWarning(
            "Please enter a ticket ID.",
            "Ticket Required"
        );

        return;
    }

    const ref = doc(db, "tickets", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        document.getElementById("scanResult").innerText = "❌ Invalid Ticket";
        return;
    }

    let data = snap.data();

    if (data.status === "used") {
        document.getElementById("scanResult").innerText = "⚠️ Already Used";
        return;
    }

    // ✅ VALID ENTRY
    await updateDoc(ref, {
        status: "used",
        scannedAt: Date.now()
    });

    document.getElementById("scanResult").innerText = "✅ Entry Allowed";
};
window.startScanner = function () {
    const scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            document.getElementById("scanInput").value = decodedText;
            window.scanTicket();
            scanner.stop();
        }
    );
}




window.sendOTP = async function () {

    const email =
        document.getElementById("email").value.trim();

    if (!email) {
        showWarning("Enter your email first.");
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/admin/send-otp`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email
                })
            }
        );

        const data = await response.json();

        if (!data.success) {
            alert(data.message || "OTP sending failed ❌");
            return;
        }

        otpVerified = false;

        const sendBtn = document.getElementById("sendOtpBtn");

        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = "📨 OTP Sent";
        }

        showSuccess("OTP sent to your email.", "OTP Sent");

        startOtpTimer();

    } catch (error) {

        console.error("OTP Error:", error);

        showError("OTP sending failed.");
    }
};

function startOtpTimer() {

    clearInterval(otpInterval);

    otpTime = 60;

    const timer =
        document.getElementById("otpTimer");

    const resend =
        document.getElementById("resendOtpLink");

    resend.style.display = "none";

    otpInterval = setInterval(() => {

        timer.innerText =
            `Resend in ${otpTime}s`;

        otpTime--;

        if (otpTime < 0) {

            clearInterval(otpInterval);

            timer.innerText = "";

            resend.style.display = "inline";

            const sendBtn =
                document.getElementById("sendOtpBtn");

            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = "📧 Send OTP";
            }
        }

    }, 1000);
}
window.resendOTP = function () {
    sendOTP();
};

window.verifyOTP = async function () {

    const email =
        document.getElementById("email").value.trim();

    const otp =
        [...document.querySelectorAll(".otp-box")]
            .map(input => input.value)
            .join("");

    if (!email) {

        showWarning(
            "Please enter your email address.",
            "Email Required"
        );

        return;
    }

    if (otp.length !== 6) {
        showWarning(
            "Enter the complete 6-digit OTP.",
            "Invalid OTP"
        );
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/admin/verify-otp`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    otp: otp
                })
            }
        );

        const data = await response.json();

        if (!data.success) {

            otpVerified = false;

            showError(
                data.message || "Invalid OTP",
                "OTP Verification Failed"
            );

            return;
        }

        otpVerified = true;

        const verifyBtn = document.getElementById("verifyOtpBtn");

        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = "✅ OTP Verified";
        }

        showSuccess(
            "Email OTP verified successfully.",
            "OTP Verified"
        );

    } catch (error) {

        console.error("Verify OTP Error:", error);

        otpVerified = false;

        showError(
            "OTP verification failed. Please try again.",
            "Verification Failed"
        );
    }
};

document
    .querySelectorAll(".otp-box")
    .forEach((input, index, boxes) => {

        input.addEventListener("input", () => {

            input.value =
                input.value.replace(/\D/g, "");

            if (
                input.value &&
                index < boxes.length - 1
            ) {
                boxes[index + 1].focus();
            }
        });

        input.addEventListener("keydown", (event) => {

            if (
                event.key === "Backspace" &&
                !input.value &&
                index > 0
            ) {
                boxes[index - 1].focus();
            }
        });

    });


window.sendTestEmail = async () => {

    const target =
        document.getElementById("emailTarget")?.value.trim();

    const subject =
        document.getElementById("emailSubject")?.value.trim();

    const message =
        document.getElementById("emailMessage")?.value.trim();

    if (!target || !subject || !message) {

        showWarning(
            "Recipient, subject and message are required.",
            "Missing Information"
        );

        return;
    }

    try {
        const response = await fetch(`${API_BASE}/send-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: target,
                subject,
                message
            })
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw new Error(data.message || "Email sending failed");
        }

        showSuccess(
            data.message || "Test email sent successfully.",
            "Email Sent"
        );

    } catch (error) {
        console.error("Test email error:", error);
        showError(
            error.message || "Email sending failed.",
            "Email Failed"
        );
    }
};

window.sendBulkEmail = async () => {


    const target =
        document.getElementById("emailTarget").value;


    const subject =
        document.getElementById("emailSubject").value;


    const message =
        document.getElementById("emailMessage").value;


    if (!subject || !message) {

        showWarning(
            "Subject and message are required.",
            "Missing Information"
        );

        return;
    }


    try {


        const response = await fetch(

            "https://tribal-rhythm-backend.onrender.com/send-bulk-email",

            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    target,
                    subject,
                    message

                })

            });


        const data =
            await response.json();


        if (data.success === false) {

            showError(
                data.message || "Bulk email failed.",
                "Email Failed"
            );

        } else {

            showSuccess(
                data.message || "Bulk email sent successfully.",
                "Bulk Email Sent"
            );

        }


    }

    catch (error) {

        console.log(error);

        showError(
            "Bulk email sending failed.",
            "Email Failed"
        );

    }

};




window.sendBulkSMS = async function sendBulkSMS() {

    try {

        const target =
            document.getElementById("smsUsers").value;

        const message =
            document.getElementById("smsMessage").value;

        if (!message.trim()) {

            showWarning(
                "Please enter an SMS message.",
                "Message Required"
            );

            return;
        }

        const res = await fetch(
            `${API_BASE}/send-bulk-sms`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    target,
                    message
                })
            }
        );

        const data = await res.json();

        if (!res.ok || data.success === false) {

            showError(
                data.message || "Bulk SMS sending failed.",
                "SMS Failed"
            );

            return;
        }

        showSuccess(
            data.message || "Bulk SMS sent successfully.",
            "SMS Sent"
        );

    } catch (error) {

        console.error(error);

        showError(
            "Unable to send bulk SMS.",
            "SMS Error"
        );
    }
};

window.sendWinnerSMS = async function sendWinnerSMS() {

    // ==============================
    // GET FORM VALUES
    // ==============================

    const name =
        document.getElementById("winnerName")?.value.trim();

    const mobile =
        document.getElementById("winnerMobile")?.value.trim();

    const category =
        document.getElementById("winnerCategory")?.value.trim();

    const rank =
        document.getElementById("winnerRank")?.value.trim();

    const prize =
        document.getElementById("winnerPrize")?.value.trim();


    // ==============================
    // VALIDATION
    // ==============================

    if (!name || !mobile || !category || !rank || !prize) {

        showWarning(
            "Please fill all winner details.",
            "Missing Information"
        );

        return;
    }


    // ==============================
    // MOBILE VALIDATION
    // ==============================

    if (!/^[6-9]\d{9}$/.test(mobile)) {

        showWarning(
            "Please enter a valid 10-digit mobile number.",
            "Invalid Mobile"
        );

        return;
    }


    // ==============================
    // SEND WINNER SMS
    // ==============================

    try {

        const res = await fetch(
            `${API_BASE}/send-winner-sms`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: name,

                    mobile: mobile,

                    category: category,

                    rank: rank,

                    prize: prize

                })
            }
        );


        // ==============================
        // RESPONSE
        // ==============================

        const data = await res.json();


        // ==============================
        // ERROR
        // ==============================

        if (!res.ok || data.success === false) {

            showError(
                data.message ||
                "Winner SMS sending failed.",
                "SMS Failed"
            );

            return;
        }


        // ==============================
        // SUCCESS
        // ==============================

        showSuccess(
            data.message ||
            "Winner SMS sent successfully.",
            "Winner SMS Sent"
        );


    } catch (error) {

        console.error(
            "Winner SMS Error:",
            error
        );

        showError(
            error.message ||
            "Unable to send winner SMS.",
            "SMS Error"
        );
    }
};

window.sendCertificateReady = async function sendCertificateReady() {

    const res = await fetch(
        "https://tribal-rhythm-backend.onrender.com/send-certificate-ready",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({

                name: document.getElementById("certName").value,

                mobile: document.getElementById("certMobile").value,

                email: document.getElementById("certEmail").value,

                certificateNo: document.getElementById("certNo").value

            })
        });

    const data = await res.json();

    if (data.success) {

        showSuccess(
            data.message,
            "Certificate Notification Sent"
        );

    } else {

        showError(
            data.message,
            "Certificate Notification Failed"
        );

    }

}




window.approveAdmin = async (uid) => {

    try {

        await updateDoc(
            doc(db, "admins", uid),
            {
                approvalStatus: "Approved",
                status: "Active",
                approvedAt: new Date(),
                approvedBy: auth.currentUser.email
            }
        );

        showSuccess(
            "Admin has been approved successfully.",
            "Admin Approved"
        );

    } catch (error) {

        console.error(error);

        showError(
            error.message || "Admin approval failed.",
            "Approval Failed"
        );
    }
};
