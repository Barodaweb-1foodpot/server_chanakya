const OrderHistory = require("../../models/OrderHistory/OrderHistory");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const nodemailer = require("nodemailer");
const mongoose = require('mongoose');
const saltRounds = 10;

exports.createOrderHistory = async(req,res)=>{
    try{
        const {user, cart} = req.body
        const add = await OrderHistory.add(
            {
                user,
                cart
            }.exec()
        )
        return res.status(200).json({isOk:true, add, message :"Order added successfully"})

    }
    catch(error)
    {
        return res.status(500).json({message:"Internal server error"})
    }
}

exports.getOrderHistoryById = async (req, res) => {
    try {
      const userId = req.params._id; // Assuming _id is passed in the route parameter
  
      const userData = await OrderHistory.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(userId) }
        },
        {
          $unwind: "$cart"
        },
        {
          $lookup: {
            from: "productdetails",  // Reference to ProductDetails collection
            localField: "cart.productName",  // productName field in cart
            foreignField: "_id",  // The _id in ProductDetails collection
            as: "productDetails"  // Output array field
          }
        },
        {
          $unwind: {
            path: "$productDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "usermasters",  // Reference to UserMaster collection
            localField: "user",  // user field in OrderHistory
            foreignField: "_id",  // The _id in UserMaster collection
            as: "userDetails"  // Output array field
          }
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: "$_id",  // Group by OrderHistory ID
            user: { $first: "$userDetails" },
            orderNo: { $first: "$orderNo" },
            date: { $first: "$date" },
            remark: { $first: "$remark" },
            createdAt :{ $first: "$createdAt" },
            cart: {
              $push: {
                productName: "$productDetails",
                quantity: "$cart.quantity",
              }
            }
          }
        },
      ]);
  
      // Check if userData is empty, if yes, return a basic user response
      if (userData.length === 0) {
        const basicUserDetails = await UserMaster.findOne(
          { _id: userId },  // Assuming _id is being used to find user details
          {
            user: 1, orderNo: 1, date: 1, remark: 1,createdAt:1
           
          }
        );
        if (!basicUserDetails) {
          return res.status(404).json({ message: "User not found" });
        }
        return res.json({ message: "Order history not found", user: basicUserDetails });
      }
  
      // Send the populated user data
      res.json(userData[0]);  // Send the first result from the aggregation
    } catch (error) {
      console.error("Error fetching order history:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  