// Import the Required Modules
const express = require("express");
const router = express.Router();

// Import the Required Controllers
const {
	deleteAccount,
	updateProfile,
	getAllUserDetails,
	updateDisplayPicture,
	getEnrolledCourses,
	instructorDashboard,
} = require("../controllers/Profile");

// Import the Required Middlewares
const { auth, isInstructor } = require("../middlewares/auth");

// *******************************************************************************
// 							Profile Routes
// *******************************************************************************

// Delete User Account
router.delete("/deleteProfile", auth, deleteAccount);

// Update User Profile
router.put("/updateProfile", auth, updateProfile);

// Get User's Details
router.get("/getUserDetails", auth, getAllUserDetails);

// Get Enroll Courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses);

// Update Display Picture
router.put("/updateDisplayPicture", auth, updateDisplayPicture);

// Get Instructor Dashboard
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard);

// Export the router for use in the main application
module.exports = router;
