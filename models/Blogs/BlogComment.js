const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");

const BlogCommentSchema = new mongoose.Schema(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "blogs", // Reference to the User model
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users", // Reference to the User model
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlogComment", BlogCommentSchema);
