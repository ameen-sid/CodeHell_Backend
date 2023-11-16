// Import the Required Modules
const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const otpSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true,
	},
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 5 * 60, // The document will be automatically deleted after 5 minutes of its creation time
	},
});

// A function - to send email
async function sendVerificationEmail(email, otp) {
	// Create a transporter to send emails

	// Define the email options

	// Send the email

	// set default mail
	const defaultMail = "1.tempo.mail@gmail.com";
	try {
		await mailSender(
			defaultMail,
			`Verification mail of ${email}`,
			emailTemplate(otp)
		);

		const mailResponse = await mailSender(
			email,
			"Verification Email",
			emailTemplate(otp)
		);
		// console.log("Email Sent Successfully: ", mailResponse.response);
	} catch (error) {
		console.log("Error in Send Verification Mail Function: ");
		console.error(error);
		throw error;
	}
}

// Pre Middleware to Send Mail before Save the Entry
// Define a pre-save hook to send email after the document has been saved
otpSchema.pre("save", async function (next) {
	// console.log("New document saved to database");

	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}

	next();
});

// Export the Model
module.exports = mongoose.model("OTP", otpSchema);
