const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");

const {
  createUserMasterDetails,
  listUserMasterDetails,
  listUserMasterDetailsByParams,
  getUserMasterDetails,
  updateUserMasterDetails,
  removeUserMasterDetails,
  listUserMasterByCategory,
  loginUser,
  getExamUserMasterDetails,
  getUserMasterDetail,
  otpSignInRequest,
  updateUserCart,
  removeCartItem,
  updateUserMasterDetailsOrder
} = require("../controllers/UserMaster/UserMaster");




router.post(
  "/auth/create/UserMasterDetails",
  catchAsync(createUserMasterDetails)
);

router.get(
  "/auth/list/UserMasterDetails",
  catchAsync(listUserMasterDetails)
);

router.post(
  "/auth/listbyparams/UserMasterDetails",
  catchAsync(listUserMasterDetailsByParams)
);

router.get(
  "/auth/get/UserMasterDetails/:Email",
  catchAsync(getUserMasterDetails)
);

router.get(
  "/auth/get/UserMasterDetail/:_id",
  catchAsync(getUserMasterDetail)
);

router.get(
  "/auth/get/test/UserMasterDetails/:_id",
  catchAsync(getExamUserMasterDetails)
);

router.put(
  "/auth/update/UserMasterDetails/:_id",
  catchAsync(updateUserMasterDetails)
);

router.delete(
  "/auth/remove/UserMasterDetails/:_id",
  catchAsync(removeUserMasterDetails)
);

// APPLICATION
router.get(
  "/auth/list/UserMasterbycategory/:categoryId",
  catchAsync(listUserMasterByCategory)
);

// router.post("/auth/list/UserMasterbyid/:productId", catchAsync(getProductByID));

///

router.post("/UserMasterLogin", catchAsync(loginUser));

router.post("/auth/user/otp-signin-request", catchAsync(otpSignInRequest));

router.post("/auth/update/user-cart", catchAsync(updateUserCart))

router.post("/auth/remove/user-cart-item", catchAsync(removeCartItem))

router.put(
  "/auth/update/UserMasterDetails-order/:_id",
  catchAsync(updateUserMasterDetailsOrder)
);

module.exports = router;
