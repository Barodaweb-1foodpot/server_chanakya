const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const CompanyLocationSchema = new mongoose.Schema(
  {
    CityID: {
      type: String,
      required: true,
    },
    StateID: {
      type: Schema.Types.ObjectId,
      ref: "State",
      required: true,
    },
    CountryID: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    Area: {
      type: String,
    },
    Location: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    Address: {
      type: String,
    },
    StoreLogo: {
      type: String,
    },
    // UserName: {
    //   type: String,
    //   required: true,
    // },
    // Password: {
    //   type: String,
    //   required: true,
    // },
    
    IsActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyLocation", CompanyLocationSchema);
