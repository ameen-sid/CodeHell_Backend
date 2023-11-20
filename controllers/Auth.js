// Import the Required Modules
const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
require("dotenv").config();

// Send OTP
exports.sendOTP = async (req, res) => {
	try {
		// fetch email form request's body
		const { email } = req.body;

		// check if user is already exits
		const checkUserExist = await User.findOne({ email });

		// if user already exist, then return a response
		if (checkUserExist) {
			return res.status(401).json({
				success: false,
				message: "User is already registered",
			});
		}

		// generate otp
		var otp = otpGenerator.generate(6, {
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false,
			specialChars: false,
		});
		// console.log("Generated OTP: ", otp);

		// check unique otp or not
		const result = await OTP.findOne({ otp: otp });

		while (result) {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
				lowerCaseAlphabets: false,
				specialChars: false,
			});

			result = await OTP.findOne({ otp: otp });
		}

		// create an entry in database for otp
		const otpBody = await OTP.create({ email, otp });

		// return a response
		return res.status(200).json({
			success: true,
			message: "OTP Sent Successfully",
			OTP: otp,
		});
	} catch (error) {
		console.log("Error in Sending OTP: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// SignUp
exports.signup = async (req, res) => {
	try {
		// data fetch from request's body
		const {
			accountType,
			firstName,
			lastName,
			email,
			password,
			confirmPassword,
			// contactNumber,
			otp,
		} = req.body;

		// validation
		if (
			!firstName ||
			!lastName ||
			!email ||
			!password ||
			!confirmPassword ||
			!otp
		) {
			return res.status(403).json({
				success: false,
				message: "Please fill all the fields",
			});
		}

		// match password and confirm password
		if (password !== confirmPassword) {
			return res.status(400).json({
				success: false,
				message: "Password and Confirm Password doesn't match",
			});
		}

		// check user already exist or not
		const existUser = await User.findOne({ email });

		if (existUser) {
			return res.status(400).json({
				success: false,
				message: "User is Already Registered!",
			});
		}

		// find most recent otp from the database for this user
		const recentOTP = await OTP.find({ email })
			.sort({ createdAt: -1 })
			.limit(1);

		// validate otp
		if (recentOTP.length == 0) {
			// otp not found
			return res.status(400).json({
				success: false,
				message: "OTP Not Found!",
			});
		} else if (recentOTP[0].otp !== otp) {
			// invalid otp
			return res.status(400).json({
				success: false,
				message: "Invalid OTP",
			});
		}

		// hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// create entry in database
		const profileDetails = await Profile.create({
			gender: null,
			dateOfBirth: null,
			about: null,
			// contactNumber: contactNumber,
			contactNumber: null,
		});

		const user = await User.create({
			accountType,
			firstName,
			lastName,
			email,
			password: hashedPassword,
			otp,
			additionalDetails: profileDetails._id,
			image: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName} ${lastName}`,
		});

		// return a response
		return res.status(200).json({
			success: true,
			data: user,
			message: "User Registered Successfully",
		});
	} catch (error) {
		console.log("Error in Creating a User Account: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Login
exports.login = async (req, res) => {
	try {
		// get data from request's body
		const { email, password } = req.body;

		// validation of data
		if (!email || !password) {
			return res.status(403).json({
				success: false,
				message: "All the fields are required!",
			});
		}

		// check user exist or not
		const user = await User.findOne({ email })
			.populate("additionalDetails")
			.exec();

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User is not registered, Please sign up first!",
			});
		}

		// generate JWT token, after matching the password
		if (await bcrypt.compare(password, user.password)) {
			// create payload for JWT token
			const payload = {
				email: user.email,
				id: user._id,
				accountType: user.accountType,
			};

			// generate JWT token
			const token = jwt.sign(payload, process.env.JWT_SECRET, {
				expiresIn: "2h",
			});

			// while (token == undefined) {
			// 	token = jwt.sign(payload, process.env.JWT_SECRET, {
			// 		expiresIn: "2h",
			// 	});
			// }

			user.token = token;
			user.password = undefined;

			// create a cookie
			const options = {
				expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
				httpOnly: true,
			};

			// return a response with cookie
			res.cookie("token", token, options).status(200).json({
				success: true,
				user,
				message: "Logged In Successfully.",
			});
		} else {
			return res.status(401).json({
				success: false,
				message: "Password is Incorrect",
			});
		}
	} catch (error) {
		console.log("Error in Login: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Change Password
exports.changePassword = async (req, res) => {
	try {
		// get data from request's body
		const { oldPassword, newPassword } = req.body;

		// validation
		if (!oldPassword || !newPassword) {
			return res.status(402).json({
				succes: false,
				message: "Please fill all the fields!",
			});
		}

		// condition for not matching oldPassword and newPassword
		if (oldPassword === newPassword) {
			return res.status(402).json({
				success: false,
				message: "Old Password and New Password Can't be Same.",
			});
		}

		// match newPassword and confirmNewPassword
		// if (newPassword !== confirmNewPassword) {
		// 	return res.status(402).json({
		// 		succes: false,
		// 		message: "New Password and Confirm New Password are not Same",
		// 	});
		// }

		// hash password
		let hashedPassword = await bcrypt.hash(newPassword, 10);

		// update password in database
		const user = await User.findByIdAndUpdate(
			{ _id: req.user.id },
			{ password: hashedPassword },
			{ new: true }
		);

		// send mail - password updated
		try {
			const mailResponse = await mailSender(
				user.email,
				"Updation Email from CodeHell",
				`Password Updated Successfully`
			);

			// console.log("Email Send Successfully: ", mailResponse);
		} catch (error) {
			console.log("Error in Sending Mail for Change Password: ");
			console.error(error);
		}

		// return a response
		return res.status(200).json({
			success: true,
			data: user,
			message: "Password Changed Successfully",
		});
	} catch (error) {
		console.log("Error in Changing the Password: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
