require("dotenv").config();
const express = require("express");

const admin = require("firebase-admin");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const app = express();
app.set("trust proxy", 1);

// ================= MIDDLEWARE =================
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://rahulsardarrahul014-ux.github.io"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

// ================= FIREBASE INIT =================
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
};
console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "Loaded" : "Missing");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

admin.auth().listUsers(1)
    .then(() => console.log("Firebase Admin Connected ✅"))
    .catch(err => console.error("Firebase Admin Error:", err));

const db = admin.firestore();
// ================= ADMIN SECURITY =================
const checkAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const idToken = authHeader.substring(7).trim();

        const decodedToken =
            await admin.auth().verifyIdToken(idToken);

        const adminEmails = String(
            process.env.ADMIN_EMAILS || ""
        )
            .split(",")
            .map(email => email.trim().toLowerCase())
            .filter(Boolean);

        const email =
            String(decodedToken.email || "")
                .trim()
                .toLowerCase();

        if (!email || !adminEmails.includes(email)) {
            return res.status(403).json({
                success: false,
                message: "Admin access denied"
            });
        }

        if (decodedToken.admin !== true) {
            return res.status(403).json({
                success: false,
                message: "Admin permission required"
            });
        }

        req.admin = {
            uid: decodedToken.uid,
            email
        };

        next();

    } catch (error) {

        console.error("ADMIN AUTH ERROR:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin session"
        });
    }
};

// ================= RAZORPAY =================
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ================= CHECK RAZORPAY KEYS =================
console.log("KEY ID :", process.env.RAZORPAY_KEY_ID);
console.log("SECRET :", process.env.RAZORPAY_KEY_SECRET ? "Loaded" : "Missing");

// ================= EMAIL =================

// ================= BREVO EMAIL API =================

// ================= BREVO CONFIG CHECK =================

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;

console.log(
    "BREVO_API_KEY:",
    BREVO_API_KEY ? "Loaded ✅" : "Missing ❌"
);

console.log(
    "BREVO_SENDER_EMAIL:",
    BREVO_SENDER_EMAIL ? "Loaded ✅" : "Missing ❌"
);

const sendBrevoEmail = async ({
    to,
    subject,
    html,
    name = ""
}) => {

    const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",

        {
            sender: {
                name: "Tribal Rhythm",
                email: process.env.BREVO_SENDER_EMAIL
            },

            to: [
                {
                    email: to,
                    name: name || undefined
                }
            ],

            subject: subject,

            htmlContent: html
        },

        {
            headers: {
                accept: "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json"
            },

            timeout: 30000
        }
    );

    console.log(
        "✅ Brevo Email Sent:",
        response.data
    );

    return response.data;
};

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many OTP requests. Please try again later."
    }
});

app.use("/send-otp", otpLimiter);


// ================= USER EMAIL SEND OTP =================

app.post("/send-otp", async (req, res) => {

    try {

        const email = normalizeEmail(req.body.email);
        const name = String(req.body.name || "User")
            .trim()
            .slice(0, 100);

        if (!isValidEmail(email)) {

            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });

        }

        const otpRef =
            db.collection("emailOtps").doc(email);

        const existingSnap =
            await otpRef.get();

        // ================= RESEND COOLDOWN =================

        if (existingSnap.exists) {

            const oldData = existingSnap.data();

            const createdAt =
                oldData.createdAt?.toMillis?.() || 0;

            if (
                createdAt &&
                Date.now() - createdAt <
                OTP_RESEND_COOLDOWN_MS
            ) {

                const remaining =
                    Math.ceil(
                        (
                            OTP_RESEND_COOLDOWN_MS -
                            (Date.now() - createdAt)
                        ) / 1000
                    );

                return res.status(429).json({

                    success: false,

                    message:
                        `Please wait ${remaining} seconds before requesting another OTP.`,

                    retryAfter: remaining

                });
            }
        }

        // ================= GENERATE OTP =================

        const otp = generateOTP();

        // NEVER STORE PLAIN OTP
        const otpHash = hashOTP(otp);

        const now = Date.now();

        // ================= SAVE OTP =================

        await otpRef.set({

            otpHash,

            attempts: 0,

            verified: false,

            createdAt:
                admin.firestore.Timestamp.fromMillis(now),

            expiresAt:
                admin.firestore.Timestamp.fromMillis(
                    now + OTP_EXPIRY_MS
                )

        });

        // ================= SEND EMAIL =================

        await sendBrevoEmail({

            to: email,

            name: name,

            subject:
                "🔐 Tribal Rhythm Email Verification OTP",

            html: `

<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>Tribal Rhythm OTP</title>

</head>

<body style="
    margin:0;
    padding:0;
    background:#f3f4f6;
    font-family:Arial,sans-serif;
">

<div style="
    max-width:600px;
    margin:30px auto;
    background:#111111;
    border-radius:16px;
    overflow:hidden;
    box-shadow:0 8px 30px rgba(0,0,0,.2);
">

    <!-- HEADER -->

    <div style="
        padding:25px;
        text-align:center;
        background:#181818;
    ">

        <h1 style="
            margin:0;
            color:#FFD700;
            font-size:28px;
        ">
            Tribal Rhythm
        </h1>

        <p style="
            color:#cccccc;
            margin:8px 0 0;
        ">
            Email Verification
        </p>

    </div>


    <!-- CONTENT -->

    <div style="
        padding:30px;
        color:#ffffff;
    ">

        <p>
            Hello <b>${name}</b>,
        </p>

        <p>
            We received a request to verify this
            email address for Tribal Rhythm.
        </p>


        <!-- OTP BOX -->

        <div style="
            margin:25px 0;
            padding:20px;
            background:#222222;
            border:1px solid #444444;
            border-radius:12px;
            text-align:center;
        ">

            <p style="
                margin:0 0 10px;
                color:#aaaaaa;
                font-size:14px;
            ">
                Your verification code
            </p>

            <div style="
                color:#FFD700;
                font-size:36px;
                font-weight:bold;
                letter-spacing:10px;
            ">
                ${otp}
            </div>

        </div>


        <p>
            ⏱️ This OTP is valid for
            <b>5 minutes</b>.
        </p>

        <p>
            🔒 This OTP can be used only once.
        </p>

        <p>
            🚫 Never share this OTP with anyone,
            including anyone claiming to be from
            Tribal Rhythm.
        </p>

        <p style="
            color:#aaaaaa;
            font-size:13px;
            margin-top:25px;
        ">
            If you did not request this OTP,
            you can safely ignore this email.
        </p>

    </div>


    <!-- FOOTER -->

    <div style="
        padding:20px;
        background:#181818;
        text-align:center;
        color:#888888;
        font-size:12px;
    ">

        <p style="margin:5px;">
            Tribal Rhythm
        </p>

        <p style="margin:5px;">
            Powered by <b style="color:#FFD700;">
            Zentro Nex
            </b>
        </p>

    </div>

</div>

</body>

</html>

            `

        });

        console.log(
            "✅ Email OTP sent:",
            email
        );

        return res.json({

            success: true,

            message:
                "OTP sent successfully",

            expiresIn: 300

        });

    } catch (error) {

        console.error(
            "SEND EMAIL OTP ERROR:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to send OTP"

        });

    }

});


// ================= USER EMAIL VERIFY OTP =================

app.post("/verify-otp", async (req, res) => {

    try {

        const email =
            normalizeEmail(req.body.email);

        const otp =
            String(req.body.otp || "").trim();

        if (
            !isValidEmail(email) ||
            !/^\d{6}$/.test(otp)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid email or OTP"
            });

        }

        const otpRef =
            db.collection("emailOtps").doc(email);

        const otpSnap =
            await otpRef.get();

        if (!otpSnap.exists) {

            return res.status(400).json({
                success: false,
                message:
                    "OTP not found or expired"
            });

        }

        const data =
            otpSnap.data();

        // ================= EXPIRY =================

        if (
            !data.expiresAt ||
            data.expiresAt.toMillis() < Date.now()
        ) {

            await otpRef.delete();

            return res.status(400).json({
                success: false,
                message: "OTP expired"
            });

        }

        // ================= MAX ATTEMPTS =================

        const attempts =
            Number(data.attempts || 0);

        if (attempts >= OTP_MAX_ATTEMPTS) {

            await otpRef.delete();

            return res.status(429).json({
                success: false,
                message:
                    "Too many incorrect attempts. Please request a new OTP."
            });

        }

        // ================= HASH OTP =================

        const submittedHash =
            hashOTP(otp);

        // ================= WRONG OTP =================

        if (
            submittedHash !== data.otpHash
        ) {

            await otpRef.update({

                attempts:
                    admin.firestore.FieldValue.increment(1)

            });

            return res.status(400).json({

                success: false,

                message:
                    "Invalid OTP"

            });

        }

        // ================= OTP SUCCESS =================

        // DELETE IMMEDIATELY
        // Makes OTP one-time-use

        await otpRef.delete();

        return res.json({

            success: true,

            verified: true,

            message:
                "OTP verified successfully"

        });

    } catch (error) {

        console.error(
            "VERIFY EMAIL OTP ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "OTP verification failed"

        });

    }

});





// ================= OTP SECURITY HELPERS =================


// ================= OTP SECURITY CONFIG =================

const OTP_EXPIRY_MS = 5 * 60 * 1000;       // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;  // 60 seconds

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};



const hashOTP = (otp) => {
    return crypto
        .createHash("sha256")
        .update(String(otp))
        .digest("hex");
};

const normalizeEmail = (email) => {
    return String(email || "")
        .trim()
        .toLowerCase();
};

const normalizeMobile = (mobile) => {
    return String(mobile || "")
        .replace(/\D/g, "")
        .slice(-10);
};

const getAdminEmails = () => {
    return String(process.env.ADMIN_EMAILS || "")
        .split(",")
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(email || "").trim()
    );
};

const isValidMobile = (mobile) => {
    return /^[6-9]\d{9}$/.test(
        String(mobile || "")
    );
};








// ================= ADMIN SEND OTP =================

app.post("/admin/send-otp", async (req, res) => {

    try {

        const email = normalizeEmail(req.body.email);

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }

        const adminEmails = getAdminEmails();

        if (!adminEmails.includes(email)) {
            return res.status(403).json({
                success: false,
                message: "Admin access denied"
            });
        }

        // Check Firebase Auth user
        let adminUser;

        try {

            adminUser =
                await admin.auth().getUserByEmail(email);

        } catch (error) {

            return res.status(403).json({
                success: false,
                message: "Admin Firebase account not found"
            });

        }

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        // Save hashed OTP in Firestore
        await db
            .collection("adminOtps")
            .doc(email)
            .set({

                otpHash,

                uid: adminUser.uid,

                attempts: 0,

                createdAt:
                    admin.firestore.Timestamp.now(),

                expiresAt:
                    admin.firestore.Timestamp.fromMillis(
                        Date.now() + 5 * 60 * 1000
                    )
            });

        // ================= BREVO API EMAIL =================

        await sendBrevoEmail({

            to: email,

            name: adminUser.displayName || "Admin",

            subject:
                "🔐 Tribal Rhythm Admin OTP",

            html: `

                <div style="
                    font-family:Arial,sans-serif;
                    max-width:600px;
                    margin:auto;
                    padding:30px;
                    background:#111;
                    color:#fff;
                    border-radius:12px;
                ">

                    <h2 style="color:#FFD700;">
                        Tribal Rhythm Admin
                    </h2>

                   <p>
    Your administrator verification OTP is:
</p>

<h1 style="
    color:#FFD700;
    letter-spacing:8px;
    text-align:center;
">
    ${otp}
</h1>

<p>
    ⏱️ This OTP is valid for
    <b>5 minutes</b>.
</p>

<p>
    🔒 This OTP can be used only once.
</p>

<p>
    🚫 Never share this OTP with anyone.
</p>

<p style="
    color:#aaaaaa;
    font-size:13px;
">
    If you did not request an administrator login,
    please ignore this email and review your account security.
</p>

                    <hr>

                    <p>
                        Powered by
                        <b>Zentro Nex</b>
                    </p>

                </div>

            `
        });

        return res.json({

            success: true,

            message:
                "Admin OTP sent successfully"

        });

    } catch (error) {

        console.error(
            "ADMIN SEND OTP ERROR:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to send admin OTP"

        });

    }

});



// ================= USER PHONE SEND OTP =================

const phoneOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again later."
    }
});

app.use("/send-phone-otp", phoneOtpLimiter);


app.post("/send-phone-otp", async (req, res) => {

    try {

        const mobile =
            String(req.body.mobile || "").trim();

        const name =
            String(req.body.name || "User").trim();


        // ================= VALIDATE MOBILE =================

        if (!/^[6-9]\d{9}$/.test(mobile)) {

            return res.status(400).json({
                success: false,
                message: "Invalid Mobile Number"
            });

        }


        // ================= GENERATE OTP =================

        const otp = generateOTP();

        // NEVER store plain OTP
        const otpHash = hashOTP(otp);

        const now = Date.now();


        // ================= RESEND COOLDOWN =================

        const otpRef =
            db.collection("phoneOtps").doc(mobile);

        const existingSnap =
            await otpRef.get();

        if (existingSnap.exists) {

            const oldData = existingSnap.data();

            const createdAt =
                oldData.createdAt?.toMillis?.() || 0;

            if (
                createdAt &&
                Date.now() - createdAt <
                OTP_RESEND_COOLDOWN_MS
            ) {

                const remaining =
                    Math.ceil(
                        (
                            OTP_RESEND_COOLDOWN_MS -
                            (Date.now() - createdAt)
                        ) / 1000
                    );

                return res.status(429).json({

                    success: false,

                    message:
                        `Please wait ${remaining} seconds before requesting another OTP.`,

                    retryAfter: remaining

                });
            }
        }


        // ================= SAVE SECURE OTP =================

        await otpRef.set({

            otpHash,

            attempts: 0,

            verified: false,

            createdAt:
                admin.firestore.Timestamp.fromMillis(now),

            expiresAt:
                admin.firestore.Timestamp.fromMillis(
                    now + OTP_EXPIRY_MS
                )

        });


        // ================= SEND MSG91 OTP =================
        // If MSG91 fails, delete OTP from Firestore

        try {

            await axios.post(

                "https://control.msg91.com/api/v5/oneapi/api/flow/tribalrhythmotp/run",

                {
                    data: {
                        sendTo: [
                            {
                                to: [
                                    {
                                        mobiles: "91" + mobile,

                                        variables: {

                                            name: {
                                                value: name
                                            },

                                            otp: {
                                                value: otp
                                            }

                                        }

                                    }
                                ]
                            }
                        ]
                    }
                },

                {
                    headers: {

                        authkey:
                            process.env.MSG91_AUTH_KEY,

                        "Content-Type":
                            "application/json"

                    },

                    timeout: 30000

                }

            );

        } catch (smsError) {

            // MSG91 failed
            // Remove OTP so it cannot be used

            await otpRef.delete();

            console.error(
                "MSG91 OTP SEND FAILED:",
                smsError.response?.data ||
                smsError.message
            );

            throw smsError;
        }


        console.log(
            "✅ Phone OTP sent:",
            mobile
        );


        return res.json({

            success: true,

            message:
                "OTP sent successfully",

            expiresIn:
                OTP_EXPIRY_MS / 1000

        });


    } catch (error) {

        console.error(
            "SEND PHONE OTP ERROR:",
            error.response?.data ||
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to send OTP"

        });

    }

});



// ================= USER PHONE VERIFY OTP =================

app.post("/verify-phone-otp", async (req, res) => {

    try {

        const mobile =
            String(req.body.mobile || "").trim();

        const otp =
            String(req.body.otp || "").trim();


        // ================= VALIDATION =================

        if (
            !/^[6-9]\d{9}$/.test(mobile) ||
            !/^\d{6}$/.test(otp)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid mobile number or OTP"

            });

        }


        // ================= OTP DOCUMENT =================

        const otpRef =
            db
                .collection("phoneOtps")
                .doc(mobile);


        const otpSnap =
            await otpRef.get();


        if (!otpSnap.exists) {

            return res.status(400).json({

                success: false,

                message:
                    "OTP not found or expired"

            });

        }


        const data =
            otpSnap.data();


        // ================= EXPIRY CHECK =================

        if (
            !data.expiresAt ||
            data.expiresAt.toMillis() <= Date.now()
        ) {

            await otpRef.delete();

            return res.status(400).json({

                success: false,

                message:
                    "OTP expired. Please request a new OTP."

            });

        }


        // ================= ONE-TIME USE CHECK =================

        if (data.verified === true) {

            await otpRef.delete();

            return res.status(400).json({

                success: false,

                message:
                    "OTP has already been used."

            });

        }


        // ================= ATTEMPT LIMIT =================

        const attempts =
            Number(data.attempts || 0);


        if (attempts >= OTP_MAX_ATTEMPTS) {

            await otpRef.delete();

            return res.status(429).json({

                success: false,

                message:
                    "Too many incorrect attempts. Please request a new OTP."

            });

        }


        // ================= HASH SUBMITTED OTP =================

        const submittedHash =
            hashOTP(otp);


        // ================= COMPARE =================

        if (
            submittedHash !== data.otpHash
        ) {

            await otpRef.update({

                attempts:
                    admin.firestore.FieldValue.increment(1)

            });


            return res.status(400).json({

                success: false,

                message:
                    "Invalid OTP"

            });

        }


        // ================= OTP SUCCESS =================

        await otpRef.update({

            verified: true,

            verifiedAt:
                admin.firestore.Timestamp.now()

        });


        // ================= DELETE OTP =================
        // OTP becomes unusable immediately

        await otpRef.delete();


        return res.json({

            success: true,

            verified: true,

            message:
                "Phone number verified successfully"

        });


    } catch (error) {

        console.error(
            "VERIFY PHONE OTP ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Phone OTP verification failed"

        });

    }

});


// ================= ADMIN VERIFY OTP =================

app.post("/admin/verify-otp", async (req, res) => {

    try {

        const email =
            normalizeEmail(req.body.email);

        const otp =
            String(req.body.otp || "").trim();

        if (
            !isValidEmail(email) ||
            !/^\d{6}$/.test(otp)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid email or OTP"
            });
        }

        const adminEmails =
            getAdminEmails();

        if (!adminEmails.includes(email)) {

            return res.status(403).json({
                success: false,
                message: "Admin access denied"
            });
        }

        const otpRef =
            db.collection("adminOtps").doc(email);

        const otpSnap =
            await otpRef.get();

        if (!otpSnap.exists) {

            return res.status(400).json({
                success: false,
                message: "OTP not found or expired"
            });
        }

        const data =
            otpSnap.data();

        if (
            !data.expiresAt ||
            data.expiresAt.toMillis() < Date.now()
        ) {

            await otpRef.delete();

            return res.status(400).json({
                success: false,
                message: "OTP expired"
            });
        }

        const attempts =
            Number(data.attempts || 0);

        if (attempts >= 5) {

            await otpRef.delete();

            return res.status(429).json({
                success: false,
                message: "Too many OTP attempts"
            });
        }

        const submittedHash =
            hashOTP(otp);

        if (submittedHash !== data.otpHash) {

            await otpRef.update({
                attempts: admin.firestore.FieldValue.increment(1)
            });

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // OTP is valid
        await otpRef.delete();

        const adminUser =
            await admin.auth().getUser(data.uid);

        // Create Firebase custom token
        const customToken =
            await admin.auth().createCustomToken(
                adminUser.uid,
                {
                    admin: true
                }
            );

        return res.json({
            success: true,
            message: "Admin login successful",
            token: customToken,
            uid: adminUser.uid,
            email: adminUser.email
        });

    } catch (error) {

        console.error(
            "ADMIN VERIFY OTP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Admin authentication failed"
        });
    }
});

// ================= CREATE ORDER (FIXED FOR FRONTEND =================
app.post("/create-order", async (req, res) => {
    try {
        const { amount, email } = req.body;

        console.log("Request Body:", req.body);

        if (

            !amount ||

            Number(amount) <= 0 ||

            !email ||

            !isValidEmail(email)

        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request"
            });
        }

        const finalAmount = 30000;

        const order = await razorpay.orders.create({
            amount: finalAmount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                email
            }
        });

        return res.status(200).json({
            success: true,
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.error("Create Order Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Order creation failed"
        });
    }
});

// ================= VERIFY PAYMENT =================
app.post("/verify-payment", async (req, res) => {
    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            email
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expected !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment Verification Failed"
            });
        }

        await db.collection("users").doc(email).update({
            paymentStatus: "paid",
            status: "approved",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paymentDate: new Date()
        });

        const userDoc = await db.collection("users").doc(email).get();
        const user = userDoc.data();

        await sendPaymentSuccessSMS({
            name: user.name,
            mobile: user.mobile,
            ticketId: user.ticketId,
            amount: 300
        });

        await axios.post(
            "https://tribal-rhythm-backend.onrender.com/send-registration-email",
            {
                name: user.name,
                email,
                ticketId: user.ticketId
            }
        );

        await axios.post(
            "https://tribal-rhythm-backend.onrender.com/send-registration-sms",
            {
                name: user.name,
                mobile: user.mobile,
                ticketId: user.ticketId
            }
        );

        return res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
});

// ================= WEBHOOK (SECURE) =================
app.post("/razorpay-webhook", async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        const shasum = crypto.createHmac("sha256", secret);
        shasum.update(req.rawBody);
        const digest = shasum.digest("hex");

        const signature = req.headers["x-razorpay-signature"];

        if (!signature || signature !== digest) {
            return res.status(400).send("Invalid signature");
        }

        const payment = req.body?.payload?.payment?.entity;

        if (!payment) return res.status(400).send("No payment");

        const email = payment.notes?.email;

        if (!email) return res.status(400).send("No email");

        await db.collection("payments").add({
            email,
            amount: payment.amount / 100,
            paymentId: payment.id,
            status: "paid",
            time: new Date()
        });

        const userRef = db.collection("users").doc(email);

        await userRef.update({
            paymentStatus: "paid",
            status: "approved",
            paymentId: payment.id,
            amount: payment.amount / 100,
            paymentDate: new Date()
        });

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).send("Webhook error");
    }
});

// ================= ENTRY CHECK =================
app.post("/check-entry", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.json({ allowed: false });
        }

        const doc = await db.collection("users").doc(email).get();

        if (!doc.exists) {
            return res.json({ allowed: false, reason: "Not registered" });
        }

        const user = doc.data();

        if (user.paymentStatus !== "paid") {
            return res.json({ allowed: false, reason: "Payment required" });
        }

        if (user.status !== "approved") {
            return res.json({ allowed: false, reason: "Not approved" });
        }

        return res.json({
            allowed: true,
            ticketId: user.ticketId
        });

    } catch (err) {
        return res.status(500).json({ allowed: false });
    }
});


// ================= REGISTRATION CONFIRMATION EMAIL =================

app.post("/send-registration-email", checkAdmin, async (req, res) => {

    try {

        const { name, email, ticketId } = req.body;

        await sendBrevoEmail({

            to: email,

            name: name,

            subject:
                "🎟️ Tribal Rhythm Ticket Booking Successful",

            html: `

        <div style="
            font-family:Arial,sans-serif;
            max-width:600px;
            margin:auto;
            padding:30px;
            background:#111;
            color:#fff;
            border-radius:12px;
        ">

            <h2 style="color:#FFD700;">
                Payment Successful 🎉
            </h2>

            <p>
                Hello <b>${name}</b>,
            </p>

            <p>
                Your ticket booking has been
                successfully completed.
            </p>

            <p>
                <b>Ticket ID:</b>
                ${ticketId}
            </p>

            <p>
                Thank you for booking with
                Tribal Rhythm.
            </p>

            <h3>
                Team Tribal Rhythm
            </h3>

            <hr>

            <p>
                Powered by <b>Zentro Nex</b>
            </p>

        </div>

    `
        });

        console.log("✅ Confirmation email sent to:", email);

        res.json({

            success: true,

            message: "Email sent successfully"

        });

    } catch (error) {

        console.error(
            "EMAIL ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Email sending failed",

            error: error.message

        });

    }

});

// ================= BULK EMAIL CENTER =================

app.post("/send-bulk-email", checkAdmin, async (req, res) => {

    try {

        const {
            target,
            subject,
            message
        } = req.body;


        let users = [];


        // ALL USERS
        if (target === "all") {

            const snap =
                await db.collection("users").get();


            snap.forEach(doc => {

                users.push(doc.data().email);

            });

        }



        // PAID USERS

        else if (target === "paid") {

            const snap =
                await db.collection("users")
                    .where("paymentStatus", "==", "paid")
                    .get();


            snap.forEach(doc => {

                users.push(doc.data().email);

            });

        }



        // COMPETITION PARTICIPANTS

        else if (target === "participants") {

            const snap =
                await db.collection("participation").get();

            snap.forEach(doc => {

                users.push(doc.data().email);

            });


            snap.forEach(doc => {

                let data = doc.data();

                if (data.email) {

                    users.push(data.email);

                }

            });

        }



        // SELECTED USER

        else if (target === "selected") {

            users = req.body.emails;

        }



        if (users.length === 0) {

            return res.json({

                success: false,
                message: "No users found"

            });

        }



        await axios.post(
            "https://api.brevo.com/v3/smtp/email",

            {
                sender: {
                    name: "Tribal Rhythm",
                    email: process.env.BREVO_SENDER_EMAIL
                },

                bcc: users.map(email => ({
                    email: email
                })),

                subject: subject,

                htmlContent: `
            <div style="font-family:Arial,sans-serif">

                <h2>🎭 Tribal Rhythm</h2>

                <p>
                    ${message}
                </p>

                <hr>

                <p>
                    Powered by <b>Zentro Nex</b>
                </p>

            </div>
        `
            },

            {
                headers: {
                    accept: "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json"
                },

                timeout: 30000
            }
        );



        res.json({

            success: true,

            message:
                users.length + " emails sent"

        });



    }

    catch (error) {

        console.log(
            "BULK EMAIL ERROR",
            error
        );


        res.status(500).json({

            success: false,

            message: error.message

        });

    }

});

// ================= BULK SMS CENTER =================

app.post("/send-bulk-sms", checkAdmin, async (req, res) => {

    try {

        const { target, message, mobiles } = req.body;

        let phoneList = [];

        // ALL USERS
        if (target === "all") {

            const snap = await db.collection("users").get();

            snap.forEach(doc => {
                const data = doc.data();

                if (data.mobile) {
                    phoneList.push(data.mobile);
                }
            });

        }

        // PAID USERS
        else if (target === "paid") {

            const snap = await db.collection("users")
                .where("paymentStatus", "==", "paid")
                .get();

            snap.forEach(doc => {

                const data = doc.data();

                if (data.mobile) {
                    phoneList.push(data.mobile);
                }

            });

        }

        // PARTICIPANTS
        else if (target === "participants") {

            const snap = await db.collection("participation").get();

            snap.forEach(doc => {

                const data = doc.data();

                if (data.mobile) {
                    phoneList.push(data.mobile);
                }

            });

        }

        // SELECTED USERS
        else if (target === "selected") {

            phoneList = mobiles || [];

        }

        phoneList = [...new Set(phoneList)];

        if (phoneList.length === 0) {

            return res.json({
                success: false,
                message: "No Mobile Numbers Found"
            });

        }

        // SEND SMS ONE BY ONE

        for (const mobile of phoneList) {

            await axios.post(

                "https://control.msg91.com/api/v5/oneapi/api/flow/tribalrhythmotp/run",

                {

                    data: {

                        sendTo: [

                            {

                                to: [

                                    {

                                        mobiles: "91" + mobile,

                                        variables: {

                                            message: {
                                                value: message
                                            }

                                        }

                                    }

                                ]

                            }

                        ]

                    }

                },

                {

                    headers: {

                        authkey: process.env.MSG91_AUTH_KEY,

                        "Content-Type": "application/json"

                    }

                }

            );

        }

        res.json({

            success: true,

            total: phoneList.length,

            message: phoneList.length + " SMS Sent"

        });

    }

    catch (err) {

        console.log(err.response?.data || err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});


// ================= PAYMENT SUCCESS SMS FUNCTION =================

const sendPaymentSuccessSMS = async ({
    name,
    mobile,
    ticketId,
    amount
}) => {

    return await axios.post(
        "https://control.msg91.com/api/v5/oneapi/api/flow/payment-success/run",
        {
            data: {
                sendTo: [
                    {
                        to: [
                            {
                                mobiles: "91" + mobile,
                                variables: {
                                    name: {
                                        value: name
                                    },
                                    ticket: {
                                        value: ticketId
                                    },
                                    amount: {
                                        value: amount
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        },
        {
            headers: {
                authkey: process.env.MSG91_AUTH_KEY,
                "Content-Type": "application/json"
            },
            timeout: 30000
        }
    );
};

// ================= PAYMENT SUCCESS SMS =================

app.post("/send-payment-success-sms", checkAdmin, async (req, res) => {

    try {

        const {
            name,
            mobile,
            ticketId,
            amount
        } = req.body;


        await axios.post(

            "https://control.msg91.com/api/v5/oneapi/api/flow/payment-success/run",

            {
                data: {

                    sendTo: [

                        {
                            to: [

                                {

                                    mobiles: "91" + mobile,

                                    variables: {

                                        name: {
                                            value: name
                                        },

                                        ticket: {
                                            value: ticketId
                                        },

                                        amount: {
                                            value: amount
                                        }

                                    }

                                }

                            ]

                        }

                    ]

                }

            },

            {

                headers: {

                    authkey: process.env.MSG91_AUTH_KEY,

                    "Content-Type": "application/json"

                }

            }

        );


        console.log("Payment Success SMS Sent ✅");


        res.json({

            success: true

        });


    } catch (error) {

        console.log(
            "PAYMENT SMS ERROR:",
            error.response?.data || error.message
        );


        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});


// ================= SEND REGISTRATION SUCCESS SMS =================

app.post("/send-registration-sms", checkAdmin, async (req, res) => {

    try {

        const { name, mobile, ticketId } = req.body;

        await axios.post(

            "https://control.msg91.com/api/v5/oneapi/api/flow/registration-success/run",

            {
                data: {
                    sendTo: [
                        {
                            to: [
                                {
                                    mobiles: "91" + mobile,

                                    variables: {

                                        name: {
                                            value: name
                                        },

                                        ticket: {
                                            value: ticketId
                                        }

                                    }

                                }
                            ]
                        }
                    ]
                }
            },

            {
                headers: {
                    authkey: process.env.MSG91_AUTH_KEY,
                    "Content-Type": "application/json"
                }
            }

        );

        console.log("✅ Registration SMS Sent");

        res.json({
            success: true
        });

    } catch (err) {

        console.log(
            "REGISTRATION SMS ERROR:",
            err.response?.data || err.message
        );

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});



// ================= SEND WINNER SMS =================

app.post("/send-winner-sms", checkAdmin, async (req, res) => {

    try {

        const {
            name,
            mobile,
            category,
            rank,
            prize
        } = req.body;

        await axios.post(

            "https://control.msg91.com/api/v5/oneapi/api/flow/winner-message/run",

            {

                data: {

                    sendTo: [

                        {

                            to: [

                                {

                                    mobiles: "91" + mobile,

                                    variables: {

                                        name: {
                                            value: name
                                        },

                                        category: {
                                            value: category
                                        },

                                        rank: {
                                            value: rank
                                        },

                                        prize: {
                                            value: prize
                                        }

                                    }

                                }

                            ]

                        }

                    ]

                }

            },

            {

                headers: {

                    authkey: process.env.MSG91_AUTH_KEY,

                    "Content-Type": "application/json"

                }

            }

        );

        res.json({

            success: true,

            message: "Winner SMS Sent"

        });

    }

    catch (err) {

        console.log(err.response?.data || err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

app.post("/send-certificate-ready", checkAdmin, async (req, res) => {

    try {

        const { name, mobile, email, certificateNo } = req.body;

        // Email
        await sendBrevoEmail({

            to: email,

            name: name,

            subject:
                "🎓 Tribal Rhythm Certificate Ready",

            html: `

        <div style="
            font-family:Arial,sans-serif;
            max-width:600px;
            margin:auto;
            padding:30px;
            background:#111;
            color:#fff;
            border-radius:12px;
        ">

            <h2 style="color:#FFD700;">
                🎓 Certificate Ready
            </h2>

            <p>
                Hello <b>${name}</b>,
            </p>

            <p>
                Your Tribal Rhythm certificate is ready.
            </p>

            <p>
                <b>Certificate No:</b>
                ${certificateNo}
            </p>

            <p>
                Thank you for participating.
            </p>

            <hr>

            <p>
                Powered by <b>Zentro Nex</b>
            </p>

        </div>

    `
        });

        // SMS
        await axios.post(

            "https://control.msg91.com/api/v5/oneapi/api/flow/certificate-ready/run",

            {

                data: {

                    sendTo: [{

                        to: [{

                            mobiles: "91" + mobile,

                            variables: {

                                name: {
                                    value: name
                                },

                                certificate: {
                                    value: certificateNo
                                }

                            }

                        }]

                    }]

                }

            },

            {

                headers: {

                    authkey: process.env.MSG91_AUTH_KEY,

                    "Content-Type": "application/json"

                }

            }

        );

        res.json({

            success: true,

            message: "Certificate notification sent."

        });

    } catch (err) {

        console.log(err.response?.data || err);

        res.status(500).json({

            success: false,

            message: "Sending failed."

        });

    }

});



// ================= TICKET VERIFICATION =================

app.get("/verify-ticket", checkAdmin, async (req, res) => {

    try {

        const ticketId =
            String(req.query.ticketId || "")
                .trim()
                .toUpperCase();

        // ================= VALIDATE TICKET ID =================

        if (!ticketId) {

            return res.status(400).json({
                success: false,
                status: "INVALID",
                message: "Ticket ID is required."
            });

        }

        // Example: TR-20260808-ABC123
        if (!/^TR-[A-Z0-9-]+$/.test(ticketId)) {

            return res.status(400).json({
                success: false,
                status: "INVALID",
                message: "Invalid Ticket ID format."
            });

        }

        // ================= FIRESTORE SEARCH =================

        const snapshot = await db
            .collection("bookings")
            .where("ticketId", "==", ticketId)
            .limit(1)
            .get();

        // ================= TICKET NOT FOUND =================

        if (snapshot.empty) {

            return res.status(404).json({
                success: false,
                status: "INVALID",
                message: "Ticket not found."
            });

        }

        const doc = snapshot.docs[0];

        const booking = doc.data();

        // ================= PAYMENT CHECK =================

        if (booking.status !== "success") {

            return res.status(403).json({
                success: false,
                status: "INVALID",
                message: "Payment is not verified."
            });

        }

        // ================= ALREADY USED =================

        if (booking.entryStatus === "used") {

            return res.status(200).json({

                success: false,

                status: "USED",

                message:
                    "This ticket has already been used.",

                ticket: {
                    ticketId: booking.ticketId,
                    name: booking.name,
                    ticketType: booking.ticketType,
                    ticketQuantity: booking.ticketQuantity,
                    usedAt: booking.usedAt || null
                }

            });

        }

        // ================= VALID TICKET =================

        return res.status(200).json({

            success: true,

            status: "VALID",

            message: "Valid ticket.",

            ticket: {

                ticketId:
                    booking.ticketId,

                name:
                    booking.name,

                phone:
                    booking.phone,

                ticketType:
                    booking.ticketType,

                ticketQuantity:
                    booking.ticketQuantity,

                paymentId:
                    booking.paymentId,

                status:
                    booking.status,

                entryStatus:
                    booking.entryStatus || "unused"

            }

        });

    } catch (error) {

        console.error(
            "Ticket verification error:",
            error
        );

        return res.status(500).json({

            success: false,

            status: "ERROR",

            message:
                "Server error while verifying ticket."

        });

    }

});


// ================= MARK TICKET AS USED =================

// ================= MARK TICKET AS USED =================

app.post("/use-ticket", checkAdmin, async (req, res) => {

    try {

        const ticketId =
            String(req.body.ticketId || "")
                .trim()
                .toUpperCase();

        if (!ticketId) {

            return res.status(400).json({
                success: false,
                status: "INVALID",
                message: "Ticket ID is required."
            });
        }

        const snapshot =
            await db.collection("bookings")
                .where("ticketId", "==", ticketId)
                .limit(1)
                .get();

        if (snapshot.empty) {

            return res.status(404).json({
                success: false,
                status: "INVALID",
                message: "Ticket not found."
            });
        }

        const ticketDoc =
            snapshot.docs[0];

        const result =
            await db.runTransaction(async transaction => {

                const freshDoc =
                    await transaction.get(ticketDoc.ref);

                if (!freshDoc.exists) {
                    throw new Error("Ticket not found");
                }

                const booking =
                    freshDoc.data();

                if (booking.status !== "success") {

                    return {
                        type: "invalid"
                    };
                }

                if (booking.entryStatus === "used") {

                    return {
                        type: "used",
                        usedAt:
                            booking.usedAt || null
                    };
                }

                const now =
                    admin.firestore.Timestamp.now();

                transaction.update(
                    ticketDoc.ref,
                    {
                        entryStatus: "used",
                        usedAt: now,
                        verifiedAt: now,
                        verifiedBy:
                            req.admin.email
                    }
                );

                return {
                    type: "success",
                    booking
                };
            });

        if (result.type === "invalid") {

            return res.status(403).json({
                success: false,
                status: "INVALID",
                message: "Payment is not verified."
            });
        }

        if (result.type === "used") {

            return res.status(409).json({
                success: false,
                status: "USED",
                message: "Ticket has already been used.",
                usedAt: result.usedAt
            });
        }

        return res.status(200).json({

            success: true,

            status: "USED",

            message:
                "Ticket verified and entry marked successfully.",

            ticket: {

                ticketId:
                    result.booking.ticketId,

                name:
                    result.booking.name,

                ticketType:
                    result.booking.ticketType,

                ticketQuantity:
                    result.booking.ticketQuantity
            }
        });

    } catch (error) {

        console.error(
            "Use ticket error:",
            error
        );

        return res.status(500).json({
            success: false,
            status: "ERROR",
            message: "Unable to process ticket."
        });
    }
});



// ================= ROOT =================
app.get("/", (req, res) => {
    res.send("Tribal Rhythm API Running 🚀");
});


// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
    console.error("Global Error:", err);

    if (res.headersSent) {
        return next(err);
    }

    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});
// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});