const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");
const {
  createBlogsComment,
  listBlogsComment,
  listBlogsCommentByParams,
  getBlogsComment,
  updateBlogsComment,
  removeBlogsComment,
} = require("../controllers/Blogs/BlogComment");

router.post("/auth/create/blogsComment", catchAsync(createBlogsComment));

router.get("/auth/list/blogsComment", catchAsync(listBlogsComment));

router.post("/auth/list-by-params/blogsComment", catchAsync(listBlogsCommentByParams));

router.get("/auth/get/blogsComment/:_id", catchAsync(getBlogsComment));

router.put("/auth/update/blogsComment/:_id", catchAsync(updateBlogsComment));

router.delete("/auth/remove/blogsComment/:_id", catchAsync(removeBlogsComment));

module.exports = router;
