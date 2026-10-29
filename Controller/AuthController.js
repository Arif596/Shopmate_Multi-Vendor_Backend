// const database = require("../Database/db");
// const catchAsyncError = require("../Middlewares/catchAsyncError");
// const { ErrorHandler } = require("../Middlewares/errorMiddlewares");
// const bcrypt = require("bcrypt");
// const crypto = require("crypto");
// const cloudinary = require("cloudinary").v2;
// const sendToken = require("../Utils/JwtToken");
// const FetchAllUser = require("../Utils/userService");
// const generateForgetPassTemp = require("../Utils/generateForgotPasswordEmailTemplate");
// const generateResetPasswordToken = require("../Utils/generateResetPasswordToken");
// const sendEmail = require("../Utils/sendEmail");
// const register = catchAsyncError(async (req, res, next) => {
//   const { name, email, password } = req.body;

//   if (!name || !email || !password) {
//     return next(new ErrorHandler("Please provide all required fields", 400));
//   }

//   const isAlreadyUser = await database.query(
//     `SELECT * FROM users WHERE email = $1`,
//     [email],
//   );

//   if (isAlreadyUser.rows.length > 0) {
//     return next(new ErrorHandler("User already registered", 400));
//   }
//   const hashPassword = await bcrypt.hash(password, 10);
//   const user = await database.query(
//     "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *",
//     [name, email, hashPassword],
//   );

//   sendToken(user.rows[0], 201, "User Created Successfully", res);
// });
// const Login = catchAsyncError(async (req, res, next) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return next(new ErrorHandler("please provide email and password", 400));
//   }
//   const user = await database.query(`SELECT* FROM users WHERE email=$1`, [
//     email,
//   ]);
//   if (user.rows.length === 0) {
//     return next(new ErrorHandler("Invalid email or password", 401));
//   }
//   const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);
//   if (!isPasswordMatch) {
//     return next(new ErrorHandler("Invalid Email or Password", 401));
//   }
//   sendToken(user.rows[0], 200, "Loggoed In Successfully", res);
// });
// const GetUsers = catchAsyncError(async (req, res, next) => {
//   const { user } = req;
//   res.status(200).json({ success: true, user });
// });
// const getAllUser = catchAsyncError(async (req, res, next) => {
//   const user = await FetchAllUser();
//   res.status(200).json({
//     success: true,
//     user,
//   });
// });
// // const Logout = catchAsyncError(async (req, res, next) => {
// //   const cookieName = req.user.role === "Admin" ? "adminToken" : "userToken";
// //   res
// //     .status(200)
// //     .cookie(cookieName, null, {
// //       expires: new Date(Date.now()),
// //       httpOnly: true,
// //     })

// //     .json({
// //       success: true,
// //       message: "Logout Successfully",
// //     });
// // });
// const Logout = catchAsyncError(async (req, res, next) => {
//   const origin = req.headers.origin || "";

//   let cookieName = "userToken";
//   if (origin === process.env.DASHBOARD_URL) cookieName = "adminToken";
//   else if (origin === process.env.VENDOR_DASHBOARD_URL) cookieName = "vendorToken";
//   res
//     .status(200)
//     .cookie(cookieName, null, {
//       expires: new Date(Date.now()),
//       httpOnly: true,
//       secure: true,
//       sameSite: "None",
//     })
//     .json({ success: true, message: "Logout Successfully" });
// });
// const forgotPassword = catchAsyncError(async (req, res, next) => {
//   const { email } = req.body;
//   const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
//   const result = await database.query(`SELECT * FROM users WHERE email=$1`, [
//     email,
//   ]);

//   if (result.rows.length === 0) {
//     return next(
//       new ErrorHandler("If account exists, reset link has been sent.", 200),
//     );
//   }

//   const user = result.rows[0];
//   const { hashToken, resetPasswordExpireTime, resetToken } =
//     generateResetPasswordToken();
//   await database.query(
//     `UPDATE users SET reset_password_token=$1, reset_password_expire=to_timestamp($2) WHERE email=$3`,
//     [hashToken, resetPasswordExpireTime / 1000, email],
//   );
//   // const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}`;
//   const resetPasswordUrl5173 = `http://localhost:5173/password/reset/${resetToken}`;
//   const resetPasswordUrl5174 = `http://localhost:5174/password/reset/${resetToken}`;
//   // const message = generateForgetPassTemp(resetPasswordUrl);
//   const message5173 = generateForgetPassTemp(resetPasswordUrl5173);
//   const message5174 = generateForgetPassTemp(resetPasswordUrl5174);

//   try {
//     await sendEmail({
//       email: user.email,
//       subject: "Ecommerce Password Recovery",
//       message: message5173,
//     });
//     await sendEmail({
//       email: user.email,
//       subject: "Ecommerce Password Recovery",
//       message: message5174,
//     });
//     console.log("User found:", user.email);
//     console.log("Sending email to 5173...");
//     // after first sendEmail
//     console.log("5173 email sent!");
//     console.log("Sending email to 5174...");
//     // after second sendEmail
//     console.log("5174 email sent!");
//     return res.status(200).json({
//       success: true,
//       message: `If account exists, a reset ${user.email} has been sent.`,
//     });
//   } catch (error) {
//     console.error("❌ Email sending error:", error);
//     await database.query(
//       `UPDATE users SET reset_password_token=NULL, reset_password_expire=NULL WHERE email=$1`,
//       [email],
//     );

//     return next(new ErrorHandler("Email could not be sent", 500));
//   }
// });
// const resetPasswsord = catchAsyncError(async (req, res, next) => {
//   const { token } = req.params;
//   const resetPasswordToken = crypto
//     .createHash("sha256")
//     .update(token)
//     .digest("hex");
//   console.log(124);
//   const user = await database.query(
//     "SELECT * FROM users WHERE reset_password_token=$1 AND reset_password_expire>NOW()",
//     [resetPasswordToken],
//   );
//   console.log(129);
//   if (user.rows.length === 0) {
//     console.log(user.rows);
//     return next(new ErrorHandler("Invalid or Expired reset Token", 400));
//   }

//   if (req.body.password !== req.body.confirmPassword) {
//     return next(new ErrorHandler("Password do not Match", 400));
//   }

//   if (
//     req.body.password?.length < 8 ||
//     req.body.password?.length > 16 ||
//     req.body.confirmPassword?.length < 8 ||
//     req.body.confirmPassword?.length > 16
//   ) {
//     return next(
//       new ErrorHandler("Password must be between 8 and 16 characters"),
//     );
//   }
//   const hashedPassword = await bcrypt.hash(req.body.password, 10);
//   await database.query(
//     "UPDATE users SET password=$1, reset_password_token=NULL, reset_password_expire=NULL WHERE id=$2",
//     [hashedPassword, user.rows[0].id],
//   );

//   res.status(200).json({
//     success: true,
//     user,
//     message: "Password reset successful",
//   });
// });
// //  Update passwi=ord
// const updatePassword = catchAsyncError(async (req, res, next) => {
//   const { cuurentPassword, newPassword, confirmNewPassword } = req.body;
//   if (!cuurentPassword || !newPassword || !confirmNewPassword) {
//     return next(new ErrorHandler("Please Provide all Filed", 400));
//   }
//   const isPasswordMatch = await bcrypt.compare(
//     cuurentPassword,
//     req.user.password,
//   );
//   if (!isPasswordMatch) {
//     return next(new ErrorHandler("Curent password is wrong", 400));
//   }
//   if (newPassword !== confirmNewPassword) {
//     return next(new ErrorHandler("new password do not match", 400));
//   }
//   if (
//     newPassword.length < 8 ||
//     newPassword.length > 16 ||
//     confirmNewPassword.length < 8 ||
//     confirmNewPassword.length > 16
//   ) {
//     return next(
//       new ErrorHandler("Password must be between 8 and 16 characters"),
//     );
//   }
//   const hashedNewPassword = await bcrypt.hash(newPassword, 10);
//   await database.query("UPDATE users SET password=$1 WHERE id=$2", [
//     hashedNewPassword,
//     req.user.id,
//   ]);

//   res.status(200).json({
//     success: true,
//     message: "Password updated successfully",
//   });
// });
// const updateProfile = catchAsyncError(async (req, res, next) => {
//   const { name, email } = req.body;

//   if (!name || !email) {
//     return next(new ErrorHandler("Please provide all fields", 400));
//   }

//   if (name.trim().length === 0 || email.trim().length === 0) {
//     return next(new ErrorHandler("Name and Email cannot be empty", 400));
//   }

//   let avatarData = {};

//   if (req.files && req.files.avatar) {
//     const { avatar } = req.files;

//     if (req.user?.avatar?.public_id) {
//       await cloudinary.uploader.destroy(req.user.avatar.public_id);
//     }
//     console.log("data", 218);
//     const newProfileImage = await cloudinary.uploader.upload(
//       avatar.tempFilePath,
//       {
//         folder: "Ecommerce_Avatar",
//         width: 150,
//         crop: "scale",
//       },
//     );
//     console.log("data", 227);
//     avatarData = {
//       public_id: newProfileImage.public_id,
//       url: newProfileImage.secure_url,
//     };
//   }

//   // If no new avatar, keep the current avatar
//   const finalAvatar =
//     Object.keys(avatarData).length === 0 ? req.user.avatar : avatarData;
//   console.log("data", 236);
//   const updateUser = await database.query(
//     "UPDATE users SET name=$1, email=$2, avatar=$3 WHERE id=$4 RETURNING *",
//     [name, email, finalAvatar, req.user.id],
//   );

//   res.status(200).json({
//     success: true,
//     user: updateUser.rows[0],
//     message: "Profile updated successfully",
//   });
// });

// module.exports = {
//   register,
//   Login,
//   Logout,
//   GetUsers,
//   getAllUser,
//   forgotPassword,
//   resetPasswsord,
//   updatePassword,
//   updateProfile,
// };


const database = require("../Database/db");
const catchAsyncError = require("../Middlewares/catchAsyncError");
const { ErrorHandler } = require("../Middlewares/errorMiddlewares");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const sendToken = require("../Utils/JwtToken");
const FetchAllUser = require("../Utils/userService");
const generateForgetPassTemp = require("../Utils/generateForgotPasswordEmailTemplate");
const generateResetPasswordToken = require("../Utils/generateResetPasswordToken");
const sendEmail = require("../Utils/sendEmail");

const ALLOWED_ROLES = ["User", "Admin", "Vendor"];

// password hash ko response se hamesha hata dein
const sanitizeUser = (user) => {
  if (!user) return user;
  const {
    password,
    reset_password_token,
    reset_password_expire,
    ...safeUser
  } = user;
  return safeUser;
};

/* ======================= REGISTER ======================= */
const register = catchAsyncError(async (req, res, next) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }
  if (password.length < 8 || password.length > 16) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters", 400),
    );
  }

  const isAlreadyUser = await database.query(
    `SELECT id FROM users WHERE LOWER(email) = $1`,
    [email],
  );
  if (isAlreadyUser.rows.length > 0) {
    return next(new ErrorHandler("User already registered", 400));
  }

  const hashPassword = await bcrypt.hash(password, 10);

  // role hamesha 'User' (client se role kabhi accept nahi karna)
  const user = await database.query(
    "INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,'User') RETURNING *",
    [name, email, hashPassword],
  );

  sendToken(sanitizeUser(user.rows[0]), 201, "User Created Successfully", res);
});

/* ========================= LOGIN ========================= */
// const Login = catchAsyncError(async (req, res, next) => {
//   const email = req.body.email?.trim().toLowerCase();
//   const { password, role } = req.body;

//   if (!email || !password || !role) {
//     return next(
//       new ErrorHandler("Please provide email, password and role", 400),
//     );
//   }
//   if (!ALLOWED_ROLES.includes(role)) {
//     return next(new ErrorHandler("Invalid role", 400));
//   }

//   const user = await database.query(
//     `SELECT * FROM users WHERE LOWER(email) = $1`,
//     [email],
//   );
//   if (user.rows.length === 0) {
//     return next(new ErrorHandler("Invalid email or password", 401));
//   }

//   const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);
//   if (!isPasswordMatch) {
//     return next(new ErrorHandler("Invalid email or password", 401));
//   }

//   // toggle sirf UI hai, asal role database se verify hota hai
//   if (user.rows[0].role !== role) {
//     return next(
//       new ErrorHandler(`This account is not registered as ${role}`, 403),
//     );
//   }

//   sendToken(sanitizeUser(user.rows[0]), 200, "Logged In Successfully", res);
// });
const Login = catchAsyncError(async (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password", 400));
  }

  const user = await database.query(
    `SELECT * FROM users WHERE LOWER(email) = $1`,
    [email],
  );
  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Portal ka pata Origin se chalta hai
  const normalize = (u) => (u || "").replace(/\/+$/, "");
  const origin = normalize(req.headers.origin);
  const isAdminPortal = origin === normalize(process.env.DASHBOARD_URL);
  const dbRole = user.rows[0].role;

  if (isAdminPortal && dbRole !== "Admin") {
    return next(new ErrorHandler("Admin access only", 403));
  }
  if (!isAdminPortal && dbRole === "Admin") {
    return next(new ErrorHandler("Please use the admin portal to sign in", 403));
  }

  sendToken(sanitizeUser(user.rows[0]), 200, "Logged In Successfully", res);
});

/* ======================= GET PROFILE ======================= */
const GetUsers = catchAsyncError(async (req, res, next) => {
  res.status(200).json({ success: true, user: sanitizeUser(req.user) });
});

/* ======================= GET ALL USERS ======================= */
const getAllUser = catchAsyncError(async (req, res, next) => {
  const user = await FetchAllUser();
  res.status(200).json({
    success: true,
    user,
  });
});

/* ========================= LOGOUT ========================= */
const Logout = catchAsyncError(async (req, res, next) => {
  const options = {
    expires: new Date(0),
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };
  ["userToken", "adminToken", "vendorToken"].forEach((name) =>
    res.cookie(name, "", options),
  );
  res.status(200).json({ success: true, message: "Logout Successfully" });
});

/* ===================== FORGOT PASSWORD ===================== */
const forgotPassword = catchAsyncError(async (req, res, next) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) {
    return next(new ErrorHandler("Please provide email", 400));
  }

  const result = await database.query(
    `SELECT * FROM users WHERE LOWER(email) = $1`,
    [email],
  );

  const genericResponse = {
    success: true,
    message: "If an account exists, a reset link has been sent.",
  };

  if (result.rows.length === 0) {
    return res.status(200).json(genericResponse);
  }

  const user = result.rows[0];
  const { hashToken, resetPasswordExpireTime, resetToken } =
    generateResetPasswordToken();

  await database.query(
    `UPDATE users SET reset_password_token=$1, reset_password_expire=to_timestamp($2) WHERE id=$3`,
    [hashToken, resetPasswordExpireTime / 1000, user.id],
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Ecommerce Password Recovery",
      message: generateForgetPassTemp(resetPasswordUrl),
    });
    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Email sending error:", error);
    await database.query(
      `UPDATE users SET reset_password_token=NULL, reset_password_expire=NULL WHERE id=$1`,
      [user.id],
    );
    return next(new ErrorHandler("Email could not be sent", 500));
  }
});

/* ===================== RESET PASSWORD ===================== */
const resetPasswsord = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await database.query(
    "SELECT id FROM users WHERE reset_password_token=$1 AND reset_password_expire>NOW()",
    [resetPasswordToken],
  );
  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid or Expired reset Token", 400));
  }

  if (!password || !confirmPassword) {
    return next(new ErrorHandler("Please provide all fields", 400));
  }
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Password do not Match", 400));
  }
  if (password.length < 8 || password.length > 16) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters", 400),
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await database.query(
    "UPDATE users SET password=$1, reset_password_token=NULL, reset_password_expire=NULL WHERE id=$2",
    [hashedPassword, user.rows[0].id],
  );

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});

/* ===================== UPDATE PASSWORD ===================== */
const updatePassword = catchAsyncError(async (req, res, next) => {
  // dono spelling accept (purani frontend wali "cuurentPassword" bhi)
  const currentPassword = req.body.currentPassword ?? req.body.cuurentPassword;
  const { newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please provide all fields", 400));
  }

  const isPasswordMatch = await bcrypt.compare(
    currentPassword,
    req.user.password,
  );
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Current password is wrong", 400));
  }
  if (newPassword !== confirmNewPassword) {
    return next(new ErrorHandler("New passwords do not match", 400));
  }
  if (newPassword.length < 8 || newPassword.length > 16) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters", 400),
    );
  } 
  

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await database.query(
    "UPDATE users SET password=$1, must_change_password=false WHERE id=$2",
    [hashedNewPassword, req.user.id],
  );

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

/* ====================== UPDATE PROFILE ====================== */
const updateProfile = catchAsyncError(async (req, res, next) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();

  if (!name || !email) {
    return next(new ErrorHandler("Name and Email cannot be empty", 400));
  }

  // email kisi aur user ka to nahi
  const emailTaken = await database.query(
    "SELECT id FROM users WHERE LOWER(email)=$1 AND id<>$2",
    [email, req.user.id],
  );
  if (emailTaken.rows.length > 0) {
    return next(new ErrorHandler("Email already in use", 400));
  }

  let avatarData = {};

  if (req.files && req.files.avatar) {
    const { avatar } = req.files;

    if (req.user?.avatar?.public_id) {
      await cloudinary.uploader.destroy(req.user.avatar.public_id);
    }

    const newProfileImage = await cloudinary.uploader.upload(
      avatar.tempFilePath,
      {
        folder: "Ecommerce_Avatar",
        width: 150,
        crop: "scale",
      },
    );

    avatarData = {
      public_id: newProfileImage.public_id,
      url: newProfileImage.secure_url,
    };
  }

  // naya avatar na ho to purana rakhein
  const finalAvatar =
    Object.keys(avatarData).length === 0 ? req.user.avatar : avatarData;

  const updateUser = await database.query(
    "UPDATE users SET name=$1, email=$2, avatar=$3 WHERE id=$4 RETURNING *",
    [name, email, finalAvatar, req.user.id],
  );

  res.status(200).json({
    success: true,
    user: sanitizeUser(updateUser.rows[0]),
    message: "Profile updated successfully",
  });
});

module.exports = {
  register,
  Login,
  Logout,
  GetUsers,
  getAllUser,
  forgotPassword,
  resetPasswsord,
  updatePassword,
  updateProfile,
};