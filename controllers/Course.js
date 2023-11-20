// Import the Required Modules
const Course = require("../models/Course");
const Category = require("../models/Category");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const User = require("../models/User");
const { uploadMediaToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress");
const { convertSecondsToDuration } = require("../utils/secToDuration");
require("dotenv").config();

// Create Course
exports.createCourse = async (req, res) => {
	try {
		// fetch data form request's body
		const {
			courseName,
			courseDescription,
			whatYouWillLearn,
			price,
			category,
			tag,
		} = req.body;

		// fetch thubnail from request's files
		const thumbnail = req.files.thumbnailImage;

		// validation
		if (
			!courseName ||
			!courseDescription ||
			!whatYouWillLearn ||
			!price ||
			!category ||
			!thumbnail
		) {
			return res.status(400).json({
				success: false,
				message: "All the fields are required!",
			});
		}

		// check for instructor
		const userId = req.user.id;
		const instructorDetails = await User.findById({ _id: userId });

		if (!instructorDetails) {
			return res.status(400).json({
				success: false,
				message: "Instructor Details Not Found!",
			});
		}

		// check given category is valid or not
		const categoryDetails = await Category.findById({ _id: category });

		if (!categoryDetails) {
			return res.status(400).json({
				success: false,
				message: "Category Details Not Found!",
			});
		}

		// upload image to cloudinary
		const thumbnailImage = await uploadMediaToCloudinary(
			thumbnail,
			process.env.FOLDER_NAME
		);

		// create an entry for new course
		const newCourse = await Course.create({
			courseName,
			courseDescription,
			instructor: instructorDetails._id,
			whatYouWillLearn,
			price,
			category: categoryDetails._id,
			thumbnail: thumbnailImage.secure_url,
			tag: tag,
		});

		// add the new course to the user schema of instructor
		await User.findByIdAndUpdate(
			{ _id: instructorDetails._id },
			{ $push: { courses: newCourse._id } },
			{ new: true }
		);

		// update the category schema
		await Category.findByIdAndUpdate(
			{ _id: category },
			{ $push: { courses: newCourse._id } },
			{ new: true }
		);

		// return a response
		return res.status(200).json({
			success: true,
			data: newCourse,
			message: "New Course Created Successfully",
		});
	} catch (error) {
		console.log("Error in Creating Course: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Edit Course
exports.editCourse = async (req, res) => {
	try {
		const { courseId } = req.body;
		const updates = req.body;

		const course = await Course.findById(courseId);

		if (!course) {
			return res.status(404).json({ error: "Course not found" });
		}

		// If Thumbnail Image is found, update it
		if (req.files) {
			console.log("thumbnail update");
			const thumbnail = req.files.thumbnailImage;
			const thumbnailImage = await uploadMediaToCloudinary(
				thumbnail,
				process.env.FOLDER_NAME
			);
			course.thumbnail = thumbnailImage.secure_url;
		}

		// Update only the fields that are present in the request body
		for (const key in updates) {
			if (updates.hasOwnProperty(key)) {
				if (key === "tag" || key === "instructions") {
					course[key] = JSON.parse(updates[key]);
				} else {
					course[key] = updates[key];
				}
			}
		}

		await course.save();

		const updatedCourse = await Course.findOne({
			_id: courseId,
		})
			.populate({
				path: "instructor",
				populate: {
					path: "additionalDetails",
				},
			})
			.populate("category")
			.populate("ratingAndReviews")
			.populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

		return res.json({
			success: true,
			message: "Course updated successfully",
			data: updatedCourse,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};

// Show All Courses
exports.getAllCourses = async (req, res) => {
	try {
		// fetch all courses from database
		const allCourses = await Course.find({}).populate({
			path: "courseContent",
			populate: "subSection",
		});

		// return a response
		return res.status(200).json({
			success: true,
			data: allCourses,
			message: "All Courses Fetched Successfully",
		});
	} catch (error) {
		console.log("Error in Showing All Courses: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get Course Details
exports.getCourseDetails = async (req, res) => {
	try {
		// get course id from request's body
		const { courseId } = req.body;

		// find course details
		const courseDetails = await Course.find({ _id: courseId })
			.populate({
				path: "instructor",
				populate: {
					path: "additionalDetails",
				},
			})
			.populate("category")
			.populate("ratingAndReviews")
			.populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

		// validation
		if (!courseDetails) {
			return res.status(400).json({
				success: false,
				message: `Couldn't Find the Course with ${courseId}`,
			});
		}

		// return a response
		return res.status(200).json({
			success: true,
			data: courseDetails,
			message: "Course Details Fetched Successfully",
		});
	} catch (error) {
		console.log("Error while Getting Course Details: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get Full Course Details
exports.getFullCourseDetails = async (req, res) => {
	try {
		const { courseId } = req.body;
		const userId = req.user.id;

		const courseDetails = await Course.findOne({
			_id: courseId,
		})
			.populate({
				path: "instructor",
				populate: {
					path: "additionalDetails",
				},
			})
			.populate("category")
			.populate("ratingAndReviews")
			.populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

		if (!courseDetails) {
			return res.status(400).json({
				success: false,
				message: `Could not find course with id: ${courseId}`,
			});
		}

		let courseProgressCount = await CourseProgress.findOne({
			courseID: courseId,
			userId: userId,
		});
		// console.log("courseProgressCount : ", courseProgressCount);

		// if (courseDetails.status === "Draft") {
		//   return res.status(403).json({
		//     success: false,
		//     message: `Accessing a draft course is forbidden`,
		//   });
		// }

		let totalDurationInSeconds = 0;
		courseDetails.courseContent.forEach((content) => {
			content.subSection.forEach((subSection) => {
				const timeDurationInSeconds = parseInt(subSection.timeDuration);
				totalDurationInSeconds += timeDurationInSeconds;
			});
		});
		const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

		return res.status(200).json({
			success: true,
			data: {
				courseDetails,
				totalDuration,
				completedVideos: courseProgressCount?.completedVideos
					? courseProgressCount?.completedVideos
					: [],
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get Instructor Courses
exports.getInstructorCourses = async (req, res) => {
	try {
		// Get the instructor ID from the authenticated user or request body
		const instructorId = req.user.id;

		// Find all courses belonging to the instructor
		const instructorCourses = await Course.find({
			instructor: instructorId,
		})
			.sort({ createdAt: -1 })
			.populate({
				path: "courseContent",
				model: "Section",
				populate: {
					path: "subSection",
				},
			});
		// Return the instructor's courses
		return res.status(200).json({
			success: true,
			data: instructorCourses,
			message: "Instructor Courses fetched successfully",
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Failed to retrieve instructor courses",
			error: error.message,
		});
	}
};

// Delete Course
exports.deleteCourse = async (req, res) => {
	try {
		const { courseId } = req.body;

		// Find the course
		const course = await Course.findById(courseId);

		if (!course) {
			return res
				.status(404)
				.json({ success: false, message: "Course not found" });
		}

		// Unenroll students from the course
		const studentsEnrolled = course.studentEnrolled;
		for (const studentId of studentsEnrolled) {
			await User.findByIdAndUpdate(studentId, {
				$pull: { courses: courseId },
			});
		}

		// Delete sections and sub-sections
		const courseSections = course.courseContent;
		for (const sectionId of courseSections) {
			// Delete sub-sections of the section
			const section = await Section.findById(sectionId);
			if (section) {
				const subSections = section.subSection;
				for (const subSectionId of subSections) {
					await SubSection.findByIdAndDelete(subSectionId);
				}
			}

			// Delete the section
			await Section.findByIdAndDelete(sectionId);
		}

		// Delete the course
		await Course.findByIdAndDelete(courseId);

		return res.status(200).json({
			success: true,
			message: "Course deleted successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
};
