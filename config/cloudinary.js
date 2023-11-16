// Import the Required Modules
const cloudinary = require("cloudinary").v2; //! Cloudinary is being required
require("dotenv").config();

// Function to Connect to the Cloudinary
exports.cloudinaryConnect = () => {
	try {
		cloudinary.config({
			//! ######		Configuring the Cloudinary to Upload Media 	   ######
			cloud_name: process.env.CLOUD_NAME,
			api_key: process.env.API_KEY,
			api_secret: process.env.API_SECRET,
		});

		console.log("Connected to Cloudinary Successfully");
	} catch (error) {
		console.log("Error in Connecting to Cloudinary: ");
		console.error(error);
	}
};
