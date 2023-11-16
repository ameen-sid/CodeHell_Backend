// Import the Required Modules
const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
	gender: {
		type: String,
		// enum: ["Male", "Female"],
	},
	dateOfBirth: {
		type: String,
		trim: true,
	},
	about: {
		type: String,
		trim: true,
	},
	contactNumber: {
		type: Number,
		trim: true,
	},
});

// Export the Model
module.exports = mongoose.model("Profile", profileSchema);
