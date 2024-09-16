const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  uplodaImages,
  createCompanyDetails,
  listCompanyDetails,
  updateDetails,
  getDetail,
} = require("../controllers/Setup/CompanyDetails");
const catchAsync = require("../utils/catchAsync");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/companydetails");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage: multerStorage });

router.get("/auth/list/companyDetails", catchAsync(listCompanyDetails));
router.post(
  "/auth/upload/companyDetails",
  upload.single("file"),
  catchAsync(uplodaImages)
);
router.post(
  "/auth/create/companyDetails",
  catchAsync(createCompanyDetails)
);
router.put(
  "/auth/update/companyDetails/:_id",
  catchAsync(updateDetails)
);
router.get(
  "/auth/get/companyDetails/:_id",
  catchAsync(getDetail)
);

module.exports = router;
