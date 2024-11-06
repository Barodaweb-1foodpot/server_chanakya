const CategoryMaster = require("../../models/Category/CategoryMaster");
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');


exports.getCategoryMaster = async (req, res) => {
  try {
    const find = await CategoryMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createCategoryMaster = async (req, res) => {
  try {
    const uploadDir = `${__basedir}/uploads/CategoryMaster`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let logo = null;
    let logoBackground = null;
    let additionalLinkFiles = [];

    // Using for...of loop to handle async/await properly
    for (const file of req.files) {
      if (file.fieldname === 'logo') {
        logo = file.filename ? await compressImage(file, uploadDir) : null;
      } else if (file.fieldname === 'logoBackground') {
        logoBackground = file.filename ? await compressImage(file, uploadDir) : null;
      } else if (file.fieldname.startsWith('brandBrochure')) {
        const index = parseInt(file.fieldname.match(/\d+/)[0]);
        additionalLinkFiles[index] = `uploads/BrandMaster/${file.filename}`;
      }
    }

    let { categoryName, SrNo, IsActive } = req.body;

    const newCategory = new CategoryMaster({
      categoryName,
      SrNo,
      IsActive,
      logo: logo, // Using the processed logo
      logoBackground: logoBackground, // Adding logoBackground if needed
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


exports.listCategoryMaster = async (req, res) => {
  try {
    const list = await CategoryMaster.find({IsActive : true}).sort({ SrNo: 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listCategoryMasterByParams = async (req, res) => {
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
                categoryName: { $regex: match, $options: "i" },
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

    const list = await CategoryMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.updateCategoryMaster = async (req, res) => {
  try {
    const uploadDir = `${__basedir}/uploads/CategoryMaster`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    
    let fieldvalues = { ...req.body };
    let logo = null;
    let logoBackground = null;

    // Check for multiple files (logo and logoBackground) in the request
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log(file)
        if (file.fieldname === 'logo') {
          logo = file.filename ? await compressImage(file, uploadDir) : null;
        } else if (file.fieldname === 'logoBackground') {
          logoBackground = file.filename ? await compressImage(file, uploadDir) : null;
          console.log(logoBackground)
        }
      }
    }
    console.log(logoBackground)

    // Only update logo if a new logo is provided
    if (logo) {
      fieldvalues.logo = logo;
    }

    // Only update logoBackground if a new logoBackground is provided
    if (logoBackground) {
      fieldvalues.logoBackground = logoBackground;
    }
    console.log(fieldvalues)
    // Find the category by _id and update it with the new field values
    const update = await CategoryMaster.findOneAndUpdate(
      { _id: req.params._id },
      { $set: fieldvalues },  // Use $set to only update provided fields
      { new: true }  // Return the updated document
    );

    // Send response with the updated category
    res.json({
      isOk: true,
      data: update,
      message: "Record updated successfully",
    });
  } catch (err) {
    // Send error response in case of failure
    res.status(400).send(err);
  }
};



exports.removeCategoryMaster = async (req, res) => {
  try {
    // Find the category by ID
    const category = await CategoryMaster.findById(req.params._id);

    // Check if the category exists
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // If IsActive is true, set it to false
    if (category.IsActive) {
      category.IsActive = false;
      await category.save(); // Save the updated document
      return res.json({ message: "Category deactivated", category });
    }

    // If IsActive is already false, remove the document
    const deletedCategory = await CategoryMaster.findByIdAndRemove(req.params._id);
    res.json({ message: "Category removed", deletedCategory });
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.listActiveCategories = async (req , res) => {
  try {
    const list = await CategoryMaster.find({IsActive : true}).sort({ SrNo: 1 }).exec();
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

    return `uploads/CategoryMaster/${file.filename}`;
  } catch (error) {
    console.log('Error compressing image:', error);
    return null;
  }
}


