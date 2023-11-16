const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");

exports.contactUsController = async (req, res) => {
	const { email, firstname, lastname, message, phoneno, countrycode } =
		req.body;

	try {
		const emailResponse = await mailSender(
			email,
			"Your Data send Successfully",
			contactUsEmail(
				email,
				firstname,
				lastname,
				message,
				phoneno,
				countrycode
			)
		);

		console.log("Mail Response: ", emailResponse);

		return res.status(200).json({
			success: true,
			message: "Email send Successfully",
		});
	} catch (error) {
		console.log("Error Message: ", error);
		return res.json({
			success: false,
			message: "Something went wrong...",
		});
	}
};
