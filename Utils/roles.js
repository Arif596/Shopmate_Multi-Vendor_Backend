const ROLES = {
  ADMIN: "Admin",
  USER: "User",
  VENDOR: "Vendor",
};

// cookie name role ke hisaab se
const COOKIE_BY_ROLE = {
  Admin: "adminToken",
  Vendor: "vendorToken",
  User: "userToken",
};

module.exports = { ROLES, COOKIE_BY_ROLE };