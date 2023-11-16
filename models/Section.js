// Import the Required Modules
const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
	sectionName: {
		type: String,
		required: true,
		trim: true,
	},
	subSection: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "SubSection",
			required: true,
		},
	],
});

// Export the Model
module.exports = mongoose.model("Section", sectionSchema);
