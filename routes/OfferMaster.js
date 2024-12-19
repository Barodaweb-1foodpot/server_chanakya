const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createOfferMaster,
    listOfferMaster,
    listOfferMasterByParams,
    getOfferMaster,
    updateOfferMaster,
    removeOfferMaster,
    listActiveOfferMaster

} = require("../controllers/Master/OfferMaster");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/OfferMaster"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/OfferMaster");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: multerStorage });

router.post("/auth/create/OfferMaster",upload.single("logo"), catchAsync(createOfferMaster));

router.get("/auth/list/OfferMaster", catchAsync(listOfferMaster));

router.post("/auth/listByparams/OfferMaster", catchAsync(listOfferMasterByParams));

router.get("/auth/get/OfferMaster/:_id", catchAsync(getOfferMaster));

router.put("/auth/update/OfferMaster/:_id",upload.single("logo"), catchAsync(updateOfferMaster));

router.delete("/auth/remove/OfferMaster/:_id", catchAsync(removeOfferMaster));

router.get("/auth/listActive/OfferMaster" , catchAsync(listActiveOfferMaster));

module.exports = router;