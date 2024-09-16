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

router.post("/auth/create/categoryMaster", catchAsync(createCategoryMaster));

router.get("/auth/list/categoryMaster", catchAsync(listCategoryMaster));

router.get(
  "/auth/list-active/categoryMaster",
  catchAsync(listActiveCategories)
);

router.post(
  "/auth/list-by-params/categoryMaster",
  catchAsync(listCategoryMasterByParams)
);

router.get("/auth/get/categoryMaster/:_id", catchAsync(getCategoryMaster));

router.put(
  "/auth/update/categoryMaster/:_id",
  catchAsync(updateCategoryMaster)
);

router.delete(
  "/auth/remove/categoryMaster/:_id",
  catchAsync(removeCategoryMaster)
);

module.exports = router;
