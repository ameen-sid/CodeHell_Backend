// Import the Required Modules
const jwt = require("jsonwebtoken");
// Configuring dotenv to load environment variables from .env file
require("dotenv").config();

// Auth Middleware
// This function is used as middleware to authenticate user requests
exports.auth = async (req, res, next) => {
	try {
		// Extracting JWT from request cookies, body or header
		const token =
			req.cookies.token ||
			req.body.token ||
			req.header("Authorization").replace("Bearer ", "");

		// If JWT is missing, return 401 Unauthorized response
		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Token Missing",
			});
		}

		// verify the token
		try {
			// Verifying the JWT using the secret key stored in environment variables
			const decode = await jwt.verify(
				token.replaceAll('"', ""),
				process.env.JWT_SECRET
			);

			// Storing the decoded JWT payload in the request object for further use
			req.user = decode;
		} catch (error) {
			// If JWT verification fails, return 401 Unauthorized response
			return res.status(401).json({
				success: false,
				message: "token is invalid",
				token: token.replaceAll('"', ""),
			});
		}

		// If JWT is valid, move on to the next middleware or request handler
		next();
	} catch (error) {
		// If there is an error during the authentication process, return 401 Unauthorized response
		console.log("Error in Authorisation Middleware: ", error);
		return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
	}
};

// isStudent Middleware
exports.isStudent = async (req, res, next) => {
	try {
		// check login user is student or not
		if (req.user.accountType !== "Student") {
			return res.status(401).json({
				success: false,
				message: "This is Protected Route for Students!",
			});
		}

		// call the next middleware
		next();
	} catch (error) {
		console.log("Error in isStudent Middleware: ", error);
		return res.status(500).json({
			success: false,
			message: `User Role Can't be Verified`,
		});
	}
};

// isInstructor Middleware
exports.isInstructor = async (req, res, next) => {
	try {
		// check login user is instructor or not
		if (req.user.accountType !== "Instructor") {
			return res.status(401).json({
				success: false,
				message: "This is Protected Route for Instructor",
			});
		}

		// call the next middleware
		next();
	} catch (error) {
		console.log("Error in isInstructor Middleware: ", error);
		return res.status(401).json({
			success: false,
			message: `User Role Can't be Verified`,
		});
	}
};

// isAdmin Middleware
exports.isAdmin = async (req, res, next) => {
	try {
		// check login user is admin or not
		if (req.user.accountType !== "Admin") {
			return res.status(401).json({
				success: false,
				message: "This is Protected Route for Admin only",
			});
		}

		// call the next middleware
		next();
	} catch (error) {
		console.log("Error in isAdmin Middleware: ", error);
		return res.status(401).json({
			success: false,
			message: `User Role Can't be Verified`,
		});
	}
};
