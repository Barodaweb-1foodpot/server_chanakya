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
      type: Number,
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
    companyName: {
      type: String,
      default:''
    },
    designation: {
      type: String,
      default:''
    },
    lastname: {
      type: String,
      default:''
    },
    companyEmail: {
      type: String,
      default:''
    },
    companyContactNo: {
      type: Number,
      default:''
    },
    companyAddress: {
      type: String,
      default:''
    },
    
    IsActive: {
      type: Boolean,
      default: true,
    },
    orderHistory:[{
      type: mongoose.Schema.Types.ObjectId,
        ref: "OrderHistory",}
    ]

  },
  { timestamps: true }
);

module.exports = mongoose.model("UserMaster",UserMasterSchema);
