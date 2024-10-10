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
const CatalogueInquiry = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "UserMaster",
    //   required: true,
    },
    categoryName: {
        type: Schema.Types.ObjectId,
        ref: "CategoryMaster",
        // required: true,
      },
    subCategoryName: {
      type: Schema.Types.ObjectId,
      ref: "SubCategoryMaster",
    //   required: true,
    },
    startPrice: {
     
        type: String,
        // required: true,
    },
    endPrice: {
      type: String,
    //   required: true,
    },
    quantity: {
      type: String,
      // required: true,
    },

    productName:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductDetails", // Reference to the User model
      // required: true,
      default: null
    }],
    
    IsActive: {
      type: Boolean,
      default: true,
    },
    estimatedDate: {

      type:Date,
      default:''
    }
  
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("CatalogueInquiry", CatalogueInquiry);
