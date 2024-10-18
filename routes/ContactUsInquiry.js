const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createContactUsInquiry,
    listContactUsInquiry,
    listContactUsInquiryByParams,
    getContactUsInquiry,
    updateContactUsInquiry,
    removeContactUsInquiry,
    listActiveClients

} = require("../controllers/ContactUsInquiry/ContactUsInquiry");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/ContactUsInquiry"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/ContactUsInquiry");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: multerStorage });

router.post("/auth/create/ContactUsInquiry", catchAsync(createContactUsInquiry));

router.get("/auth/list/ContactUsInquiry", catchAsync(listContactUsInquiry));

router.post("/auth/listByparams/ContactUsInquiry", catchAsync(listContactUsInquiryByParams));

router.get("/auth/get/ContactUsInquiry/:_id", catchAsync(getContactUsInquiry));

router.put("/auth/update/ContactUsInquiry/:_id", catchAsync(updateContactUsInquiry));

router.delete("/auth/remove/ContactUsInquiry/:_id", catchAsync(removeContactUsInquiry));

router.get("/auth/listActive/Clients" , catchAsync(listActiveClients));

module.exports = router;