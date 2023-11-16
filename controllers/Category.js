// Import the Required Modules
const Category = require("../models/Category");

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

// Create Category
exports.createCategory = async (req, res) => {
	try {
		// fetch data from request body
		const { name, description } = req.body;

		// validation
		if (!name || !description) {
			return res.status(400).json({
				success: false,
				message: "All fields are required!",
			});
		}

		// create entry in database
		const categoryDetails = await Category.create({
			name: name,
			description: description,
		});

		// return a response
		return res.status(200).json({
			success: true,
			data: categoryDetails,
			message: "Category Created Successfully",
		});
	} catch (error) {
		console.log("Error in Creating Category: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get All Categories
exports.showAllCategories = async (req, res) => {
	try {
		// get all categories from the database
		const allCategories = await Category.find({});

		// return a response
		return res.status(200).json({
			success: true,
			data: allCategories,
			message: "All Categories Returns Successfully",
		});
	} catch (error) {
		console.log("Error in Showing All Categories: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Category Page Details
// exports.categoryPageDetails = async (req, res) => {
// 	try {
// 		// get category id
// 		const { categoryId } = req.body;

// 		// get courses for specified categoryId
// 		const selectedCategory = await Category.findById({ _id: categoryId })
// 			.populate("courses")
// 			.exec();

// 		// validation
// 		if (!selectedCategory) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "Data Not Found!",
// 			});
// 		}

// 		// get courses for different categories
// 		const differentCategories = await Category.find({
// 			_id: { $ne: categoryId },
// 		})
// 			.populate("courses")
// 			.exec();

// 		// get top selling courses
// 		// HW: write it on your own

// 		// return a response
// 		return res.status(200).json({
// 			success: true,
// 			data: {
// 				selectedCategory,
// 				differentCategories,
// 			},
// 		});
// 	} catch (error) {
// 		console.log("Error in Category Page Details: ", error);
// 		return res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };
exports.categoryPageDetails = async (req, res) => {
	try {
		const { categoryId } = req.body;
		// console.log("Printing Category Id: ", categoryId);

		// Get courses for the specified category
		const selectedCategory = await Category.findById(categoryId)
			.populate({
				path: "courses",
				match: { status: "Published" },
				populate: "ratingAndReviews",
			})
			.exec();
		// console.log(selectedCategory);

		// Handle the case when the category is not found
		if (!selectedCategory) {
			console.log("Category not found.");
			return res.status(404).json({
				success: false,
				message: "Category not found",
			});
		}

		// Handle the case when there are no courses
		// if (selectedCategory.courses.length === 0) {
		// 	console.log("No courses found for the selected category.");
		// 	return res.status(404).json({
		// 		success: false,
		// 		message: "No courses found for the selected category.",
		// 	});
		// }

		// Get courses for other categories
		const categoriesExceptSelected = await Category.find({
			_id: { $ne: categoryId },
		});

		let differentCategory = await Category.findOne(
			categoriesExceptSelected[
				getRandomInt(categoriesExceptSelected.length)
			]._id
		)
			.populate({
				path: "courses",
				match: { status: "Published" },
			})
			.exec();
		//console.log("Different COURSE", differentCategory)

		// Get top-selling courses across all categories
		const allCategories = await Category.find()
			.populate({
				path: "courses",
				match: { status: "Published" },
				populate: {
					path: "instructor",
				},
			})
			.exec();

		const allCourses = allCategories.flatMap(
			(category) => category.courses
		);

		const mostSellingCourses = allCourses
			.sort((a, b) => b.sold - a.sold)
			.slice(0, 10);
		// console.log("mostSellingCourses COURSE", mostSellingCourses)

		return res.status(200).json({
			success: true,
			message: "All Courses fetched successfully",
			data: {
				selectedCategory,
				differentCategory,
				mostSellingCourses,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error",
			error: error.message,
		});
	}
};
