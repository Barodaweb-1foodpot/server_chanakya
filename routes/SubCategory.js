const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createSubCategoryMaster,
    listSubCategoryMaster,
    getSubCategoryMaster,
    updateSubCategoryMaster,
    removeSubCategoryMaster,
    listSubCategoryMasterByParams,

} = require("../controllers/Category/SubCategoryMaster");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/SubCategoryMaster"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/SubCategoryMaster");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: multerStorage });

router.post("/auth/create/SubCategoryMaster",upload.single("logo"), catchAsync(createSubCategoryMaster));

router.get("/auth/list/SubCategoryMaster", catchAsync(listSubCategoryMaster));

router.post("/auth/listByparams/SubCategoryMaster", catchAsync(listSubCategoryMasterByParams));

router.get("/auth/get/SubCategoryMaster/:_id", catchAsync(getSubCategoryMaster));

router.put("/auth/update/SubCategoryMaster/:_id",upload.single("logo"), catchAsync(updateSubCategoryMaster));

router.delete("/auth/remove/SubCategoryMaster/:_id", catchAsync(removeSubCategoryMaster));

module.exports = router;