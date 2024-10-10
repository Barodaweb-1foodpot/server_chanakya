const UserMaster = require("../../models/UserMaster/UserMaster");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const nodemailer = require("nodemailer");
const mongoose = require('mongoose');
const saltRounds = 10;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

exports.getUserMasterDetails = async (req, res) => {
  try {
    const userData = await UserMaster.aggregate([
      // Match the specific user by Email (as _id)
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.Email) }
      },
      // Unwind the cart array to treat each item as a separate document
      {
        $unwind: {
          path: "$cart",
          // preserveNullAndEmptyArrays: false
        }
      },
      // Lookup the ProductDetails from productName in cart
      {
        $lookup: {
          from: "productdetails",  // Reference to ProductDetails collection
          localField: "cart.productName",  // productName field in cart
          foreignField: "_id",  // The _id in ProductDetails collection
          as: "productDetails"  // Output array field
        }
      },
      // Unwind productDetails (it will be an array because of the lookup)
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup the BrandMaster for the brandName field inside productDetails
      {
        $lookup: {
          from: "brandmasters",  // Reference to BrandMaster collection
          localField: "productDetails.brandName",  // brandName in productDetails
          foreignField: "_id",  // The _id in BrandMaster collection
          as: "brandDetails"  // Output array field for the brand details
        }
      },
      // Unwind the brandDetails (it will also be an array)
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup the CategoryMaster for the categoryName field inside productDetails
      {
        $lookup: {
          from: "categorymasters",  // Reference to CategoryMaster collection
          localField: "productDetails.categoryName",  // categoryName in productDetails
          foreignField: "_id",  // The _id in CategoryMaster collection
          as: "categoryDetails"  // Output array field for the category details
        }
      },
      // Unwind the categoryDetails
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup the SubCategoryMaster for the subCategoryName field inside productDetails
      {
        $lookup: {
          from: "subcategorymasters",  // Reference to SubCategoryMaster collection
          localField: "productDetails.subCategoryName",  // subCategoryName in productDetails
          foreignField: "_id",  // The _id in SubCategoryMaster collection
          as: "subCategoryDetails"  // Output array field for the subcategory details
        }
      },
      // Unwind the subCategoryDetails
      {
        $unwind: {
          path: "$subCategoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      // Group back to get the cart array in a nested form with product, brand, category, and subcategory details
      {
        $group: {
          _id: "$_id",  // Group by user ID
          Name: { $first: "$Name" },
          Email: { $first: "$Email" },
          Mobile: { $first: "$Mobile" },
          cart: {
            $push: {
              productName: "$productDetails",
              quantity: "$cart.quantity",
              brandName: "$brandDetails",
              categoryName: "$categoryDetails",
              subCategoryName: "$subCategoryDetails"
            }
          }
        }
      }
      
    ]);

    // Send the user data with populated product, brand, category, and subcategory details
    res.json(userData[0]);  // Since aggregate returns an array, we send the first result

  } catch (error) {
    return res.status(500).send(error);
  }
};




exports.getUserMasterDetail = async (req, res) => {
  try {
    const find = await UserMaster.findOne({
      _id: req.params._id,
    }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createUserMasterDetails = async (req, res) => {
  try {
    // Check and create directory if it doesn't exist
  

    // Destructure request body
    let {
      Name,
      Email,
      Mobile,
      Password,
      IsActive,
    } = req.body;

    const already = await UserMaster.findOne({Email : Email}).exec()

    if(already)
    {
      return res.status(200).json({isOk: false, message :'Email already registered'})
    }

    // Hash the password before saving it

    // Create new UserMaster document with hashed password
    const add = await new UserMaster({
      Name,
      Email,
      Mobile,
      Password, // Use hashed password here
      IsActive,
    }).save();

    // Send successful response
    return res.status(200).json({ isOk: true, data: add, message: "Signup successfully" });
  } catch (err) {
    // Log error and send error response
    console.log(err);
    return res.status(500).send(err);
  }
};

exports.listUserMasterDetails = async (req, res) => {
  try {
    const list = await UserMaster.find().sort({ Name: 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listUserMasterByCategory = async (req, res) => {
  try {
    const list = await UserMaster.find()
      .sort({ createdAt: -1 })
      .exec();
    if (list) {
      res.status(200).json({ isOk: true, data: list, message: "" });
    } else {
      res.status(200).json({ isOk: false, message: "No data Found" });
    }
  } catch (error) {
    return res.status(400).send(error);
  }
};
exports.listUserMasterDetailsByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { IsActive: IsActive },
      },
     
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
          stage2: [
            {
              $skip: skip,
            },
            {
              $limit: per_page,
            },
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
    if (match) {
      query = [
        {
          $match: {
            $or: [
              {
                Name: { $regex: match, $options: "i" },
              },
            ],
          },
        },
      ].concat(query);
    }


    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir === "desc" ? -1 : 1;
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

    const list = await UserMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateUserMasterDetails = async (req, res) => {
  try {
   
// console.log(req.body);
    const data = req.body
    const update = await UserMaster.findOneAndUpdate(
      { _id: req.params._id },
      data,

      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeUserMasterDetails = async (req, res) => {
  try {
    const del = await UserMaster.deleteOne({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};



exports.loginUser = async (req, res) => {
  const { Email, Password } = req.body;

  try {
    // Find the user by UserName
    const user = await UserMaster.findOne({ Email });

    if (!user) {
      return res.json({ success: false, message: "User Doesn't Exist!" });
    }

    // Compare the provided plain-text password with the stored hashed password
  const isMatch = Password === user.Password;


    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    // Generate a token (assuming createToken is a function you have to create a JWT)
    const token = createToken(user._id);

    // Return success response with the token
    return res.json({ success: true, token ,user});
  } catch (error) {
    // Log any errors that occur and send a general error response
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


exports.otpSignInRequest = async (req, res) => {
  const { Email } = req.body;

  
    try{
      const check = await UserMaster.findOne({Email:Email}).exec()
      if(check)
      {
        return res.status(200).json({isOk:false, message:"Email already registered"})
      }
      const otp = generateOTP();
    
    await sendLoginOTPEmail(Email, otp);
    res.status(200).json({
      isOk: true,
      message: "OTP sent to your email",
      status: 200,
      otp
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      isOk: false,
      message: "An error occurred while sending OTP",
      status: 500,
    });
  }
};

const sendLoginOTPEmail = async (email, otp) => {
 
  try {
    
    if (!email) {
      throw new Error("Email details not found in notification");
    }
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or another email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      to: email,
      subject: "Sign In Verfification code for Chanakya",
      html: `This is your ${otp}`, // Use html property to render HTML content
    };
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};


exports.updateUserCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    const user = await UserMaster.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" ,isOk:false});
    }

    // Check if the product already exists in the cart
    const existingCartItem = user.cart.find(
      (item) => item.productName._id.toString() === productId
    );

    if (existingCartItem) {
      // Update the quantity if the product is already in the cart
      existingCartItem.quantity += quantity;
    } else {
      // Add new product to the cart
      user.cart.push({ productName: productId, quantity });
    }

    await user.save();

    return res.status(200).json({ message: "Product Added to cart successfully", user ,isOk:true});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error",isOk:false });
  }
};


exports.removeCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Find the user by their ID and update the cart by removing the product
    const data = await UserMaster.findByIdAndUpdate(userId, {
      $pull: { cart: { productName: productId } } // Removes the item with matching productName._id
    });

    res.json({ success: true, message: 'Item removed from cart' , isOk:true, data});
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ success: false, message: 'Error removing item from cart' ,isOk:false });
  }
};
