const bcrypt = require("bcrypt");
const database = require("../Database/db");

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Super Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }
  if (password.length < 9 || password.length > 16) {
    throw new Error("ADMIN_PASSWORD must be between 8 and 16 characters");
  }

  const existing = await database.query(
    "SELECT id, role, password FROM users WHERE LOWER(email) = $1",
    [email],
  );

  if (existing.rows.length > 1) {
    throw new Error("Multiple accounts found for ADMIN_EMAIL");
  }

  if (existing.rows.length === 1) {
    const admin = existing.rows[0];

    if (admin.role !== "Admin") {
      throw new Error(
        "ADMIN_EMAIL belongs to a non-admin account. " +
          "Choose a separate admin email or review the account manually.",
      );
    }

    // Password env se match karta hai? Nahi to update (local aur live same rahein)
    const isSame = await bcrypt.compare(password, admin.password);
    if (isSame) {
      console.log("Admin already exists; password already in sync");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await database.query("UPDATE users SET password=$1 WHERE id=$2", [
      hashedPassword,
      admin.id,
    ]);
    console.log("Admin password synced from env");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await database.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'Admin')
     ON CONFLICT DO NOTHING`,
    [name, email, hashedPassword],
  );

  console.log("Admin created successfully");
};

module.exports = seedAdmin;