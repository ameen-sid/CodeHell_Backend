// Import the Require Modules
const express = require("express");
const router = express.Router();

// Import the Requied Controllers

// Course controller import
const {
	createCourse,
	getAllCourses,
	getCourseDetails,
	getFullCourseDetails,
	editCourse,
	getInstructorCourses,
	deleteCourse,
} = require("../controllers/Course");

// Categories conroller import
const {
	showAllCategories,
	createCategory,
	categoryPageDetails,
} = require("../controllers/Category");

// Section controller import
const {
	createSection,
	updateSection,
	deleteSection,
} = require("../controllers/Section");

// Subsection controller import
const {
	createSubSection,
	updateSubSection,
	deleteSubSection,
} = require("../controllers/SubSection");

// Rating controller imports
const {
	createRating,
	getAverageRating,
	getAllRating,
} = require("../controllers/RatingAndReviews");

const { updateCourseProgress } = require("../controllers/CourseProgress");

// Import the Required Middlewares
const {
	auth,
	isInstructor,
	isStudent,
	isAdmin,
} = require("../middlewares/auth");

// *******************************************************************************
// 								Course Routes
// *******************************************************************************

// Courses can only be created by instructors

// Route for Create Course
router.post("/createCourse", auth, isInstructor, createCourse);

// Route for Add a Section to a Course
router.post("/addSection", auth, isInstructor, createSection);

// Route for Update a Section
router.post("/updateSection", auth, isInstructor, updateSection);

// Route for Delete a Section
router.post("/deleteSection", auth, isInstructor, deleteSection);

// Route for Add a Sub Section to a Section
router.post("/addSubSection", auth, isInstructor, createSubSection);

// Route for Edit Sub Section
router.post("/updateSubSection", auth, isInstructor, updateSubSection);

// Route for Delete a Sub Section
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);

// Route for Get All Registered Courses
router.get("/getAllCourses", getAllCourses);

// Route for Get Details for a Specific Course
router.post("/getCourseDetails", getCourseDetails);

// Route for Get Details for a Specific Course
router.post("/getFullCourseDetails", auth, getFullCourseDetails);

// Route for Edit Course
router.post("/editCourse", auth, isInstructor, editCourse);

// Route for Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);

// Route for Delete a Course
router.delete("/deleteCourse", deleteCourse);

// Route for Update Course Progress of Student
router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

// *******************************************************************************
// 							Category Routes (Only be Admin)
// *******************************************************************************

// Category can only be created by admin

// TODO: Put isAdmin Middleware here

// Route for Create a New Category
router.post("/createCategory", auth, isAdmin, createCategory);

// Route for Show All Categories
router.get("/showAllCategories", showAllCategories);

// Route for Get Category Page Details
router.post("/getCategoryPageDetails", categoryPageDetails);

// *******************************************************************************
// 							Rating And Review
// *******************************************************************************

// Route for Create a Rating
router.post("/createRating", auth, isStudent, createRating);

// Route for Get Average Rating
router.get("/getAverageRating", getAverageRating);

// Route for Get Reviews
router.get("/getReviews", getAllRating);

// Export the router for use in the main application
module.exports = router;
