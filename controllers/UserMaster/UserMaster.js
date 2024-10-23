const UserMaster = require("../../models/UserMaster/UserMaster");
const OrderHistory = require("../../models/OrderHistory/OrderHistory")
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
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.Email) }
      },
      // Project the cart only if it's not empty, otherwise skip the processing of cart
      {
        $project: {
          _id: 1,
          Name: 1,
          Email: 1,
          Mobile: 1,
          Password: 1,
          companyName: 1,
          designation: 1,
          lastname: 1,
          companyEmail: 1,
          companyContactNo: 1,
          companyAddress: 1,
          cartExists: { $cond: { if: { $gt: [{ $size: "$cart" }, 0] }, then: true, else: false } },  // Check if cart has items
          cart: 1
        }
      },
      // Only proceed with the next stages if the cart exists and is not empty
      {
        $match: { cartExists: true }
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
          from: "brandmasters",  // Reference to BrandMaster collection
          localField: "productDetails.brandName",  // brandName in productDetails
          foreignField: "_id",  // The _id in BrandMaster collection
          as: "brandDetails"  // Output array field for the brand details
        }
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "categorymasters",  // Reference to CategoryMaster collection
          localField: "productDetails.categoryName",  // categoryName in productDetails
          foreignField: "_id",  // The _id in CategoryMaster collection
          as: "categoryDetails"  // Output array field for the category details
        }
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "subcategorymasters",  // Reference to SubCategoryMaster collection
          localField: "productDetails.subCategoryName",  // subCategoryName in productDetails
          foreignField: "_id",  // The _id in SubCategoryMaster collection
          as: "subCategoryDetails"  // Output array field for the subcategory details
        }
      },
      {
        $unwind: {
          path: "$subCategoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",  // Group by user ID
          Name: { $first: "$Name" },
          Email: { $first: "$Email" },
          Mobile: { $first: "$Mobile" },
          companyAddress: { $first: "$companyAddress" },
          companyContactNo: { $first: "$companyContactNo" },
          companyEmail: { $first: "$companyEmail" },
          lastname: { $first: "$lastname" },
          designation: { $first: "$designation" },
          companyName: { $first: "$companyName" },
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
      },
      // Check if cart is empty after processing, and replace with [] if no cart items are found
      {
        $addFields: {
          cart: {
            $cond: {
              if: { $eq: [{ $size: "$cart" }, 0] },  // If the size of cart is 0
              then: [],  // Set cart to an empty array
              else: "$cart"  // Otherwise, keep the populated cart
            }
          }
        }
      }
    ]);

    // If the cart was empty, the cart field will remain an empty array
    if (userData.length === 0) {
      const basicUserDetails = await UserMaster.findOne(
        { _id: req.params.Email },
        { Name: 1, Email: 1, Mobile: 1 ,companyName: 1,
          designation: 1,
          lastname: 1,
          companyEmail: 1,
          companyContactNo: 1,
          companyAddress: 1,
        Password:1}
      );
      return res.json({ ...basicUserDetails._doc, cart: [] });
    }

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
    res.json({update, isOk:true});
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
      tls: {
        rejectUnauthorized: false, // Allows self-signed certificates (only for development)
      },
    });
    
    const mailOptions = {
      to: email,
      subject: "Your OTP for Account Sign Up – Chanakya Corporate",
      html: `<html lang="en">

      <head>
      
          <meta charset="UTF-8">
          <style>
              body, table, td, a {
                  -webkit-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
              }
      
              table, td {
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
              }
      
              img {
                  -ms-interpolation-mode: bicubic;
              }
      
              img {
                  border: 0;
                  height: auto;
                  line-height: 100%;
                  outline: none;
                  text-decoration: none;
              }
      
              table {
                  border-collapse: collapse !important;
              }
      
              body {
                  height: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
              }
      
              a[x-apple-data-detectors] {
                  color: inherit !important;
                  text-decoration: none !important;
                  font-size: inherit !important;
                  font-family: inherit !important;
                  font-weight: inherit !important;
                  line-height: inherit !important;
              }
      
              div[style*="margin: 16px 0;"] {
                  margin: 0 !important;
              }
          </style>
      
      
      </head>
      
      <body style="background-color: #f7f5fa; margin: 0 !important; padding: 0 !important;">
      
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                  <td bgcolor="#426899" align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                          <tr>
                              <td align="center" valign="top" style="padding: 20px 10px 10px 10px;">
                                  <div style="display: block; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px;" border="0"><a href="chanakyacorporate.com" style=" color: #ffffff;">chanakyacorporate.com</a></div>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <tr>
                  <td bgcolor="#426899" align="center" style="padding: 0px 10px 0px 10px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                          <tr>
                              <td bgcolor="#ffffff" align="center" valign="top" style="padding: 20px 30px 0px 30px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; line-height: inherit;">
                                <img src="https://server.chanakyacorporate.com/uploads/logo.png" />
                              </td>
                          </tr>
      
                           
                      </table>
                  </td>
              </tr>
              <tr>
                  <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                          <tr>
                              <td bgcolor="#ffffff" align="left">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
      
                                      <tr>
                                          <td colspan="2" style="padding-left:30px;padding-right:15px;padding-bottom:10px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: inherit;">
                                              <h5 style="padding:0; margin:0; font-size:14px; font-weight:500;">Welcome To Chanakya Corporate, We're excited to have you onboard.</h5>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td colspan="2" style="padding-left:30px;padding-right:15px;padding-bottom:10px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: inherit;">
                                              <p style="line-height:24px;">
                                                 Your Otp is : <span style="font-weight:bold"> ${otp}</span>
                                              </p>
                                              <p style="line-height:24px;">
                                               Please keep it confidential and do not share it with anyone.

                                                If you did not initiate this sign-up, please contact us immediately.
                                                </p>

                                          </td>
                                      </tr>
                                     
                                  </table>
                              </td>
                          </tr>
                          <tr>
                        <td bgcolor="#ffffff" align="left">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td bgcolor="#ffffff" align="center" style="padding: 30px 30px 30px 30px; border-top:1px solid #dddddd;">
                                        <table border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="left" style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 25px;">
                                                   
                                                    <p style="margin:0 0 5px;">
                                                         Address : Opp. Pratap Talkies, opp. Sursagar Lake (East), Vadodara, Gujarat 390001, India
 <br />Address : Chanakya The bag Studio, vadivadi, near race course circle, race course road,
 Vadodara, Gujarat, India</p>

                                                    <p style="margin:0 0 5px;">
                                                        Email : <a href="mailto:chanakyathebagstudio@gmail.com" style="color:#000; text-decoration:none;"> chanakyathebagstudio@gmail.com</a> | 
                                                               
                                                    </p>

                                                    <p style="margin:0 0 5px;">
                                                        Contact : <a href="tel: 919974017727" style="color:#000; text-decoration:none;">+91 919974017727 </a> || <a href="tel: :919974017725 " style="color:#000; text-decoration:none;">+91 919974017725  </a>
                                                    </p>

                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                           
                      </table>
                  </td>
              </tr>
              <tr>
                  <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                          <tr>
                              <td bgcolor="#f4f4f4" align="left" style="padding: 30px 30px 30px 30px; color: #666666; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;">
                                  <p style="margin: 0; font-size:12px;">Design by "<a href="https://barodaweb.com/" target="_blank" style="color: #111111; font-weight: 500; "> Barodaweb The E-Catalogue Designer.</a>".</p>
                              </td>
                          </tr>
                          </table>
                  </td>
              </tr>
          </table>
      
          <script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>
      </body>
      
      </html>
      `,
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
    console.log(user)

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




exports.updateUserMasterDetailsOrder = async (req, res) => {
  try {
    const { cartNew } = req.body;  // Get the cart from the request body
    const userId = req.params._id;  // Get the user ID from the params
    let { ...fieldvalues } = req.body;

    // Step 1: Update the cart in UserMaster to an empty array
    const user = await UserMaster.findOneAndUpdate(
      { _id: userId },
      fieldvalues,  // Update other user details from req.body
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Find the last orderNo from OrderHistory
    const lastOrder = await OrderHistory.findOne({}).sort({ orderNo: -1 }).exec();

    // Ensure orderNo is a number before incrementing
    const newOrderNo = lastOrder ? parseInt(lastOrder.orderNo, 10) + 1 : 1;

    // Step 3: Create a new order in OrderHistory with the new orderNo
    const newOrder = await OrderHistory.create({
      user: userId,
      cart: cartNew,  // Use the cart from the request body
      IsActive: true,
      orderNo: newOrderNo ,
      remark:fieldvalues.remark,
      estimatedDate:fieldvalues.estimatedDate,
    });

    // Step 4: Update the UserMaster with the new OrderHistory _id
    user.orderHistory.push(newOrder._id);
    await user.save();

    // Return the updated user information
    res.json({ message: "Order created successfully", user, orderHistory: newOrder, isOk: true });

  } catch (err) {
    res.status(400).send(err);
  }
};


exports.otpForgetPasswordRequest = async (req, res) => {
  const { Email } = req.body;

  
    try{
      const check = await UserMaster.findOne({Email:Email}).exec()
      if(!check)
      {
        return res.status(200).json({isOk:false, message:"This Email Is Not Registered"})
      }
      const otp = generateOTP();
    
    await sendForgetPasswordOTPEmail(Email, otp);

    await UserMaster.updateOne({ Email: Email }, { $set: { otp: otp } });



    res.status(200).json({
      isOk: true,
      message: "OTP sent to your email",
      status: 200,
   
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


const sendForgetPasswordOTPEmail = async (email, otp) => {
 
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
      tls: {
        rejectUnauthorized: false, // Allows self-signed certificates (only for development)
      },
    });
    
    const mailOptions = {
      to: email,
      subject: "Reset Your Password for Chanakya Corporate ",
      html: `<html lang="en">

      <head>
      
          <meta charset="UTF-8">
          <style>
              body, table, td, a {
                  -webkit-text-size-adjust: 100%;
                  -ms-text-size-adjust: 100%;
              }
      
              table, td {
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
              }
      
              img {
                  -ms-interpolation-mode: bicubic;
              }
      
              img {
                  border: 0;
                  height: auto;
                  line-height: 100%;
                  outline: none;
                  text-decoration: none;
              }
      
              table {
                  border-collapse: collapse !important;
              }
      
              body {
                  height: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
              }
      
              a[x-apple-data-detectors] {
                  color: inherit !important;
                  text-decoration: none !important;
                  font-size: inherit !important;
                  font-family: inherit !important;
                  font-weight: inherit !important;
                  line-height: inherit !important;
              }
      
              div[style*="margin: 16px 0;"] {
                  margin: 0 !important;
              }
          </style>
      
      
      </head>
      
      <body style="background-color: #f7f5fa; margin: 0 !important; padding: 0 !important;">
      
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                  <td bgcolor="#426899" align="center">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                          <tr>
                              <td align="center" valign="top" style="padding: 20px 10px 10px 10px;">
                                  <div style="display: block; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px;" border="0"><a href="chanakyacorporate.com" style=" color: #ffffff;">chanakyacorporate.com</a></div>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
              <tr>
                  <td bgcolor="#426899" align="center" style="padding: 0px 10px 0px 10px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                          <tr>
                              <td bgcolor="#ffffff" align="center" valign="top" style="padding: 20px 30px 0px 30px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; line-height: inherit;">
                                <img src="https://server.chanakyacorporate.com/uploads/logo.png" />
                              </td>
                          </tr>
      
                           
                      </table>
                  </td>
              </tr>
              <tr>
                  <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                          <tr>
                              <td bgcolor="#ffffff" align="left">
                                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
      
                                      <tr>
                                          <td colspan="2" style="padding-left:30px;padding-right:15px;padding-bottom:10px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: inherit;">
                                              <h5 style="padding:0; margin:0; font-size:14px; font-weight:500;">We received a request to reset your password for your Chanakya Corporate account. If this was you, please the OTP below to reset your password.</h5>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td colspan="2" style="padding-left:30px;padding-right:15px;padding-bottom:10px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: inherit;">
                                              <p style="line-height:24px;">
                                                 Your Otp is : <span style="font-weight:bold"> ${otp}</span>
                                              </p>
                                              <p style="line-height:24px;">
                                               Please keep it confidential and do not share it with anyone.

                                               
                                                </p>

                                          </td>
                                      </tr>
                                     
                                  </table>
                              </td>
                          </tr>
                          <tr>
                        <td bgcolor="#ffffff" align="left">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td bgcolor="#ffffff" align="center" style="padding: 30px 30px 30px 30px; border-top:1px solid #dddddd;">
                                        <table border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="left" style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 25px;">
                                                   
                                                    <p style="margin:0 0 5px;">
                                                         Address : Opp. Pratap Talkies, opp. Sursagar Lake (East), Vadodara, Gujarat 390001, India
 <br />Address : Chanakya The bag Studio, vadivadi, near race course circle, race course road,
 Vadodara, Gujarat, India</p>

                                                    <p style="margin:0 0 5px;">
                                                        Email : <a href="mailto:chanakyathebagstudio@gmail.com" style="color:#000; text-decoration:none;"> chanakyathebagstudio@gmail.com</a> | 
                                                               
                                                    </p>

                                                    <p style="margin:0 0 5px;">
                                                        Contact : <a href="tel: 919974017727" style="color:#000; text-decoration:none;">+91 919974017727 </a> || <a href="tel: :919974017725 " style="color:#000; text-decoration:none;">+91 919974017725  </a>
                                                    </p>

                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                           
                      </table>
                  </td>
              </tr>
              <tr>
                  <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="480">
                          <tr>
                              <td bgcolor="#f4f4f4" align="left" style="padding: 30px 30px 30px 30px; color: #666666; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;">
                                  <p style="margin: 0; font-size:12px;">Design by "<a href="https://barodaweb.com/" target="_blank" style="color: #111111; font-weight: 500; "> Barodaweb The E-Catalogue Designer.</a>".</p>
                              </td>
                          </tr>
                          </table>
                  </td>
              </tr>
          </table>
      
          <script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>
      </body>
      
      </html>
      `,
    };
    
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};

exports.checkOTP=async(req, res)=>{
  try{
    const {email, otp} = req.body
    const data = await UserMaster.findOne({Email:email , otp:otp }).exec()
    if(data)
    {
      return res.status(200).json({isOk:true, message : 'OTP Match successfully' ,data})
    }
    else{
      return res.status(200).json({isOk:false, message:"OTP or Email does not Match"})
    }
  }
  catch(error)
  {
    return res.status(200).json({
      isOk: false,
      message: "An error occurred while checking OTP",
      status: 500,
    });
  }
}