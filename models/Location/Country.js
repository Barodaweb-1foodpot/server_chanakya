const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
  {
    CountryName: {
      type: String,
      required: true,
      unqiue: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Country", CountrySchema);
