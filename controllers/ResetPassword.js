// Import the Required Modules
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Reset Password Token
exports.resetPasswordToken = async (req, res) => {
	try {
		// get email from request's body
		const email = req.body.email;

		// check user for this email, email validation
		const user = await User.findOne({ email: email });

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Your Email is not Registered with us.",
			});
		}

		// generate token
		const token = crypto.randomUUID().replace(/-/g, "");

		// update user by adding token and expiration time
		const updatedDetails = await User.findOneAndUpdate(
			{ email: email },
			{ token: token, resetPasswordExpires: Date.now() + 5 * 60 * 1000 },
			{ new: true }
		);

		// create url
		const url = `http://localhost:3000/update-password/${token}`;

		// send mail to the user
		await mailSender(
			email,
			"Password Reset Link",
			`Password Reset Link: ${url}`
		);

		// return a response
		return res.status(200).json({
			success: true,
			message: "Email Sent Successfully",
			url: url,
		});
	} catch (error) {
		console.log("Error in Reset Password Token: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
	try {
		// fetch data from request's body
		const { password, confirmPassword, token } = req.body;

		// validation
		if (!password || !confirmPassword) {
			return res.status(401).json({
				success: false,
				message: "Please fill all the fields!",
			});
		}

		// matching password
		if (password !== confirmPassword) {
			return res.status(401).json({
				success: false,
				message: "Password Not Matching",
			});
		}

		// get user details from database using token
		const userDetails = await User.findOne({ token: token });

		// if no entry - invalid token
		if (!userDetails) {
			return res.status(402).json({
				success: false,
				message: "Invalid Token!",
			});
		}

		// token time check
		if (userDetails.resetPasswordExpires < Date.now()) {
			return res.status(402).json({
				success: false,
				message: "Token is Expired, Please Regenerate your Token",
			});
		}

		// hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// update password
		const updatedUser = await User.findOneAndUpdate(
			{ token: token },
			{ password: hashedPassword },
			{ new: true }
		);

		// return a response
		return res.status(200).json({
			success: true,
			message: "Password Reset Successfully",
		});
	} catch (error) {
		console.log("Error in Reset Password: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
