const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createClientMaster,
    listClientMaster,
    listClientMasterByParams,
    getClientMaster,
    updateClientMaster,
    removeClientMaster,
    listActiveClients

} = require("../controllers/Master/ClientMaster");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/ClientMaster"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/ClientMaster");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: multerStorage });

router.post("/auth/create/ClientMaster",upload.single("logo"), catchAsync(createClientMaster));

router.get("/auth/list/ClientMaster", catchAsync(listClientMaster));

router.post("/auth/listByparams/ClientMaster", catchAsync(listClientMasterByParams));

router.get("/auth/get/ClientMaster/:_id", catchAsync(getClientMaster));

router.put("/auth/update/ClientMaster/:_id",upload.single("logo"), catchAsync(updateClientMaster));

router.delete("/auth/remove/ClientMaster/:_id", catchAsync(removeClientMaster));

router.get("/auth/listActive/Clients" , catchAsync(listActiveClients));

module.exports = router;