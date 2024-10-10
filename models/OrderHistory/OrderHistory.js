const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const OrderHistory = new mongoose.Schema(
  {
    orderNo:
    {
        type:Number,

    },
   
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserMaster",
    },
    remark: {
      type: String,
      default:''
    },
    date: {
      type: Date,
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

module.exports = mongoose.model("OrderHistory",OrderHistory);
