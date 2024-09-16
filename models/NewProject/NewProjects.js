const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const NewProjects = new mongoose.Schema(
  {
    solarrooftype: {
      type: String,
    },
    
    description: {
      type: String,
    },
    shortDescription:{
        type:String,
    },
    productImage: {
        type: String,
    },
   
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewProjects", NewProjects);
