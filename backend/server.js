require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const app = express();

// 🔥 RAW BODY (Razorpay fix)
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cors());

// ================= FIREBASE INIT =================
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ================= ADMIN SECURITY =================
const checkAdmin = (req, res, next) => {
    if (req.headers.authorization !== process.env.ADMIN_SECRET) {
        return res.status(403).send("Unauthorized");
    }
    next();
};

// ================= EMAIL =================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ================= SEND OTP =================
app.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;

        // ❌ Anti spam
        const existing = await db.collection("users").doc(email).get();
        if (existing.exists) {
            return res.json({ success: false, message: "Already registered" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        // ✅ Store in DB (not memory)
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
        console.log("❌ EMAIL ERROR:", err);
        res.json({ success: false });
    }
});

// ================= VERIFY OTP =================
app.post("/verify-otp", async (req, res) => {

    const { email, otp, name, mobile } = req.body;

    const doc = await db.collection("otp").doc(email).get();

    if (!doc.exists) {
        return res.json({ success: false, message: "OTP expired" });
    }

    const record = doc.data();

    if (Date.now() - record.time > 5 * 60 * 1000) {
        await db.collection("otp").doc(email).delete();
        return res.json({ success: false, message: "OTP expired" });
    }

    if (record.otp == otp) {

        await db.collection("otp").doc(email).delete();

        // 🎟 Ticket ID
        const ticketId = "TR-" + Math.random().toString(36).substr(2, 8).toUpperCase();

        await db.collection("users").doc(email).set({
            email,
            name: name || "",
            mobile: mobile || "",
            ticketId,
            paymentStatus: "pending",
            status: "pending",
            createdAt: new Date()
        });

        return res.json({ success: true, ticketId });
    }

    res.json({ success: false, message: "Wrong OTP" });
});

// ================= ENTRY CHECK =================
app.post("/check-entry", async (req, res) => {

    const { email } = req.body;

    const system = await db.collection("settings").doc("system").get();
    if (system.exists && system.data().locked) {
        return res.json({ allowed: false, reason: "System Locked" });
    }

    const userDoc = await db.collection("users").doc(email).get();

    if (!userDoc.exists) {
        return res.json({ allowed: false, reason: "Not registered" });
    }

    const user = userDoc.data();

    if (user.paymentStatus !== "paid") {
        return res.json({ allowed: false, reason: "Payment required" });
    }

    if (user.status !== "approved") {
        return res.json({ allowed: false, reason: "Not approved" });
    }

    res.json({ allowed: true, ticketId: user.ticketId });
});

// ================= ADMIN ROUTES =================
app.get("/all-users", checkAdmin, async (req, res) => {

    const snapshot = await db.collection("users").get();

    let users = [];

    snapshot.forEach(doc => {
        users.push({
            id: doc.id,
            data: doc.data()
        });
    });

    res.json(users);
});

app.post("/approve-user", checkAdmin, async (req, res) => {

    const { email } = req.body;

    await db.collection("users").doc(email).update({
        status: "approved"
    });

    res.json({ success: true });
});

app.post("/reject-user", checkAdmin, async (req, res) => {

    const { email } = req.body;

    await db.collection("users").doc(email).update({
        status: "rejected"
    });

    res.json({ success: true });
});

// ================= SYSTEM LOCK =================
app.post("/toggle-lock", checkAdmin, async (req, res) => {

    const { status } = req.body;

    await db.collection("settings").doc("system").set({
        locked: status
    });

    res.json({ success: true });
});

// ================= RAZORPAY WEBHOOK =================
app.post("/razorpay-webhook", async (req, res) => {

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.rawBody);
    const digest = shasum.digest("hex");

    if (digest === req.headers["x-razorpay-signature"]) {

        const payment = req.body.payload.payment.entity;

        // ✅ safer email source
        const email = payment.notes?.email || payment.email;

        await db.collection("payments").add({
            email,
            amount: payment.amount / 100,
            status: "paid",
            time: new Date()
        });

        await db.collection("notifications").add({
            type: "payment",
            message: `Payment received from ${email}`,
            time: new Date()
        });

        await db.collection("users").doc(email).update({
            paymentStatus: "paid",
            status: "approved"
        });

        return res.json({ success: true });
    }

    res.status(400).send("Invalid signature");
});

// ================= NOTIFICATIONS =================
app.get("/notifications", checkAdmin, async (req, res) => {

    const snap = await db.collection("notifications").orderBy("time", "desc").get();

    let data = [];

    snap.forEach(doc => {
        data.push(doc.data());
    });

    res.json(data);
});
// ================= CREATE ORDER =================
app.post("/create-order", async (req, res) => {

    try {
        const { amount, email } = req.body;

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
            notes: {
                email: email
            }
        };

        const order = await razorpay.orders.create(options);

        res.json(order);

    } catch (err) {
        console.log(err);
        res.status(500).send("Error creating order");
    }
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("🚀 Server running on", PORT);
});