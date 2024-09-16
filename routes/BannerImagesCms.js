const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");

const {
  createBannerImages,
  listBannerImages,
  listBannerImagesByParams,
  getBannerImages,
  updateBannerImages,
  removeBannerImages,
} = require("../controllers/CMS/BannerImages");
const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/BannerImg");
  },
  filename: (req, file, cb) => {
    // const ext = file.mimetype.split("/")[1];
    // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: multerStorage });

router.post(
  "/auth/create/banner-images",
  upload.single("myFile"),
  catchAsync(createBannerImages)
);

router.get("/auth/list/banner-images", catchAsync(listBannerImages));

router.post(
  "/auth/list-by-params/banner-images",
  catchAsync(listBannerImagesByParams)
);

router.get("/auth/get/banner-images/:_id", catchAsync(getBannerImages));

router.put(
  "/auth/update/banner-images/:_id",
  upload.single("myFile"),
  catchAsync(updateBannerImages)
);

router.delete(
  "/auth/remove/banner-images/:_id",
  catchAsync(removeBannerImages)
);

module.exports = router;
