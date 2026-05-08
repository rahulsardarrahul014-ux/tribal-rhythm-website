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
app.use(cors({
    origin: [
        "https://tribal-rhythm-frontend.onrender.com", // apna frontend URL
        "http://127.0.0.1:5500" // local testing
    ]
}));

// ================= FIREBASE INIT =================
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
};

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
        // 🔥 CHECK LAST OTP TIME
        const recordDoc = await db.collection("otp").doc(email).get();
        const record = recordDoc.exists ? recordDoc.data() : null;

        const last = record?.time || 0;

        if (Date.now() - last < 60000) {
            return res.json({ success: false, message: "Wait 60 sec" });
        }

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

app.post("/verify-payment", (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expected === razorpay_signature) {
            return res.json({ success: true });
        }

        res.status(400).json({ success: false });

    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
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
    try {

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
            console.log("❌ Webhook secret missing");
            return res.status(500).send("Webhook secret not set");
        }

        // 🔥 Signature generate
        const shasum = crypto.createHmac("sha256", secret);
        shasum.update(req.rawBody);
        const digest = shasum.digest("hex");

        const razorpaySignature = req.headers["x-razorpay-signature"];

        if (!razorpaySignature) {
            console.log("❌ Signature missing");
            return res.status(400).send("Signature missing");
        }

        // 🔥 Secure compare
        const isValid = crypto.timingSafeEqual(
            Buffer.from(digest),
            Buffer.from(razorpaySignature)
        );

        if (!isValid) {
            console.log("❌ Invalid signature");
            return res.status(400).send("Invalid signature");
        }

        // ================= PAYMENT DATA =================
        const payment = req.body?.payload?.payment?.entity;

        if (!payment) {
            console.log("❌ Payment data missing");
            return res.status(400).send("Invalid payload");
        }

        const email = payment.notes?.email;

        if (!email) {
            console.log("❌ Email missing in payment notes");
            return res.json({ success: false, message: "Email missing" });
        }

        // ================= SAVE PAYMENT =================
        await db.collection("payments").add({
            email,
            amount: payment.amount / 100,
            status: "paid",
            paymentId: payment.id,
            time: new Date()
        });

        // ================= NOTIFICATION =================
        await db.collection("notifications").add({
            type: "payment",
            message: `Payment received from ${email}`,
            time: new Date()
        });

        // ================= UPDATE USER =================
        const userRef = db.collection("users").doc(email);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            await userRef.update({
                paymentStatus: "paid",
                status: "approved"
            });
        }

        console.log("✅ Webhook processed successfully");

        return res.json({ success: true });

    } catch (err) {
        console.log("❌ WEBHOOK ERROR:", err);
        return res.status(500).json({ success: false });
    }
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
        const { ticketType, email } = req.body;

        let amount = 0;

        if (ticketType === "General") amount = 49900;
        else if (ticketType === "VIP") amount = 99900;
        else if (ticketType === "Group") amount = 39900;

        const order = await razorpay.orders.create({
            amount: amount,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
            notes: { email }
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Error creating order");
    }
});
// ================= SERVER TEST =================
app.get("/", (req, res) => {
    res.send("API Running 🚀");
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("🚀 Server running on", PORT);
});