// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const AdminUserCreation = require("./Utils/seedAdmin");
// const cookieParser = require("cookie-parser");
// const fileUpload = require("express-fileupload");
// const CreatTables = require("./Utils/CreateTables");
// const { errorMiddleware } = require("./Middlewares/errorMiddlewares");
// const Authroutes = require("./Routes/AuthRoutes");
// const ProdcutRoutes = require("./Routes/ProductRoutes");
// const AdminRoutes = require("./Routes/AdminRoutes");
// const OrderRoutes = require("./Routes/OrderRoutes");
// const wishlistRoutes = require("./Routes/wishlistRoutes");
// const SubscribeEmail = require("./Routes/subscribeRoutes");
// const ContactRoutes = require("./Routes/contactRoutes");
// const vendorRequestRoutes = require("./Routes/vendorRequestRoutes");
// const Stripe = require("stripe");
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// const database = require("./Database/db");
// const app = express();

// app.use(
//   cors({
//     origin: [
//       process.env.FRONTEND_URL,
//       process.env.DASHBOARD_URL,
//       process.env.VENDOR_DASHBOARD_URL,
//       "http://localhost:3000",
//       "http://localhost:4200",
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     credentials: true,
//   }),
// );
// // Stripe Method
// app.post(
//   "/api/v1/payments/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     const signature = req.headers["stripe-signature"];
//     let events;

//     try {
//       // Use the stripe instance, not Stripe class
//       events = stripe.webhooks.constructEvent(
//         req.body,
//         signature,
//         process.env.STRIPE_WEBHOOK_SECRET,
//       );
//     } catch (error) {
//       console.log("Webhook signature verification failed:", error.message);
//       return res.status(400).send(`Webhook Error: ${error.message}`);
//     }

//     // Handle The Events
//     if (events.type === "payment_intent.succeeded") {
//       const paymentIntentId = events.data.object.id;
//       console.log("Payment succeeded for:", paymentIntentId);

//       try {
//         const updatedPaymentStatus = "Paid";
//         const paymentTableUpdateStatus = await database.query(
//           `UPDATE payments SET payment_status=$1 WHERE payment_intent_id=$2 RETURNING *`,
//           [updatedPaymentStatus, paymentIntentId],
//         );

//         if (paymentTableUpdateStatus.rows.length === 0) {
//           console.log("Payment not found in DB for intent:", paymentIntentId);
//           return res.status(404).send("Payment not found in DB");
//         }

//         await database.query(
//           `UPDATE orders SET Paid_at=NOW() WHERE id=$1 RETURNING *`,
//           [paymentTableUpdateStatus.rows[0].order_id],
//         );

//         // Reduce Stock for Each Product
//         const orderId = paymentTableUpdateStatus.rows[0].order_id;
//         const { rows: orderedItem } = await database.query(
//           `SELECT product_id, quantity FROM order_items WHERE order_id=$1`,
//           [orderId],
//         );

//         for (const item of orderedItem) {
//           await database.query(
//             `UPDATE products SET stock=stock - $1 WHERE id=$2`,
//             [item.quantity, item.product_id],
//           );
//         }

//         console.log("Payment and order updated successfully");
//       } catch (error) {
//         console.error("Database error:", error);
//         return res.status(500).send(`Error updating payment: ${error.message}`);
//       }
//     }

//     res.status(200).json({ received: true });
//   },
// );

// app.use(cookieParser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "./uploads",
//   }),
// );
// app.use((req, res, next) => {
//   console.log("\n========== REQUEST ==========");
//   console.log(`${req.method} ${req.url}`);
//   console.log("Cookies:", req.cookies); // ✅ ab defined hoga
//   console.log("Body:", req.body);
//   console.log("Origin:", req.headers.origin);
//   next(); // ✅ yeh zaroori hai - warna request stuck ho jati hai
// });
// // DB mode switch (local <-> live)
// app.get("/api/db-mode", (req, res) => {
//   res.json({ mode: database.getMode() });
// });

// app.post("/api/db-mode", (req, res) => {
//   const { mode } = req.body; // "local" ya "live"
//   database.setMode(mode);
//   res.json({ mode: database.getMode() });
// });
// app.use("/api/v1/auth", Authroutes);
// app.use("/api/v1/product", ProdcutRoutes);
// app.use("/api/v1/admin", AdminRoutes);
// app.use("/api/v1/order", OrderRoutes);
// app.use("/api/v1/wishlist", wishlistRoutes);
// app.use("/api/v1/email", SubscribeEmail);
// app.use("/api/v1/contact", ContactRoutes);
// app.use("/api/v1/vendor-requests", vendorRequestRoutes);

// // CreatTables();
// // (async () => {
// //   await database.runOn("local", CreatTables);
// //   await database.runOn("live", CreatTables);
// // })();
// app.locals.databaseReady = (async () => {
//   for (const dbMode of ["local", "live"]) {
//     await database.runOn(dbMode, async () => {
//       await CreatTables();
//       await AdminUserCreation();
//     });

//     console.log(`${dbMode}: tables and admin initialized`);
//   }
// })();
// app.use(errorMiddleware);
// app.get("/", (req, res) => {
//   res.send("API is alive & working");
// });

// module.exports = app;
require("dotenv").config();
const os = require("os");
const express = require("express");
const cors = require("cors");
const AdminUserCreation = require("./Utils/seedAdmin");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const CreatTables = require("./Utils/CreateTables");
const { errorMiddleware } = require("./Middlewares/errorMiddlewares");
const Authroutes = require("./Routes/AuthRoutes");
const ProdcutRoutes = require("./Routes/ProductRoutes");
const AdminRoutes = require("./Routes/AdminRoutes");
const OrderRoutes = require("./Routes/OrderRoutes");
const wishlistRoutes = require("./Routes/wishlistRoutes");
const SubscribeEmail = require("./Routes/subscribeRoutes");
const ContactRoutes = require("./Routes/contactRoutes");
const vendorRequestRoutes = require("./Routes/vendorRequestRoutes");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const database = require("./Database/db");
const app = express();

const isProduction =
  process.env.NODE_ENV === "production" || process.env.DB_MODE === "live";

// Render proxy ke peeche chalta hai, is liye secure cookies ke liye zaroori hai
app.set("trust proxy", 1);

// ---------------- CORS ----------------
// Origin ke end se "/" hata dein taake match sahi ho
const clean = (url) => (url ? url.trim().replace(/\/+$/, "") : "");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.DASHBOARD_URL,
  process.env.VENDOR_DASHBOARD_URL,
  "http://localhost:3000",
  "http://localhost:4200",
  "http://localhost:5173",
]
  .map(clean)
  .filter(Boolean);

// Vercel preview URLs (jaise project-abc123-team.vercel.app) bhi allow honge,
// lekin sirf unhi projects ke jinke URLs env mein diye hain
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const vercelPreviewPatterns = allowedOrigins
  .map((origin) => {
    try {
      const host = new URL(origin).hostname;
      if (!host.endsWith(".vercel.app")) return null;
      const projectName = host.slice(0, -".vercel.app".length);
      return new RegExp(
        `^https://${escapeRegex(projectName)}-[a-z0-9-]+\\.vercel\\.app$`,
      );
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Postman, server-to-server, Stripe webhook (origin nahi hota)
    if (!origin) return callback(null, true);

    const o = clean(origin);
    if (
      allowedOrigins.includes(o) ||
      vercelPreviewPatterns.some((re) => re.test(o))
    ) {
      return callback(null, true);
    }

    console.log("CORS blocked origin:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ---------------- Stripe Webhook ----------------
// express.json() se pehle hona zaroori hai (raw body chahiye)
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    let events;

    try {
      events = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.log("Webhook signature verification failed:", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (events.type === "payment_intent.succeeded") {
      const paymentIntentId = events.data.object.id;
      console.log("Payment succeeded for:", paymentIntentId);

      try {
        const updatedPaymentStatus = "Paid";
        const paymentTableUpdateStatus = await database.query(
          `UPDATE payments SET payment_status=$1 WHERE payment_intent_id=$2 RETURNING *`,
          [updatedPaymentStatus, paymentIntentId],
        );

        if (paymentTableUpdateStatus.rows.length === 0) {
          console.log("Payment not found in DB for intent:", paymentIntentId);
          return res.status(404).send("Payment not found in DB");
        }

        await database.query(
          `UPDATE orders SET Paid_at=NOW() WHERE id=$1 RETURNING *`,
          [paymentTableUpdateStatus.rows[0].order_id],
        );

        // Reduce Stock for Each Product
        const orderId = paymentTableUpdateStatus.rows[0].order_id;
        const { rows: orderedItem } = await database.query(
          `SELECT product_id, quantity FROM order_items WHERE order_id=$1`,
          [orderId],
        );

        for (const item of orderedItem) {
          await database.query(
            `UPDATE products SET stock=stock - $1 WHERE id=$2`,
            [item.quantity, item.product_id],
          );
        }

        console.log("Payment and order updated successfully");
      } catch (error) {
        console.error("Database error:", error);
        return res.status(500).send(`Error updating payment: ${error.message}`);
      }
    }

    res.status(200).json({ received: true });
  },
);

// ---------------- Middlewares ----------------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    // Render pe ./uploads folder nahi hota, system temp folder use karein
    tempFileDir: os.tmpdir(),
  }),
);

// Request logging: sirf local mein. Body/cookies (password, token) production
// logs mein kabhi nahi aane chahiye
app.use((req, res, next) => {
  if (isProduction) {
    console.log(`${req.method} ${req.url} | Origin: ${req.headers.origin}`);
  } else {
    console.log("\n========== REQUEST ==========");
    console.log(`${req.method} ${req.url}`);
    console.log("Cookies:", req.cookies);
    console.log("Body:", req.body);
    console.log("Origin:", req.headers.origin);
  }
  next();
});

// ---------------- DB mode switch (sirf local development) ----------------
// Production mein yeh routes band hain, warna koi bhi DB mode badal sakta hai
if (!isProduction) {
  app.get("/api/db-mode", (req, res) => {
    res.json({ mode: database.getMode() });
  });

  app.post("/api/db-mode", (req, res) => {
    const { mode } = req.body; // "local" ya "live"
    database.setMode(mode);
    res.json({ mode: database.getMode() });
  });
}

// ---------------- Routes ----------------
app.get("/", (req, res) => {
  res.send("API is alive & working");
});

app.use("/api/v1/auth", Authroutes);
app.use("/api/v1/product", ProdcutRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/order", OrderRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/email", SubscribeEmail);
app.use("/api/v1/contact", ContactRoutes);
app.use("/api/v1/vendor-requests", vendorRequestRoutes);

// ---------------- Database init ----------------
// Production mein sirf live, local development mein local + live dono
app.locals.databaseReady = (async () => {
  const modes = isProduction ? ["live"] : ["local", "live"];

  for (const dbMode of modes) {
    await database.runOn(dbMode, async () => {
      await CreatTables();
      await AdminUserCreation();
    });

    console.log(`${dbMode}: tables and admin initialized`);
  }
})();

// Error middleware hamesha sab routes ke baad
app.use(errorMiddleware);

module.exports = app;