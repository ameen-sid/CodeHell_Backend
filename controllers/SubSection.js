// Import the Required Modules
const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
require("dotenv").config();
const { uploadMediaToCloudinary } = require("../utils/imageUploader");
const { getVideoDurationInSeconds } = require("get-video-duration");

// Create Sub Section
exports.createSubSection = async (req, res) => {
	try {
		// fetch data from request's body
		const { sectionId, title, description } = req.body;

		// fetch video from request's files
		const video = req.files.video;

		// validation
		if (!sectionId || !title || !description || !video) {
			return res.status(400).json({
				success: false,
				message: "All fields are required!",
			});
		}

		// upload video to cloudinary
		const uploadDetails = await uploadMediaToCloudinary(
			video,
			process.env.FOLDER_NAME
		);

		let timeDuration = await getVideoDurationInSeconds(
			uploadDetails.secure_url
		).then((duration) => {
			return duration;
		});
		// console.log(parseInt(timeDuration));

		// create sub section
		const subSectionDetails = await SubSection.create({
			title: title,
			timeDuration: parseInt(timeDuration),
			description: description,
			videoUrl: uploadDetails.secure_url,
		});

		// update section
		const updatedSection = await Section.findByIdAndUpdate(
			{ _id: sectionId },
			{ $push: { subSection: subSectionDetails._id } },
			{ new: true }
		)
			.populate("subSection")
			.exec();

		// return a response
		return res.status(200).json({
			success: true,
			data: updatedSection,
			message: "Sub Section Created Successfully",
		});
	} catch (error) {
		console.log("Error in Creating Sub Section: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Update Sub Section
exports.updateSubSection = async (req, res) => {
	try {
		// fetch data from request's body
		const {
			sectionId,
			subSectionId,
			title = "",
			description = "",
		} = req.body;
		// const video = req.files.video;

		// find sub section
		const subSection = await SubSection.findById(subSectionId);

		// validation
		if (!subSection) {
			return res.status(404).json({
				success: false,
				message: "SubSection not found",
			});
		}

		if (title !== undefined) {
			subSection.title = title;
		}

		if (description !== undefined) {
			subSection.description = description;
		}

		if (req.files && req.files.video !== undefined) {
			const video = req.files.video;
			const uploadDetails = await uploadMediaToCloudinary(
				video,
				process.env.FOLDER_NAME
			);

			subSection.videoUrl = uploadDetails.secure_url;
			subSection.timeDuration = `${uploadDetails.duration}`;
		}

		await subSection.save();

		// find updated section and return it
		const updatedSection = await Section.findById(sectionId)
			.populate("subSection")
			.exec();

		// return a response
		return res.status(200).json({
			success: true,
			data: updatedSection,
			message: "Sub Section Updated Successfully",
		});
	} catch (error) {
		console.log("Error in Updating Sub Section: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Delete Sub Section
exports.deleteSubSection = async (req, res) => {
	try {
		// get ids
		const { sectionId, subSectionId } = req.body;

		// delete sub section from section
		const updatedSection = await Section.findByIdAndUpdate(
			{ _id: sectionId },
			{ $pull: { subSection: subSectionId } },
			{ new: true }
		)
			.populate("subSection")
			.exec();

		const subSection = await SubSection.findByIdAndDelete(subSectionId);

		// return a response
		return res.status(200).json({
			success: true,
			message: "Sub Section Deleted Successfully",
			data: updatedSection,
		});
	} catch (error) {
		console.log("Error in Deleting Sub Section: ", error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while deleting the SubSection",
		});
	}
};
