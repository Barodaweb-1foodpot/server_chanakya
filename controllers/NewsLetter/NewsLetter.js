const NewsLetterMaster = require("../../models/NewsLetter/NewsLetter");
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');


exports.getNewsLetterMaster = async (req, res) => {
  try {
    const find = await NewsLetterMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createNewsLetterMaster = async (req, res) => {
  try {

    let { 
      email,
      IsActive,
    } = req.body;

      const newCategory = new NewsLetterMaster({
        email,IsActive,
      });

      const Category = await newCategory.save();
      
      return res.status(200).json({
        isOk: true,
        data: Category,
        message: "Record created successfully",
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};
 

exports.listNewsLetterMaster = async (req, res) => {
  try {
    const list = await NewsLetterMaster.find({IsActive : true}).sort({ createdAt: 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listNewsLetterMasterByParams = async (req, res) => {
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
                email: { $regex: match, $options: "i" },
              },      
            ],
          },
        },
      ].concat(query);
    }

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

    const list = await NewsLetterMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.updateNewsLetterMaster = async (req, res) => {
  try {
 
    let fieldvalues = { ...req.body };

    const update = await NewsLetterMaster.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,
      { new: true }
    );
    res.json( {isOk: true,
      data: update,
      message: "Record updated successfully",});
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeNewsLetterMaster = async (req, res) => {
  try {
    const del = await NewsLetterMaster.findByIdAndUpdate(req.params._id,  // Find the product by ID
      { IsActive: false },  // Set IsActive to false instead of deleting the product
      { new: true }  // Return the updated document
      );
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.listActiveNewsLetterMaster = async (req , res) => {
  try {
    const list = await NewsLetterMaster.find({IsActive : true}).sort({ createdAt: 1 }).exec();
    res.json(list);
  } catch (err) {
    res.status(400).send(err)
  }
}

async function compressImage(file, uploadDir) {
  const filePath = path.join(uploadDir, file.filename);
  const compressedPath = path.join(uploadDir, `compressed-${file.filename}`);

  try {
    let quality = 80;
    let compressed = false;

    do {
      await sharp(file.path)
        .jpeg({ quality }) // Adjust the quality to reduce the size
        .toFile(compressedPath);

      const { size } = fs.statSync(compressedPath);
      if (size <= 100 * 1024 || quality <= 20) { // Check if size is under 100 KB or quality is too low
        compressed = true;
      } else {
        quality -= 10; // Reduce quality further if size is still too large
      }
    } while (!compressed);

    // Replace the original image with the compressed one
    fs.unlinkSync(filePath);
    fs.renameSync(compressedPath, filePath);

    return `uploads/NewsLetterMaster/${file.filename}`;
  } catch (error) {
    console.log('Error compressing image:', error);
    return null;
  }
}


