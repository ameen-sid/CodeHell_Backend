// Create a Server
const express = require("express");
const app = express();

// Import Routes
const userRoutes = require("./routes/User");
const courseRoutes = require("./routes/Course");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const contactUsRoute = require("./routes/Contact");

// Import the Required Modules
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000;

// Connect to Database
database.connect();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: `${process.env.BASE_URL_FRONTEND}`,
		credentials: true,
	})
);
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp",
	})
);

// Connect to Cloudinary
cloudinaryConnect();

// Mount the Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// Default Routes
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Your server is up and running...",
	});
});

// Activate the server
app.listen(PORT, () => {
	console.log(`App is running at ${PORT}`);
});
