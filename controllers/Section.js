// Import the Required Modules
const Section = require("../models/Section");
const Course = require("../models/Course");

// Create Section
exports.createSection = async (req, res) => {
	try {
		// fetch data from request's body
		const { sectionName, courseId } = req.body;

		// validation
		if (!sectionName || !courseId) {
			return res.status(400).json({
				success: false,
				message: "All fields are required!",
			});
		}

		// create section
		const newSection = await Section.create({ sectionName });

		// update course with section id
		const updatedCourse = await Course.findByIdAndUpdate(
			{ _id: courseId },
			{ $push: { courseContent: newSection._id } },
			{ new: true }
		)
			.populate("courseContent")
			.exec();

		// return a response
		return res.status(200).json({
			success: true,
			data: updatedCourse,
			message: "Section Created Successfully",
		});
	} catch (error) {
		console.log("Error in Creating Section: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Update Section
exports.updateSection = async (req, res) => {
	try {
		// fetch data from request's body
		const { sectionName, sectionId, courseId } = req.body;

		// validation
		if (!sectionName || !sectionId) {
			return res.status(400).json({
				success: false,
				message: "Fill all the fields!",
			});
		}

		// update section
		const section = await Section.findByIdAndUpdate(
			{ _id: sectionId },
			{ sectionName },
			{ new: true }
		);

		const course = await Course.findById(courseId)
			.populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

		// return a response
		return res.status(200).json({
			success: true,
			message: "Section Updated Successfully",
			data: course,
		});
	} catch (error) {
		console.log("Error in Updating Section: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Delete Section
exports.deleteSection = async (req, res) => {
	try {
		// get section id - assuming that we are sending id in params
		// const { sectionId } = req.params;
		const { courseId, sectionId } = req.body;

		// use findByIdAndDelete
		await Section.findByIdAndDelete({ _id: sectionId });
		const updatedCourse = await Course.findByIdAndUpdate(
			{ _id: courseId },
			{ $pull: { courseContent: sectionId } },
			{ new: true }
		);

		// return a response
		return res.status(200).json({
			success: true,
			data: updatedCourse,
			message: "Section Deleted Successfully",
		});
	} catch (error) {
		console.log("Error in Delete Section: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
