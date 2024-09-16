//category name
//is active


const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const CategoryMasterSchema = new mongoose.Schema(
  {
    categoryName: {
        type: String,
    },
    IsActive: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CategoryMaster", CategoryMasterSchema);
