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
          preserveNullAndEmptyArrays: true, // Handle cases where brandBrochure is empty
        },
      },
      {
        $lookup: {
          from: "categorymasters", // The collection containing CategoryMaster details
          localField: "brandBrochure.categoryName", // Field in brandBrochure that references CategoryMaster
          foreignField: "_id", // Field in CategoryMaster to match against
          as: "categoryDetails", // Store the lookup result directly as categoryDetails
        },
      },
      {
        $addFields: {
          "brandBrochure.categoryDetails": {
            $cond: {
              if: { $gt: [{ $size: "$categoryDetails" }, 0] }, // Check if categoryDetails exists
              then: "$categoryDetails", // Add categoryDetails if it exists
              else: null, // Otherwise set to null
            },
          },
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
              $cond: {
                if: { $eq: ["$brandBrochure.categoryDetails", null] }, // Check if categoryDetails is null
                then: null, // If null, set brandBrochure to null
                else: "$brandBrochure", // Otherwise, include the brandBrochure
              },
            },
          },
        },
      },
      {
        $addFields: {
          brandBrochure: {
            $filter: {
              input: "$brandBrochure", // Filter the array
              as: "brochure",
              cond: { $ne: ["$$brochure", null] }, // Remove null values
            },
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
      logo: logo,
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
    const list = await BrandMaster.find({ IsActive: true }).sort({ SrNo: 1 }).exec();
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

// exports.updateBrandMaster = async (req, res) => {
//   try {
//     let fieldvalues = { ...req.body };

//     const additionalLinkFiles = {};

//     req.files.forEach(file => {
//       if (file.fieldname === 'logo') {
//         fieldvalues.logo = `uploads/BrandMaster/${file.filename}`;
//       } else if (file.fieldname.startsWith('brandBrochure')) {
//         const index = parseInt(file.fieldname.match(/\d+/)[0]);
//         additionalLinkFiles[index] = `uploads/BrandMaster/${file.filename}`;
//       }
//     });
//     console.log(fieldvalues.brandBrochure)
//     const extractedObjectsAdditionalLink = fieldvalues.brandBrochure ? fieldvalues.brandBrochure.map((item, index) => {
//       console.log("---------------", item.categoryName.split(","))
//       return {
//         categoryName: item.categoryName.split(","),
//         title: item.title,
//         // Ensure linkdoc is either a string or null
//         linkdoc: additionalLinkFiles[index] || item.linkdoc || null
//       };
//     }) : [];
//     console.log(extractedObjectsAdditionalLink)
//     if (extractedObjectsAdditionalLink) {
//       fieldvalues.brandBrochure = extractedObjectsAdditionalLink;
//     }

//     const update = await BrandMaster.findOneAndUpdate(
//       { _id: req.params._id },
//       fieldvalues,
//       { new: true }
//     );

//     res.json({
//       isOk: true,
//       data: update,
//       message: "Record updated successfully",
//     });
//   } catch (err) {
//     res.status(400).send(err);
//   }
// };

exports.updateBrandMaster = async (req, res) => {
  try {
    const existingBrand = await BrandMaster.findById(req.params._id);
    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    let fieldvalues = { ...req.body };
    const additionalLinkFiles = {};

    req.files.forEach(file => {
      if (file.fieldname === 'logo') {
        // Delete old logo if it exists
        if (existingBrand.logo) {
          const oldLogoPath = path.join(__basedir, 'uploads', 'BrandMaster', path.basename(existingBrand.logo));
          fs.unlink(oldLogoPath, (err) => {
            if (err) console.error('Error deleting old logo:', err.message);
            else console.log('Old logo deleted:', oldLogoPath);
          });
        }

        fieldvalues.logo = `uploads/BrandMaster/${file.filename}`;
      } else if (file.fieldname.startsWith('brandBrochure')) {
        const index = parseInt(file.fieldname.match(/\d+/)[0]);
        additionalLinkFiles[index] = `uploads/BrandMaster/${file.filename}`;

        // Delete old brochure if it exists
        const oldBrochure = existingBrand.brandBrochure?.[index]?.linkdoc;
        if (oldBrochure) {
          const oldBrochurePath = path.join(__basedir, 'uploads', 'BrandMaster', path.basename(oldBrochure));
          fs.unlink(oldBrochurePath, (err) => {
            if (err) console.error('Error deleting old brochure PDF:', err.message);
            else console.log('Old brochure PDF deleted:', oldBrochurePath);
          });
        }
      }
    });

    const extractedObjectsAdditionalLink = fieldvalues.brandBrochure
      ? fieldvalues.brandBrochure.map((item, index) => {
          return {
            categoryName: item.categoryName.split(','),
            title: item.title,
            linkdoc: additionalLinkFiles[index] || item.linkdoc || null
          };
        })
      : [];

    if (extractedObjectsAdditionalLink.length > 0) {
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
    // Find the category by ID
    const category = await BrandMaster.findById(req.params._id);

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
    const deletedCategory = await BrandMaster.findByIdAndRemove(req.params._id);
    res.json({ message: "Category removed", deletedCategory });
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.listActiveBrands = async (req, res) => {
  try {
    const list = await BrandMaster.find({ IsActive: true }).sort({ SrNo: 1 }).exec();
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


