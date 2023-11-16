// Import the Required Modules
const express = require("express");
const router = express.Router();

// Import the Required Controllers
const {
	login,
	signup,
	sendOTP,
	changePassword,
} = require("../controllers/Auth");

const {
	resetPasswordToken,
	resetPassword,
} = require("../controllers/ResetPassword");

// Import the Required Middlewares
const { auth } = require("../middlewares/auth");

// Routes for Login, SignUp and Authentication

// *******************************************************************************
// 							Authentication Routes
// *******************************************************************************

// Route for user login
router.post("/login", login);

// Route for user signup
router.post("/signup", signup);

// Route for sending OTP to the user's email
router.post("/sendotp", sendOTP);

// Route for Changing the password
router.post("/changepassword", auth, changePassword);

// *******************************************************************************
// 								Reset Password
// *******************************************************************************

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken);

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword);

// Export the router for use in the main application
module.exports = router;
