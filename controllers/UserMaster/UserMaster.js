const UserMaster = require("../../models/UserMaster/UserMaster");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const saltRounds = 10;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

exports.getUserMasterDetails = async (req, res) => {
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
    res.status(200).json({ isOk: true, data: add, message: "qwd" });
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
    console.log("ayo ai");
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
   

    const update = await UserMaster.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,

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
    const isMatch = await bcrypt.compare(Password, user.Password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    // Generate a token (assuming createToken is a function you have to create a JWT)
    const token = createToken(user._id);

    // Return success response with the token
    res.json({ success: true, token });
  } catch (error) {
    // Log any errors that occur and send a general error response
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};
