//category
//product name
//image
//price
//description
//isSubs (true: put that product in subscription tab)
//isGifthamper
//productsubsmaster id (make dropdown from product subs)

const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const ProductDetailsSchema = new mongoose.Schema(
  {
    categoryName: {
      type: Schema.Types.ObjectId,
      ref: "CategoryMaster",
      required: true,
    },
    subCategoryName: {
      type: Schema.Types.ObjectId,
      ref: "SubCategoryMaster",
      required: true,
    },
    brandName: {
      type: Schema.Types.ObjectId,
      ref: "BrandMaster",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      required: true,
    },
    SKU: {
      type: String,
      // required: true,
    },

    price: {
      type: Number,
      // required: true,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    IsActive: {
      type: Boolean,
      default: false,
    },
  
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductDetails", ProductDetailsSchema);
