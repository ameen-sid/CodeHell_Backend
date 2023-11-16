// Import the Required Modules
const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

// Create Rating
exports.createRating = async (req, res) => {
	try {
		// get user id
		const userId = req.user.id;

		// fetch data from request's body
		const { rating, review, courseId } = req.body;

		// check if user is enrolled or not
		const courseDetails = await Course.findOne({
			_id: courseId,
			studentEnrolled: {
				$elemMatch: {
					$eq: userId,
				},
			},
		});

		if (!courseDetails) {
			return res.status(404).json({
				success: false,
				message: "Student is not Enrolled in the Course",
			});
		}

		// check if user already reviewed the course
		const alreadyReviewed = await RatingAndReview.findOne({
			user: userId,
			course: courseId,
		});

		if (alreadyReviewed) {
			return res.status(403).json({
				success: false,
				message: "Course is Already Reviewed by the User",
			});
		}

		// create rating and review
		const ratingReview = await RatingAndReview.create({
			rating,
			review,
			course: courseId,
			user: userId,
		});

		// update course with this rating/review
		const updatedCourseDetails = await Course.findByIdAndUpdate(
			{ _id: courseId },
			{
				$push: {
					ratingAndReviews: ratingReview._id,
				},
			},
			{ new: true }
		);
		// console.log(updatedCourseDetails);

		// return a response
		return res.status(200).json({
			success: true,
			data: ratingReview,
			message: "Rating and Review Created Successfully",
		});
	} catch (error) {
		console.log("Error While Creating Rating and Review: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get Average Rating
exports.getAverageRating = async (req, res) => {
	try {
		// get course id from request's body
		const courseId = req.body.courseId;

		const result = await RatingAndReview.aggregate([
			{
				$match: {
					course: new mongoose.Types.ObjectId(courseId),
				},
			},
			{
				$group: {
					_id: null,
					averageRating: { $avg: "$rating" },
				},
			},
		]);

		if (result.length > 0) {
			return res.status(200).json({
				success: true,
				averageRating: result[0].averageRating,
				message: "Average Rating Fetched Successfully",
			});
		}

		// if no rating and review exist
		return res.status(200).json({
			success: true,
			message: "Average Rating is 0, no ratings given till now",
			averageRating: 0,
		});
	} catch (error) {
		console.log("Error While Getting Average Rating: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get All Ratings
exports.getAllRating = async (req, res) => {
	try {
		// fetch all ratings from the database
		const allReviews = await RatingAndReview.find({})
			.sort({ rating: "desc" })
			.populate({
				path: "user",
				select: "firstName lastName email image",
			})
			.populate({ path: "course", select: "courseName" })
			.exec();

		// return a response
		return res.status(200).json({
			success: true,
			data: allReviews,
			message: "All Reviews Fetched Successfully",
		});
	} catch (error) {
		console.log("Error While Getting All Ratings: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
