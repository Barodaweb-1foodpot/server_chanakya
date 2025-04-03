const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createNewsLetterMaster,
    listNewsLetterMaster,
    listNewsLetterMasterByParams,
    getNewsLetterMaster,
    updateNewsLetterMaster,
    removeNewsLetterMaster,
    listActiveNewsLetterMaster

} = require("../controllers/NewsLetter/NewsLetter");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/NewsLetterMaster"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/NewsLetterMaster");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: multerStorage });

router.post("/auth/create/NewsLetterMaster",upload.none(), catchAsync(createNewsLetterMaster));

router.get("/auth/list/NewsLetterMaster", catchAsync(listNewsLetterMaster));

router.post("/auth/listByparams/NewsLetterMaster", catchAsync(listNewsLetterMasterByParams));

router.get("/auth/get/NewsLetterMaster/:_id", catchAsync(getNewsLetterMaster));

router.put("/auth/update/NewsLetterMaster/:_id",upload.none(), catchAsync(updateNewsLetterMaster));

router.delete("/auth/remove/NewsLetterMaster/:_id", catchAsync(removeNewsLetterMaster));

router.get("/auth/listActive/NewsLetterMaster" , catchAsync(listActiveNewsLetterMaster));

module.exports = router;