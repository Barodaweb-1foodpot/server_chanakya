const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const ContactSchema = new mongoose.Schema(
  {
    contactno: {
      type: String,
    },
    address: {
      type: String,
    },
    email: {
      type: String,
    },
    IsActive: {
      type: Boolean,
    },
   
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactSchema", ContactSchema);
