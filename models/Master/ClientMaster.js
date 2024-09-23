//category name
//is active


const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const ClientMasterSchema = new mongoose.Schema(
  {
    clientName: {
        type: String,
    },
    SrNo: {
      type: Number,
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

module.exports = mongoose.model("ClientMaster", ClientMasterSchema);
