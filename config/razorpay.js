// Import the Required Modules
const Razorpay = require("razorpay"); //! Razorpay is being required
require("dotenv").config();

exports.instance = new Razorpay({
	key_id: process.env.RAZORPAY_KEY,
	key_secret: process.env.RAZORPAY_SECRET,
});
