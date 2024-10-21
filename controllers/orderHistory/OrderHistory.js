const OrderHistory = require("../../models/OrderHistory/OrderHistory");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const nodemailer = require("nodemailer");
const mongoose = require('mongoose');
const saltRounds = 10;

exports.createOrderHistory = async (req, res) => {
  try {
    const { user, cart } = req.body
    const add = await OrderHistory.add(
      {
        user,
        cart
      }.exec()
    )
    return res.status(200).json({ isOk: true, add, message: "Order added successfully" })

  }
  catch (error) {
    return res.status(500).json({ message: "Internal server error" })
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
          estimatedDate: { $first: "$estimatedDate" },
          remark: { $first: "$remark" },
          createdAt: { $first: "$createdAt" },
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
          user: 1, orderNo: 1, estimatedDate: 1, remark: 1, createdAt: 1

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


exports.listOrderHistoryByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { IsActive: IsActive },
      },
      {
        $lookup: {
          from: "usermasters",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$cart",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productdetails", // Reference to ProductDetails collection
          localField: "cart.productName", // productName field in cart
          foreignField: "_id", // The _id in ProductDetails collection
          as: "productDetails", // Output array field
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            {
              "productDetails.productName": { $regex: match, $options: "i" },
            },
            {
              "userDetails.Name": { $regex: match, $options: "i" },
            },
            { estimatedDate: { $regex: match, $options: "i" }, },
            {
              orderNo: !isNaN(Number(match)) ? { $eq: Number(match) } : null,
            },

          ],
        },
      },
      {
        $group: {
          _id: "$_id",  // Group by OrderHistory ID
          user: { $first: "$userDetails" },
          orderNo: { $first: "$orderNo" },
          estimatedDate: { $first: "$estimatedDate" },
          remark: { $first: "$remark" },
          createdAt: { $first: "$createdAt" },
          cart: {
            $push: {
              productName: "$productDetails",
              quantity: "$cart.quantity",
            }
          }
        }
      },
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          stage2: [
            { $skip: skip },
            { $limit: per_page },
          ],
        },
      },
      {
        $unwind: {
          path: "$stage1",
        },
      },
      {
        $project: {
          count: "$stage1.count",
          data: "$stage2",
        },
      },
    ];

    // Apply sorting
    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir == "desc" ? -1 : 1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    } else {
      let sort = {};
      sort["createdAt"] = -1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    }
    // Execute the query
    const list = await OrderHistory.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};


exports.getOrderHistoryByUser = async (req, res) => {
  try {
    const userId = req.params._id; // Assuming _id is passed in the route parameter

    const userData = await OrderHistory.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) } // Find orders for the user
      },
      {
        $unwind: "$cart" // Unwind the cart array to work with individual cart items
      },
      {
        $lookup: {
          from: "productdetails",  // Reference to ProductDetails collection
          localField: "cart.productName",  // cart.productName refers to the product's ID (or name)
          foreignField: "_id",  // Match the product details by _id in ProductDetails
          as: "productDetails"  // Output array field for product details
        }
      },
      {
        $unwind: {
          path: "$productDetails", // Unwind the product details array
          preserveNullAndEmptyArrays: true // Preserves empty array if no matching product is found
        }
      },
      {
        $group: {
          _id: "$_id",  // Group by OrderHistory ID (which represents each order)
          user: { $first: "$user" },  // Include the user field
          orderNo: { $first: "$orderNo" },  // Include order number
          estimatedDate: { $first: "$estimatedDate" },  // Include order date
          remark: { $first: "$remark" },  // Include order remarks
          createdAt: { $first: "$createdAt" },  // Include the order creation date
          cart: {
            $push: {
              productDetails: "$productDetails",  // Include the populated product details
              quantity: "$cart.quantity"  // Include the product quantity in the order
            }
          }
        }
      }
    ]);

    // If userData is empty, return user details with a message saying no orders found
    if (userData.length === 0) {
      const basicUserDetails = await UserMaster.findOne(
        { _id: userId },
        { user: 1, orderNo: 1, estimatedDate: 1, remark: 1, createdAt: 1 } // Fetch basic user details
      );

      if (!basicUserDetails) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({ message: "Order history not found", user: basicUserDetails });
    }

    // Send the populated user data
    const sortedUserData = userData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Send the populated and sorted user data
    res.json(sortedUserData);
  } catch (error) {
    console.error("Error fetching order history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
