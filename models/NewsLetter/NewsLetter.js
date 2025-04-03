//category name
//is active


const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const newslettermasterSchema = new mongoose.Schema(
  {
    email: {
        type: String,
    },
    
    IsActive: {
      type: Boolean,
      default:true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("newslettermaster", newslettermasterSchema);
