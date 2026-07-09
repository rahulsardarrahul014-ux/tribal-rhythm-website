require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const rateLimit = require("express-rate-limit");

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

const allowedOrigins = [
    "https://rahulsardarrahul014-ux.github.io"
];

app.use(cors({
    origin: function (origin, callback) {

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }

    },
    credentials: true
}));

// ================= FIREBASE INIT =================
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// ================= ADMIN SECURITY =================
const checkAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token) return res.status(403).send("Unauthorized");

        await admin.auth().verifyIdToken(token);

        next();
    } catch (err) {
        return res.status(403).send("Unauthorized");
    }
};

// ================= RAZORPAY =================
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ================= EMAIL =================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ================= RATE LIMIT =================
const otpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5
});

app.use("/send-otp", otpLimiter);

// ================= HELPERS =================
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ================= SEND OTP =================
app.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email" });
        }

        const userRef = db.collection("users").doc(email);
        const userSnap = await userRef.get();

        if (userSnap.exists) {
            return res.json({ success: false, message: "Already registered" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        await db.collection("otp").doc(email).set({
            otp,
            time: Date.now()
        });

        await transporter.sendMail({
            from: `TRIBAL RHYTHM <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "OTP Verification",
            text: `Your OTP is: ${otp}`
        });

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp, name, mobile } = req.body;

        if (!email || !otp || !isValidEmail(email)) {
            return res.status(400).json({ success: false });
        }

        const doc = await db.collection("otp").doc(email).get();

        if (!doc.exists) {
            return res.json({ success: false, message: "OTP expired" });
        }

        const data = doc.data();

        if (Date.now() - data.time > 5 * 60 * 1000) {
            return res.json({ success: false, message: "OTP expired" });
        }

        if (String(data.otp) !== String(otp)) {
            return res.json({ success: false, message: "Wrong OTP" });
        }

        await db.collection("otp").doc(email).delete();

        const ticketId = "TR-" + crypto.randomBytes(4).toString("hex").toUpperCase();

        await db.collection("users").doc(email).set({
            email,
            name: name || "",
            mobile: mobile || "",
            ticketId,
            paymentStatus: "pending",
            status: "pending",
            createdAt: new Date()
        });

        res.json({ success: true, ticketId });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// ================= CREATE ORDER (FIXED FOR FRONTEND =================
app.post("/create-order", async (req, res) => {
    try {
        const { amount, email } = req.body;
        console.log("Amount received:", amount);
        console.log("Amount type:", typeof amount);
        console.log("Amount sent to Razorpay:", amount * 100);

        if (!amount || !email || !isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid request" });
        }

        const finalAmount = Number(amount) * 100;
        console.log(finalAmount);

        const order = await razorpay.orders.create({
            // amount: amount * 100, // rupees → paise
            amount: finalAmount,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
            notes: {
                email
            }
        });

        res.json({
            id: order.id,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Order failed" });
    }
});

// ================= VERIFY PAYMENT =================
app.post("/verify-payment", (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expected === razorpay_signature) {
            return res.json({ success: true });
        }

        res.status(400).json({ success: false });

    } catch (err) {
        res.status(500).json({ success: false });
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
            status: "approved"
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

        res.json({ allowed: true, ticketId: user.ticketId });

    } catch (err) {
        res.status(500).json({ allowed: false });
    }
});

// ================= ROOT =================
app.get("/", (req, res) => {
    res.send("Tribal Rhythm API Running 🚀");
});

// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});