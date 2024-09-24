//category name
//is active


const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const SubCategoryMasterSchema = new mongoose.Schema(
  {
    categoryName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CategoryMaster",
    },
    subCategoryName:{
        type: String,
    },
    SrNo: {
      type: Number,
    },
    logo: {
      type: String,
    },
    IsActive: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubCategoryMaster", SubCategoryMasterSchema);
