//category name
//is active


const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const BrandMasterSchema = new mongoose.Schema(
  {
    brandName: {
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
    brandBrochure: [
      {
        categoryName: {
          type: mongoose.Schema.Types.ObjectId,
        ref: "CategoryMaster",
        },
        title: {
          type: String,
        },
        linkdoc: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("BrandMaster", BrandMasterSchema);
