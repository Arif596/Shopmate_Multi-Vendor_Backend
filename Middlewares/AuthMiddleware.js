const catchAsyncError = require("../Middlewares/catchAsyncError");
const { ErrorHandler } = require("../Middlewares/errorMiddlewares");
const database = require("../Database/db");
const jwt = require("jsonwebtoken");

// const isAuthenticated = catchAsyncError(async (req, res, next) => {
//   const token = req.cookies.adminToken || req.cookies.userToken;
//   console.log("User token", req.userToken);
//   // const { token } = req.cookies;
//   if (!token) {
//     return next(new ErrorHandler("Please Login to access this resource", 401));
//   }
//   const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//   const user = await database.query(`SELECT* FROM users WHERE id=$1 LIMIT 1 `, [
//     decoded.id,
//   ]);
//   req.user = user.rows[0];
//   next();
// });
// isAuthenticated.js
// const isAuthenticated = catchAsyncError(async (req, res, next) => {
//   const origin = req.headers.origin || "";
//   let token;
//   if (origin.includes("5174")) {
//     token = req.cookies.adminToken;
//   } else if (origin.includes("5173")) {
//     token = req.cookies.userToken;
//   } else {
//     token = req.cookies.adminToken || req.cookies.userToken;
//   }

//   if (!token) {
//     return next(new ErrorHandler("Please Login to access this resource", 401));
//   }

//   const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//   console.log("✅ Decoded ID:", decoded.id);

//   const user = await database.query(`SELECT * FROM users WHERE id=$1 LIMIT 1`, [
//     decoded.id,
//   ]);

//   if (!user.rows[0]) {
//     return next(new ErrorHandler("User not found", 401));
//   }

//   req.user = user.rows[0];
//   next();
// });
// const isAuthenticated = catchAsyncError(async (req, res, next) => {
//   const origin = req.headers.origin || "";
//   let token;

//   if (origin === process.env.DASHBOARD_URL) {
//     token = req.cookies.adminToken;
//   } else if (origin === process.env.VENDOR_DASHBOARD_URL) {
//     token = req.cookies.vendorToken;
//   } else if (origin === process.env.FRONTEND_URL) {
//     token = req.cookies.userToken;
//   } else {
//     token =
//       req.cookies.adminToken ||
//       req.cookies.vendorToken ||
//       req.cookies.userToken; // Postman etc.
//   }

//   if (!token) {
//     return next(new ErrorHandler("Please Login to access this resource", 401));
//   }

//   const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

//   const user = await database.query(`SELECT * FROM users WHERE id=$1 LIMIT 1`, [
//     decoded.id,
//   ]);

//   if (!user.rows[0]) {
//     return next(new ErrorHandler("User not found", 401));
//   }

//   req.user = user.rows[0];
//   next();
// });
const normalize = (u) => (u || "").replace(/\/+$/, "");

const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const rawOrigin = req.headers.origin;
  const origin = normalize(rawOrigin);
  const isAdminApp = origin && origin === normalize(process.env.DASHBOARD_URL);
  const isUserApp = origin && origin === normalize(process.env.FRONTEND_URL);
  let token;

  if (isAdminApp) token = req.cookies.adminToken;
  else if (isUserApp) token = req.cookies.userToken;
  else if (!rawOrigin) token = req.cookies.userToken || req.cookies.adminToken; // Postman

  if (!token) {
    return next(new ErrorHandler("Please Login to access this resource", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const result = await database.query(
    `SELECT * FROM users WHERE id=$1 LIMIT 1`,
    [decoded.id],
  );
  const user = result.rows[0];

  if (!user) {
    return next(new ErrorHandler("User not found", 401));
  }

  // Role aur app ka match zaroori hai
  if (isUserApp && user.role === "Admin") {
    return next(new ErrorHandler("Please login again", 401));
  }
  if (isAdminApp && user.role !== "Admin") {
    return next(new ErrorHandler("Admin access only", 403));
  }

  req.user = user;
  next();
});
const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role ${req.user.role} is not allowed ti access this role`,
          400,
        ),
      );
    }
    next();
  };
};

module.exports = { authorizedRoles, isAuthenticated };
