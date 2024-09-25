const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createCategoryMaster,
  listCategoryMaster,
  listCategoryMasterByParams,
  getCategoryMaster,
  updateCategoryMaster,
  removeCategoryMaster,
  listActiveCategories,
} = require("../controllers/Category/CategoryMaster");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/CategoryMaster"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/CategoryMaster");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: multerStorage });

router.post("/auth/create/CategoryMaster",upload.single("logo"), catchAsync(createCategoryMaster));

router.get("/auth/list/CategoryMaster", catchAsync(listCategoryMaster));

router.post("/auth/listByparams/CategoryMaster", catchAsync(listCategoryMasterByParams));

router.get("/auth/get/CategoryMaster/:_id", catchAsync(getCategoryMaster));

router.put("/auth/update/CategoryMaster/:_id",upload.single("logo"), catchAsync(updateCategoryMaster));

router.delete("/auth/remove/CategoryMaster/:_id", catchAsync(removeCategoryMaster));

router.get("/auth/listActive/Categories" , catchAsync(listActiveCategories));



module.exports = router;