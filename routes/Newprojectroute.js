const express = require("express");
const multer = require("multer");
const fs = require("fs");
const catchAsync = require("../utils/catchAsync");
const { createNewProject, listNewProjectsByParams } = require("../controllers/NewProject/NewProjectCont");
 // Update the controller import accordingly

const router = express.Router();

// Ensure the upload directory exists
const uploadDirectory = "uploads/newProjectImages";
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Generalized Multer storage configuration
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination directory for the image file
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename for the uploaded file
    cb(null, Date.now() + "_" + file.originalname);
  },
});

// Set up multer for handling file uploads with a single field
const upload = multer({ storage: multerStorage });

// Route for creating a new project with an image file
router.post(
  "/auth/create/newproject",
  upload.single("newImage"),
  catchAsync(createNewProject)
);
const multerStorageCK = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = "uploads/descriptionCKImages";
    // Ensure the directory exists
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const uploadCk = multer({ storage: multerStorageCK });

//upload images
router.post(
  "/auth/descriptions/imageupload",
  uploadCk.single("uploadImage"),
  async (req, res) => {
    console.log(req.file.filename);
    res.json({ url: req.file.filename });
  }
);
router.post("/auth/list-by-params/newproject", catchAsync(listNewProjectsByParams));
module.exports = router;
