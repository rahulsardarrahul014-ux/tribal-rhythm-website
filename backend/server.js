require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
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
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\n/g, "\n")
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

const transporter = nodemailer.createTransport({

    host: "smtp-relay.brevo.com",

    port: 587,

    secure: false,

    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
    },

    tls: {
        minVersion: "TLSv1.2"
    },

    connectionTimeout: 60000,

    greetingTimeout: 30000,

    socketTimeout: 60000

});

transporter.verify((err) => {

    if (err) {
        console.log("SMTP ERROR:", err);
    } else {
        console.log("SMTP Connected ✅");
    }

});

// ================= RATE LIMIT =================
const otpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5
});

app.use("/send-otp", otpLimiter);


const adminOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
});

app.use("/admin/send-otp", adminOtpLimiter);


// ================= ADMIN OTP HELPERS =================

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

const getAdminEmails = () => {
    return String(process.env.ADMIN_EMAILS || "")
        .split(",")
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);
};

// ================= HELPERS =================
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(email || "").trim()
    );
};

// ================= SEND OTP =================
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

        // Make sure this email exists in Firebase Authentication
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

        await db
            .collection("adminOtps")
            .doc(email)
            .set({
                otpHash,
                uid: adminUser.uid,
                attempts: 0,
                createdAt: admin.firestore.Timestamp.now(),
                expiresAt: admin.firestore.Timestamp.fromMillis(
                    Date.now() + 5 * 60 * 1000
                )
            });

        await transporter.sendMail({

            from:
                `TRIBAL RHYTHM <${process.env.BREVO_USER}>`,

            to: email,

            subject:
                "🔐 Tribal Rhythm Admin OTP",

            html: `
                <div style="
                    font-family:Arial;
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
                    ">
                        ${otp}
                    </h1>

                    <p>
                        This OTP is valid for
                        <b>5 minutes</b>.
                    </p>

                    <p>
                        Never share this OTP with anyone.
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
            message: "Admin OTP sent successfully"
        });

    } catch (error) {

        console.error(
            "ADMIN SEND OTP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to send admin OTP"
        });
    }
});

app.post("/send-phone-otp", async (req, res) => {
    try {

        const { mobile, name } = req.body;

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Mobile Number"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        console.log("Phone:", mobile);
        console.log("OTP:", otp);
        console.log("MSG91 KEY:", process.env.MSG91_AUTH_KEY ? "Loaded" : "Missing");

       

        const response = await axios.post(
            "https://control.msg91.com/api/v5/oneapi/api/flow/tribalrhythmotp/run",
            {
                data: {
                    sendTo: [{
                        to: [{
                            mobiles: "91" + mobile,
                            variables: {
                                name: {
                                    value: name || "User"
                                },
                                otp: {
                                    value: otp
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

        console.log("MSG91 RESPONSE:", response.data);

        await db.collection("phoneOtp").doc(mobile).set({
            otp,
            time: Date.now()
        });

        res.json({
            success: true,
            message: "Phone OTP Sent"
        });

    } catch (err) {

        console.log("MSG91 ERROR:", err.response?.data || err.message);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
});

// ================= VERIFY OTP =================
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

        const finalAmount = Number(amount) * 100;

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

        await axios.post(
            "https://tribal-rhythm-backend.onrender.com/send-payment-success-sms",
            {
                name: user.name,
                mobile: user.mobile,
                ticketId: user.ticketId,
                amount: 300
            }
        );

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

app.post("/send-registration-email", checkAdmin,async (req, res) => {

    try {

        const { name, email, ticketId } = req.body;

        await transporter.sendMail({

            from: `TRIBAL RHYTHM <${process.env.BREVO_USER}>`,

            to: email,

            subject: "🎟️ Tribal Rhythm Ticket Booking Successful",

            html: `
                <h2>Payment Successful 🎉</h2>

                <p>Hello <b>${name}</b>,</p>

                <p>
                    Your ticket booking has been successfully completed.
                </p>

                <p>
                    <b>Ticket ID:</b> ${ticketId}
                </p>

                <p>
                    Thank you for booking with Tribal Rhythm.
                </p>

                <h3>Team Tribal Rhythm</h3>
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

app.post("/send-bulk-email",checkAdmin, async (req, res) => {

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



        await transporter.sendMail({

            from:
                `TRIBAL RHYTHM <${process.env.BREVO_USER}>`,

            bcc: users,

            subject: subject,


            html: `

            <div style="font-family:Arial">

            <h2>🎭 Tribal Rhythm</h2>

            <p>${message}</p>

            </div>

            `

        });



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

app.post("/send-bulk-sms",checkAdmin, async (req, res) => {

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

// ================= PAYMENT SUCCESS SMS =================

app.post("/send-payment-success-sms",checkAdmin, async (req, res) => {

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

app.post("/send-registration-sms",checkAdmin, async (req, res) => {

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

app.post("/send-winner-sms",checkAdmin, async (req, res) => {

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

app.post("/send-certificate-ready",checkAdmin, async (req, res) => {

    try {

        const { name, mobile, email, certificateNo } = req.body;

        // Email
        await transporter.sendMail({

            from: `TRIBAL RHYTHM <${process.env.BREVO_USER}>`,

            to: email,

            subject: "🎓 Certificate Ready",

            html: `

<h2>Certificate Ready</h2>

<p>Hello <b>${name}</b>,</p>

<p>Your participation certificate is now ready.</p>

<p><b>Certificate No:</b> ${certificateNo}</p>

<p>Please login to Tribal Rhythm and download your certificate.</p>

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



app.post("/admin/send-otp", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email required"
            });
        }

        const otp = generateOTP();

        adminOtps.set(email, {
            otp: otp,
            expiresAt: Date.now() + (5 * 60 * 1000),
            attempts: 0
        });

        const brevoResponse = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    "accept": "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json"
                },

                body: JSON.stringify({

                    sender: {
                        name: "Tribal Rhythm",
                        email: process.env.BREVO_SENDER_EMAIL
                    },

                    to: [
                        {
                            email: email
                        }
                    ],

                    subject:
                        "Tribal Rhythm Admin OTP",

                    htmlContent: `
                        <div style="
                            font-family:Arial;
                            padding:20px;
                        ">

                            <h2>
                                Tribal Rhythm Admin
                            </h2>

                            <p>
                                Your verification OTP is:
                            </p>

                            <h1>
                                ${otp}
                            </h1>

                            <p>
                                This OTP is valid for
                                5 minutes.
                            </p>

                            <p>
                                Powered by
                                <strong>Zentro Nex</strong>
                            </p>

                        </div>
                    `
                })
            }
        );

        if (!brevoResponse.ok) {

            const error =
                await brevoResponse.text();

            console.error(
                "Brevo Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "OTP email failed"
            });
        }

        res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {

        console.error(
            "Send OTP Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

app.post("/admin/verify-otp", async (req, res) => {

    try {

        const { email, otp } = req.body;

        if (!email || !otp) {

            return res.status(400).json({
                success: false,
                message: "Email and OTP required"
            });
        }

        const record =
            adminOtps.get(email);

        if (!record) {

            return res.status(400).json({
                success: false,
                message: "OTP not found or expired"
            });
        }

        if (
            Date.now() >
            record.expiresAt
        ) {

            adminOtps.delete(email);

            return res.status(400).json({
                success: false,
                message: "OTP expired"
            });
        }

        if (
            String(record.otp) !==
            String(otp)
        ) {

            record.attempts++;

            if (record.attempts >= 5) {
                adminOtps.delete(email);
            }

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        adminOtps.delete(email);

        res.json({
            success: true,
            message: "OTP verified"
        });

    } catch (error) {

        console.error(
            "Verify OTP Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "OTP verification failed"
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