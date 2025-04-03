const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");

const {
    createCatalogueInquiry,
    listCatalogueInquiryByParams,
    getCatalogueInquiry,
    excelDownloadforHighestLoyaltyPoint
} = require("../controllers/CatalogueInquiry/CatalogueInquiry");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/Products"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/Products");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const upload = multer({ storage: multerStorage });

router.post('/auth/create/catalogue-inqiury' , catchAsync(createCatalogueInquiry))

router.post("/auth/listByparams/listCatalogueInquiryByParams", catchAsync(listCatalogueInquiryByParams));

router.get("/auth/get/CatalogueInquiry/:_id", catchAsync(getCatalogueInquiry));

router.post("/auth/excelDownloadforCatalogueInquiry", catchAsync(excelDownloadforHighestLoyaltyPoint));

module.exports = router;
