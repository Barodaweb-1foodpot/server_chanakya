const BrandMaster = require("../../models/Master/BrandMaster");
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

exports.getBrandMaster = async (req, res) => {
  try {
    const find = await BrandMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.getBrandMasterDetails = async (req, res) => {
  try {
    const find = await BrandMaster.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params._id) }, // Match the document by its _id
      },
      {
        $unwind: { 
          path: "$brandBrochure", 
          preserveNullAndEmptyArrays: true // Handle cases where brandBrochure is empty
        },
      },
      {
        $lookup: {
          from: "categorymasters", // The collection containing CategoryMaster details
          localField: "brandBrochure.categoryName", // Field in brandBrochure that references CategoryMaster
          foreignField: "_id", // Field in CategoryMaster to match against
          as: "brandBrochure.categoryDetails", // Store the lookup result in categoryDetails inside brandBrochure
        },
      },
      {
        $unwind: { 
          path: "$brandBrochure.categoryDetails", 
          preserveNullAndEmptyArrays: true // Handle cases where categoryDetails might be empty
        },
      },
      {
        $group: {
          _id: "$_id", // Group back by the _id of BrandMaster
          brandName: { $first: "$brandName" },
          SrNo: { $first: "$SrNo" },
          logo: { $first: "$logo" },
          IsActive: { $first: "$IsActive" },
          brandBrochure: {
            $push: {
              title: "$brandBrochure.title", // Retain the original title field
              linkdoc: "$brandBrochure.linkdoc", // Retain the original linkdoc field
              categoryDetails: "$brandBrochure.categoryDetails", // Include the categoryDetails from the lookup
            },
          },
        },
      },
      {
        $addFields: {
          brandBrochure: {
            $cond: { 
              if: { $eq: ["$brandBrochure", [{}]] }, 
              then: [], 
              else: "$brandBrochure" 
            } // Ensure empty brandBrochure arrays are returned as []
          },
        },
      },
    ]);
  
    if (find.length === 0) {
      return res.status(404).json({ message: "Brand not found" });
    }
  
    // Respond with the aggregated result (only one item expected)
    res.json(find[0]);
  } catch (error) {
    return res.status(500).send(error);
  }
  
};


exports.createBrandMaster = async (req, res) => {
  try {
    const uploadDir = `${__basedir}/uploads/BrandMaster`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const additionalLinkFiles = {};
    let logo
    req.files.forEach(file => {
      if (file.fieldname === 'logo') {
        logo = `uploads/BrandMaster/${file.filename}`;
      } else if (file.fieldname.startsWith('brandBrochure')) {
        const index = parseInt(file.fieldname.match(/\d+/)[0]);
        additionalLinkFiles[index] = `uploads/BrandMaster/${file.filename}`;
      }
    });

    // let logo = req.file ? await compressImage(req.file, uploadDir) : null;
   
    let { 
      brandName,
      SrNo,
      IsActive,
      brandBrochure,
    } = req.body;

    const extractedObjectsAdditionalLink = brandBrochure ? brandBrochure.map((item, index) => {
      return {
        categoryName: item.categoryName,
        title: item.title,
        linkdoc: additionalLinkFiles[index] || additionalLinkFiles
      };
    }) : [];

      const newCategory = new BrandMaster({
        brandName,
        SrNo,
        IsActive,
        logo : logo,
        brandBrochure: extractedObjectsAdditionalLink,
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
 

exports.listBrandMaster = async (req, res) => {
  try {
    const list = await BrandMaster.find({IsActive : true}).sort({ SrNo: 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listBrandMasterByParams = async (req, res) => {
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
                brandName: { $regex: match, $options: "i" },
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

    const list = await BrandMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.updateBrandMaster = async (req, res) => {
  try {
    let fieldvalues = { ...req.body };

    const additionalLinkFiles = {};
    
    req.files.forEach(file => {
      if (file.fieldname === 'logo') {
        fieldvalues.logo = `uploads/BrandMaster/${file.filename}`;
      } else if (file.fieldname.startsWith('brandBrochure')) {
        const index = parseInt(file.fieldname.match(/\d+/)[0]);
        additionalLinkFiles[index] = `uploads/BrandMaster/${file.filename}`;
      }
    });

    const extractedObjectsAdditionalLink = fieldvalues.brandBrochure ? fieldvalues.brandBrochure.map((item, index) => {
      return {
        categoryName: item.categoryName,
        title: item.title,
        // Ensure linkdoc is either a string or null
        linkdoc: additionalLinkFiles[index] || item.linkdoc || null
      };
    }) : [];

    if (extractedObjectsAdditionalLink) {
      fieldvalues.brandBrochure = extractedObjectsAdditionalLink;
    }

    const update = await BrandMaster.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,
      { new: true }
    );

    res.json({
      isOk: true,
      data: update,
      message: "Record updated successfully",
    });
  } catch (err) {
    res.status(400).send(err);
  }
};


exports.removeBrandMaster = async (req, res) => {
  try {
    const del = await BrandMaster.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.listActiveBrands = async (req , res) => {
  try {
    const list = await BrandMaster.find({IsActive : true}).sort({ SrNo: 1 }).exec();
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

    return `uploads/BrandMaster/${file.filename}`;
  } catch (error) {
    console.log('Error compressing image:', error);
    return null;
  }
}


