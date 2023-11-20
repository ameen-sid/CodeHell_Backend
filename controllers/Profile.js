// Import the Required Modules
const Profile = require("../models/Profile");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const { uploadMediaToCloudinary } = require("../utils/imageUploader");
const mongoose = require("mongoose");
const { convertSecondsToDuration } = require("../utils/secToDuration");

// Update Profile
exports.updateProfile = async (req, res) => {
	try {
		// get data from request's body
		const {
			dateOfBirth = "",
			about = "",
			contactNumber = "",
			gender,
		} = req.body;

		// get user id
		const id = req.user.id;

		// validation
		if (!gender || !id) {
			return res.status(400).json({
				success: false,
				message: "All Fields are Required!",
			});
		}

		// find profile
		let userDetails = await User.findById({ _id: id });
		const profileId = userDetails.additionalDetails;
		const profileDetailds = await Profile.findById({ _id: profileId });

		// update profile's data
		profileDetailds.dateOfBirth = dateOfBirth;
		profileDetailds.about = about;
		profileDetailds.contactNumber = contactNumber;
		profileDetailds.gender = gender;

		// save the entry in database
		await profileDetailds.save();

		// get updated user
		userDetails = await User.find({ _id: id })
			.populate("additionalDetails")
			.exec();

		// return a response
		return res.status(200).json({
			success: true,
			data: userDetails,
			message: "Profile Updated Successfully",
		});
	} catch (error) {
		console.log("Error while Updating Profile: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// TODO: schedule the deletion of account
// Delete Account
exports.deleteAccount = async (req, res) => {
	try {
		// get id
		const id = req.user.id;

		// get user details
		const userDetails = await User.findById({ _id: id });

		// validation
		if (!userDetails) {
			return res.status(404).json({
				success: false,
				message: "User Not Found!",
			});
		}

		// delete profile
		await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });

		// delete user
		await User.findByIdAndDelete({ _id: id });

		// return a response
		return res.status(200).json({
			success: true,
			message: "User Deleted Successfully",
		});
	} catch (error) {
		console.log("Error while Deleting Account: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get All User Details
exports.getAllUserDetails = async (req, res) => {
	try {
		// get id
		const id = req.user.id;

		// get user details
		const userDetails = await User.findById({ _id: id })
			.populate("additionalDetails")
			.exec();

		// return a response
		return res.status(200).json({
			success: true,
			data: userDetails,
			message: "User Detailds Fetched Successfully",
		});
	} catch (error) {
		console.log("Error while Get All Details of User: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Update Display Picture
exports.updateDisplayPicture = async (req, res) => {
	try {
		const displayPicture = req.files.displayPicture;
		const userId = req.user.id;

		const image = await uploadMediaToCloudinary(
			displayPicture,
			process.env.FOLDER_NAME,
			1000,
			1000
		);
		// console.log(image);

		const updatedProfile = await User.findByIdAndUpdate(
			{ _id: userId },
			{ image: image.secure_url },
			{ new: true }
		);

		return res.send({
			success: true,
			message: `Image Updated successfully`,
			data: updatedProfile,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get Enrolled Courses
exports.getEnrolledCourses = async (req, res) => {
	try {
		const userId = req.user.id;

		let userDetails = await User.findOne({
			_id: userId,
		})
			.populate({
				path: "courses",
				populate: {
					path: "courseContent",
					populate: {
						path: "subSection",
					},
				},
			})
			.exec();

		userDetails = userDetails.toObject();

		var SubsectionLength = 0;
		for (var i = 0; i < userDetails.courses.length; i++) {
			let totalDurationInSeconds = 0;
			SubsectionLength = 0;
			for (
				var j = 0;
				j < userDetails.courses[i].courseContent.length;
				j++
			) {
				totalDurationInSeconds += userDetails.courses[i].courseContent[
					j
				].subSection.reduce(
					(acc, curr) => acc + parseInt(curr.timeDuration),
					0
				);
				userDetails.courses[i].totalDuration = convertSecondsToDuration(
					totalDurationInSeconds
				);
				SubsectionLength +=
					userDetails.courses[i].courseContent[j].subSection.length;
			}

			let courseProgressCount = await CourseProgress.findOne({
				courseID: userDetails.courses[i]._id,
				userId: userId,
			});

			courseProgressCount = courseProgressCount?.completedVideos.length;

			if (SubsectionLength === 0) {
				userDetails.courses[i].progressPercentage = 100;
			} else {
				// To make it up to 2 decimal point
				const multiplier = Math.pow(10, 2);
				userDetails.courses[i].progressPercentage =
					Math.round(
						(courseProgressCount / SubsectionLength) *
							100 *
							multiplier
					) / multiplier;
			}
		}

		if (!userDetails) {
			return res.status(400).json({
				success: false,
				message: `Could not find user with id: ${userDetails}`,
			});
		}

		return res.status(200).json({
			success: true,
			data: userDetails.courses,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Instructor Dashboard
exports.instructorDashboard = async (req, res) => {
	try {
		const courseDetails = await Course.find({ instructor: req.user.id });

		const courseData = courseDetails.map((course) => {
			const totalStudentsEnrolled = course.studentEnrolled.length;
			const totalAmountGenerated = totalStudentsEnrolled * course.price;

			// Create a new object with the additional fields
			const courseDataWithStats = {
				_id: course._id,
				courseName: course.courseName,
				courseDescription: course.courseDescription,
				// Include other course properties as needed
				totalStudentsEnrolled,
				totalAmountGenerated,
			};

			return courseDataWithStats;
		});

		return res.status(200).json({
			success: true,
			courses: courseData,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "Server Error",
		});
	}
};
