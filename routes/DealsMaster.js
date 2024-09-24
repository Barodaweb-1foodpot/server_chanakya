const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createDealsMaster,
    listDealsMaster,
    listDealsMasterByParams,
    getDealsMaster,
    updateDealsMaster,
    removeDealsMaster,
    listActiveDeals
} = require("../controllers/Master/DealsMaster");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/DealsMaster"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/DealsMaster");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: multerStorage });

router.post("/auth/create/DealsMaster",upload.single("logo"), catchAsync(createDealsMaster));

router.get("/auth/list/DealsMaster", catchAsync(listDealsMaster));

router.post("/auth/listByparams/DealsMaster", catchAsync(listDealsMasterByParams));

router.get("/auth/get/DealsMaster/:_id", catchAsync(getDealsMaster));

router.put("/auth/update/DealsMaster/:_id",upload.single("logo"), catchAsync(updateDealsMaster));

router.delete("/auth/remove/DealsMaster/:_id", catchAsync(removeDealsMaster));

router.get("/auth/listActive/Deals" , catchAsync(listActiveDeals));

module.exports = router;