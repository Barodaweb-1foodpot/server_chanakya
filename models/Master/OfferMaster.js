//category name
//is active


const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const offermasterSchema = new mongoose.Schema(
  {
    title: {
        type: String,
    },
    desc: {
      type: String,
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

module.exports = mongoose.model("offermaster", offermasterSchema);
