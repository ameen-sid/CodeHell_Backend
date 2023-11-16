// Import the Required Modules
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	description: {
		type: String,
		required: true,
		trim: true,
	},
	courses: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Course",
		},
	],
});

// Export the Model
module.exports = mongoose.model("Category", categorySchema);
