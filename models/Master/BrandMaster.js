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
  },
  { timestamps: true }
);

module.exports = mongoose.model("BrandMaster", BrandMasterSchema);
