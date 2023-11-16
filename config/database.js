// Import the Required Modules
const mongoose = require("mongoose"); //! Mongoose is being required
require("dotenv").config();

// Function to Connect to the Database
exports.connect = () => {
	//! ######		Connecting to the Database to Store Data 	   ######
	mongoose
		.connect(process.env.MONGODB_URL, {
			// useNewUrlParser: true,
			// useUnifiedTopology: true,
		})
		.then(() => {
			console.log("Database Connected Successfully");
		})
		.catch((error) => {
			console.log("Error in Connecting to Database!");
			console.error(error);
			process.exit(1);
		});
};
