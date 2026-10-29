const express = require("express");
const router = express.Router();
const { isAuthenticated, authorizedRoles } = require("../Middlewares/authMiddleware");
const c = require("../Controller/vendorRequestController");

router.post("/", isAuthenticated, c.createVendorRequest);
router.get("/", isAuthenticated, authorizedRoles("Admin"), c.getVendorRequests);
router.patch("/:id/approve", isAuthenticated, authorizedRoles("Admin"), c.approveVendorRequest);
router.patch("/:id/reject", isAuthenticated, authorizedRoles("Admin"), c.rejectVendorRequest);

module.exports = router;