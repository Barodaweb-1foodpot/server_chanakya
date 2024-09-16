const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema(
  {
    StateName: {
      type: String,
      required: true,
      unique: true,
    },
    CountryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("State", StateSchema);
