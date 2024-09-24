//category name
//is active


const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const DealsMasterSchema = new mongoose.Schema(
  {
    startdate: {
        type: Date,
        },
    enddate: {
        type: Date,
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

module.exports = mongoose.model("DealsMaster", DealsMasterSchema);
