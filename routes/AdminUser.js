const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createAdminUser,
  listAdminUser,
  listAdminUserByParams,
  getAdminUser,
  updateAdminUser,
  removeAdminUser,
  userLoginAdmin,
} = require("../controllers/Auth/User/AdminUsers");
const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/userImages");
  },
  filename: (req, file, cb) => {
    // const ext = file.mimetype.split("/")[1];
    // cb(null, `${uuidv4()}-${Date.now()}.${ext}`);
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: multerStorage });
router.post("/auth/create/adminUser",upload.single("myFile"), catchAsync(createAdminUser));

router.get("/auth/list/adminUser", catchAsync(listAdminUser));

router.post("/auth/listByparams/adminUser", catchAsync(listAdminUserByParams));

router.get("/auth/get/adminUser/:_id", catchAsync(getAdminUser));

router.put("/auth/update/adminUser/:_id",upload.single("myFile"), catchAsync(updateAdminUser));

router.delete("/auth/remove/adminUser/:_id", catchAsync(removeAdminUser));

router.post("/adminLogin", catchAsync(userLoginAdmin));

module.exports = router;
