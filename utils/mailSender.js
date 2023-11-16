// Import the Required Modules
const nodemailer = require("nodemailer");
require("dotenv").config();

// Mail Sender Function to Send Mail to User
const mailSender = async (email, title, body) => {
	try {
		let transporter = nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			auth: {
				user: process.env.MAIL_USER,
				pass: process.env.MAIL_PASS,
			},
		});

		let info = await transporter.sendMail({
			from: `CodeHell - By Ameen Sid`,
			to: email,
			subject: title,
			html: body,
		});

		// console.log("Info is Mail Send: ", info);

		return info;
	} catch (error) {
		console.log("Error in mailSender File: ");
		console.error(error);
	}
};

// Export the mailSender for use in the required location
module.exports = mailSender;
