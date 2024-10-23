
const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const ContactUsInquiry = new mongoose.Schema(
    {
        username: {
            type: String,
            default: ""
        },
        email_1: {
            type: String,
            default: ""
        },
        contact: {
            type: String,
            default: ""
        },
        subject: {
            type: String,
            default: ""
        },
        message: {
            type: String,
            default: ""
            //   required: true,
        },


        IsActive: {
            type: Boolean,
            default: true,
        },



    },
    { timestamps: true }
);

module.exports = mongoose.model("ContactUsInquiry", ContactUsInquiry);
