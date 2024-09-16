const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const { createUserReview, listUserReviewByParams } = require("../controllers/UserReviewController.js/ReviewController");
router.post("/auth/userreview",catchAsync(createUserReview))
router.post(
    "/auth/list-by-params/userreview",
    catchAsync(listUserReviewByParams)
  );
module.exports = router;