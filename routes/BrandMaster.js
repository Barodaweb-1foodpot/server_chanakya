const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createBrandMaster,
    listBrandMaster,
    listBrandMasterByParams,
    getBrandMaster,
    updateBrandMaster,
    removeBrandMaster,
    listActiveBrands,
    getBrandMasterDetails
} = require("../controllers/Master/BrandMaster");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/BrandMaster"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/BrandMaster");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: multerStorage });

router.post("/auth/create/BrandMaster",upload.any(), catchAsync(createBrandMaster));

router.get("/auth/list/BrandMaster", catchAsync(listBrandMaster));

router.post("/auth/listByparams/BrandMaster", catchAsync(listBrandMasterByParams));

router.get("/auth/get/BrandMaster/:_id", catchAsync(getBrandMaster));

router.put("/auth/update/BrandMaster/:_id",upload.any(), catchAsync(updateBrandMaster));

router.delete("/auth/remove/BrandMaster/:_id", catchAsync(removeBrandMaster));

router.get("/auth/listActive/Brands" , catchAsync(listActiveBrands));

router.get("/auth/get/BrandMasterDetails/:_id", catchAsync(getBrandMasterDetails));

module.exports = router;