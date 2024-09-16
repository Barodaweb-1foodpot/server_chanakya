const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const UserReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    subject: {
      type: String,
    },
    message: {
        type: String,
    },
   
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserReviewSchema", UserReviewSchema);
