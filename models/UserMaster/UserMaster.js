const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const UserMasterSchema = new mongoose.Schema(
  {
   
    Name: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      required: true,
    },
    Mobile: {
      type: String,
      required: true,
    },
    
    Password: {
      type: String,
      required: true,
    },
    otp:{
      type:Number,
      default:''
    },
    cart: [
      {
        productName: {
          type: mongoose.Schema.Types.ObjectId,
        ref: "ProductDetails",
        },
        quantity: {
          type: Number,
        },
      },
      
    ],
   
    IsActive: {
      type: Boolean,
      default: true,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("UserMaster",UserMasterSchema);
