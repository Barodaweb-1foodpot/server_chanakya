const SubCategoryMaster = require("../../models/Category/SubCategory");
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { json } = require("express");
const { Console } = require("console");
const SubCategory = require("../../models/Category/SubCategory");

exports.getSubCategoryMaster = async (req, res) => {
  try {
    const find = await SubCategoryMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createSubCategoryMaster = async (req, res) => {
  try {
    const uploadDir = `${__basedir}/uploads/SubCategoryMaster`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let logo = req.file ? await compressImage(req.file, uploadDir) : null;
   
    let { 
      categoryName,
      SrNo,
      subCategoryName,
      IsActive,
    } = req.body;

      const newCategory = new SubCategoryMaster({
        categoryName,
        SrNo,
        IsActive,
        subCategoryName,
        logo : logo,
      });

      const Category = await newCategory.save();
      
      return res.status(200).json({
        isOk: true,
        data: Category,
        message: "Sub Category created successfully",
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};
exports.listActiveCategoriesByCategory = async (req, res) => {
  try {
    console.log("reqq",req.params);
    const list = await SubCategoryMaster.find({IsActive : true, categoryName:req.params} ).sort({ SrNo: 1 }).exec();
    res.json(list);
  } catch (error) {
    Console.log(error);
    return res.status(400).send(error);
  }
};

exports.listSubCategoryMaster = async (req, res) => {
  try {
    const list = await SubCategoryMaster.find({IsActive : true}).sort({ SrNo: 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listSubCategoryMasterByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { IsActive: IsActive },
      },
      {
        $lookup: {
          from: 'categorymasters',
          localField: 'categoryName', 
          foreignField: '_id', 
          as: 'categoryDetails' 
        }
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true
        },
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
                'categoryDetails.categoryName': { $regex: match, $options: "i" },
              },
              {
                subCategoryName: { $regex: match, $options: "i" },
              }      
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
    // console.log(JSON.stringify(query));
    const list = await SubCategoryMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.updateSubCategoryMaster = async (req, res) => {
  try {
    let logo = req.file
      ? `uploads/SubCategoryMaster/${req.file.filename}`
      : null;
    let fieldvalues = { ...req.body };
    if (logo != null) {
      fieldvalues.logo = logo;
    }
   
    const update = await SubCategoryMaster.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,
      { new: true }
    );
    res.json( {isOk: true,
      data: update,
      message: "Sub Category updated successfully",});
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeSubCategoryMaster = async (req, res) => {
  try {
    const del = await SubCategoryMaster.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.getGroupedSubCategory = async (req, res) => {
  try {
    const pipeline = [
      {
        $match: {
          IsActive: true, // Ensure only active subcategories are included
        },
      },
      {
        $group: {
          _id: "$categoryName", // Group by categoryName
          count: { $sum: 1 }, // Count of documents in each group
          subCategories: { $push: "$_id" }, // Collect all subCategoryId values
        },
      },
      {
        $lookup: {
          from: "categorymasters", // Name of the category master collection
          localField: "_id", // The local field used for the lookup (categoryName in this case)
          foreignField: "_id", // The foreign field in categorymaster
          as: "categoryDetails", // Name of the field to store the joined data
        },
      },
      {
        $unwind: "$categoryDetails", // Unwind to access individual category details
      },
      {
        $match: {
          "categoryDetails.IsActive": true, // Ensure only active categories are included
        },
      },
      {
        $lookup: {
          from: "subcategorymasters", // Name of the subcategory master collection
          localField: "subCategories", // The array of subCategoryIds from the previous step
          foreignField: "_id", // The foreign field in subcategorymasters
          as: "subCategoryDetails", // Name of the field to store the joined data
        },
      },
      {
        $project: {
          categoryDetails: 1, // Include all category details
          subCategoryDetails: {
            $filter: {
              input: "$subCategoryDetails", // Filter subcategory details
              as: "subCategory",
              cond: { $eq: ["$$subCategory.IsActive", true] }, // Only include active subcategories
            },
          },
          count: 1, // Include the count field
        },
      },
    ];
  
    const groupedData = await SubCategory.aggregate(pipeline);
  
    res.status(200).json({
      success: true,
      data: groupedData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error while grouping subcategories",
      error: err.message,
    });
  }
  
};

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

    return `uploads/SubCategoryMaster/${file.filename}`;
  } catch (error) {
    console.log('Error compressing image:', error);
    return null;
  }
}

