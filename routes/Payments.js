// Import the Require Modules
const express = require("express");
const router = express.Router();

// Import the Required Controllers
const {
	capturePayment,
	verifyPayment,
	sendPaymentSuccessEmail,
} = require("../controllers/Payment");

// Import the Required Middlewares
const { auth, isStudent } = require("../middlewares/auth");

// Set the Routes
router.post("/capturePayment", auth, isStudent, capturePayment);
router.post("/verifyPayment", auth, isStudent, verifyPayment);
router.post(
	"/sendPaymentSuccessEmail",
	auth,
	isStudent,
	sendPaymentSuccessEmail
);

// Export the router for use in the main application
module.exports = router;
