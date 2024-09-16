const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");

const {
  createPromocodeMaster,
  listPromocodeMaster,
  getPromocodeMaster,
  updatePromocodeMaster,
  removePromocodeMaster,
  listPromocodeMasterByParams,
  listActivePromocodeMaster,
} = require("../controllers/Products/PromocodeMaster");

router.post("/auth/create/PromocodeMaster", catchAsync(createPromocodeMaster));

router.get("/auth/list/PromocodeMaster", catchAsync(listPromocodeMaster));

router.get(
  "/auth/list-active/PromocodeMaster",
  catchAsync(listActivePromocodeMaster)
);

router.post(
  "/auth/list-by-params/PromocodeMaster",
  catchAsync(listPromocodeMasterByParams)
);

router.get("/auth/get/PromocodeMaster/:_id", catchAsync(getPromocodeMaster));

router.put(
  "/auth/update/PromocodeMaster/:_id",
  catchAsync(updatePromocodeMaster)
);

router.delete(
  "/auth/remove/PromocodeMaster/:_id",
  catchAsync(removePromocodeMaster)
);

module.exports = router;
