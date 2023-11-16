// Import the Required Modules
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const mongoose = require("mongoose");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");
const courseEnrollmentEmail = require("../mail/templates/courseEnrollmentEmail");
const paymentSuccessEmail = require("../mail/templates/paymentSuccessEmail");

// Enroll the Student in the Course
const enrollStudents = async (courses, userId, res) => {
	if (!courses || !userId) {
		return res.status(400).json({
			success: false,
			message: "Please Provide Course ID and User ID",
		});
	}

	for (const courseId of courses) {
		try {
			// Find the course and enroll the student in it
			const enrolledCourse = await Course.findOneAndUpdate(
				{ _id: courseId },
				{ $push: { studentEnrolled: userId } },
				{ new: true }
			);

			if (!enrolledCourse) {
				return res
					.status(500)
					.json({ success: false, error: "Course not found" });
			}
			console.log("Updated course: ", enrolledCourse);

			const courseProgress = await CourseProgress.create({
				courseID: courseId,
				userId: userId,
				completedVideos: [],
			});

			// Find the student and add the course to their list of enrolled courses
			const enrolledStudent = await User.findByIdAndUpdate(
				userId,
				{
					$push: {
						courses: courseId,
						courseProgress: courseProgress._id,
					},
				},
				{ new: true }
			);
			console.log("Enrolled student: ", enrolledStudent);

			// Send an email notification to the enrolled student
			const emailResponse = await mailSender(
				enrolledStudent.email,
				`Successfully Enrolled into ${enrolledCourse.courseName}`,
				courseEnrollmentEmail(
					enrolledCourse.courseName,
					`${enrolledStudent.firstName} ${enrolledStudent.lastName}`
				)
			);
			console.log("Email sent successfully: ", emailResponse.response);
		} catch (error) {
			console.log(error);
			return res
				.status(400)
				.json({ success: false, error: error.message });
		}
	}
};

// Capture the Payment and Initiate the Razorpay Order
// exports.capturePayment = async (req, res) => {
// 	// get user id and course id
// 	const { courseId } = req.body;
// 	const userId = req.user.id;

// 	// validation
// 	if (!courseId) {
// 		return res.status(404).json({
// 			success: false,
// 			message: "Please Provide Valid Course ID!",
// 		});
// 	}

// 	let course;
// 	try {
// 		course = await Course.findById({ _id: courseId });

// 		if (!course) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "Couldn't Find the Course!",
// 			});
// 		}

// 		// check user already pay for same course
// 		// convert user id into mongoose's object id
// 		const uid = new mongoose.Types.ObjectId(userId);

// 		if (course.studentEnrolled.includes(uid)) {
// 			return res.status(200).json({
// 				success: false,
// 				message: "Student is Already Enrolled!",
// 			});
// 		}
// 	} catch (error) {
// 		console.log("Error in Capturing the Payment: ", error);
// 		return res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}

// 	// create a order
// 	const amount = course.price;
// 	const currency = "INR";

// 	const options = {
// 		amount: amount * 100,
// 		currency,
// 		receipt: Math.random(Date.now()).toString(),
// 		notes: {
// 			courseId: courseId,
// 			userId: userId,
// 		},
// 	};

// 	try {
// 		// initiate the payment using razorpay
// 		const paymentResponse = await instance.orders.create(options);
// 		// console.log(paymentResponse);

// 		// return a response
// 		return res.status(200).json({
// 			success: true,
// 			courseName: course.courseName,
// 			courseDescription: course.courseDescription,
// 			thumbnail: course.thumbnail,
// 			orderId: paymentResponse.id,
// 			currency: paymentResponse.currency,
// 			amount: paymentResponse.amount,
// 		});
// 	} catch (error) {
// 		console.log("Error in Initiating Payment: ", error);
// 		return res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };
exports.capturePayment = async (req, res) => {
	const { courses } = req.body;
	const userId = req.user.id;

	if (courses.length === 0) {
		return res.status(404).json({
			success: false,
			message: "Courses not found for buy",
		});
	}

	let totalAmount = 0;

	for (const course_id of courses) {
		let course;

		try {
			// Find the course by it's id
			course = await Course.findById(course_id);

			// if the course is not found, then return an error
			if (!course) {
				return res.status(404).json({
					success: false,
					message: "Could not found the course",
				});
			}

			// check if the user is already enrolled in the course
			const uid = new mongoose.Types.ObjectId(userId);
			if (course.studentEnrolled.includes(uid)) {
				return res.status(202).json({
					success: false,
					message: "Student is already enrolled in the course",
				});
			}

			// add the price of the course to the total amount
			totalAmount += course.price;
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				success: false,
				message: error.message,
			});
		}
	}

	const options = {
		amount: totalAmount * 100,
		currency: "INR",
		receipt: Math.random(Date.now()).toString(),
	};

	try {
		// Initiate the payment using Razorpay
		const paymentResponse = await instance.orders.create(options);
		console.log(paymentResponse);

		return res.json({
			success: true,
			data: paymentResponse,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: "Could not initiate order.",
		});
	}
};

// Verify Signature of Razorpay and Server
// exports.verifyPayment = async (req, res) => {
// 	// fetch webhook from database
// 	const webhookSecret = "12345678";

// 	// fetch signature from request's header of razorpay
// 	const signature = req.header["x-razorpay-signature"];

// 	// hash the webhook
// 	const shasum = crypto.createHmac("sha256", webhookSecret);
// 	shasum.update(JSON.stringify(req.body));
// 	const digest = shasum.digest("hex");

// 	// check signature and webhook match or not
// 	if (signature === digest) {
// 		console.log("Payment is Authorized");

// 		// fetch course id and user id from razorpay
// 		const { courseId, userId } = req.body.payload.payment.entity.notes;

// 		try {
// 			// fulfill the action

// 			// find the course and enroll the student in it
// 			const enrolledCourse = await Course.findOneAndUpdate(
// 				{ _id: courseId },
// 				{ $push: { studentEnrolled: userId } },
// 				{ new: true }
// 			);

// 			if (!enrolledCourse) {
// 				return res.status(400).json({
// 					success: false,
// 					message: "Course Not Found!",
// 				});
// 			}
// 			// console.log(enrolledCourse);

// 			// find the student and add the course to their list of enroll courses
// 			const enrollStudent = await User.findOneAndUpdate(
// 				{ _id: userId },
// 				{ $push: { courses: courseId } },
// 				{ new: true }
// 			);
// 			// console.log(enrollStudent);

// 			// send mail to student
// 			const mailResponse = await mailSender(
// 				enrollStudent.email,
// 				"Congratulation from Study Notion",
// 				"Congratulation, you are onboarded into new Study Notion Course"
// 			);

// 			// return a response
// 			return res.status(200).json({
// 				success: true,
// 				message: "Signature Verified and Course Added",
// 			});
// 		} catch (error) {
// 			console.log("Error in Verification of Signature: ", error);
// 			return res.status(500).json({
// 				success: false,
// 				message: error.message,
// 			});
// 		}
// 	} else {
// 		return res.status(400).json({
// 			success: false,
// 			message: "Invalid Signature!",
// 		});
// 	}
// };
exports.verifyPayment = async (req, res) => {
	const razorpay_order_id = req.body?.razorpay_order_id;
	const razorpay_payment_id = req.body?.razorpay_payment_id;
	const razorpay_signature = req.body?.razorpay_signature;
	const courses = req.body?.courses;

	const userId = req.user.id;

	if (
		!razorpay_order_id ||
		!razorpay_payment_id ||
		!razorpay_signature ||
		!courses ||
		!userId
	) {
		return res.status(203).json({
			success: false,
			message: "Payment Failed",
		});
	}

	let body = razorpay_order_id + "|" + razorpay_payment_id;

	const expectedSignature = crypto
		.createHmac("sha256", process.env.RAZORPAY_SECRET)
		.update(body.toString())
		.digest("hex");

	if (expectedSignature === razorpay_signature) {
		await enrollStudents(courses, userId, res);
		return res.status(200).json({
			success: true,
			message: "Payment Verified",
		});
	}

	return res.status(500).json({
		success: false,
		message: "Payment Failed",
	});
};

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
	const { orderId, paymentId, amount } = req.body;

	const userId = req.user.id;

	if (!orderId || !paymentId || !amount || !userId) {
		return res.status(400).json({
			success: false,
			message: "Please provide all the details",
			data: {
				orderId,
				paymentId,
				amount,
				userId,
			},
		});
	}

	try {
		const enrolledStudent = await User.findById(userId);

		await mailSender(
			enrolledStudent.email,
			`Payment Received`,
			paymentSuccessEmail(
				`${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
				amount / 100,
				orderId,
				paymentId
			)
		);
	} catch (error) {
		console.log("error in sending mail", error);
		return res.status(400).json({
			success: false,
			message: "Could not send email",
		});
	}
};
