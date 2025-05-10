const OfferMaster = require("../../models/Master/OfferMaster");
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');


exports.getOfferMaster = async (req, res) => {
  try {
    const find = await OfferMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createOfferMaster = async (req, res) => {
  try {
    const uploadDir = `${__basedir}/uploads/OfferMaster`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let logo = req.file ? await compressImage(req.file, uploadDir) : null;
   
    let { 
      title,
      desc,
      IsActive,
    } = req.body;

      const newCategory = new OfferMaster({
        title,
        desc,
        IsActive,
        logo : logo,
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
 

exports.listOfferMaster = async (req, res) => {
  try {
    const list = await OfferMaster.find({IsActive : true}).sort({ createdAt: 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listOfferMasterByParams = async (req, res) => {
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
                title: { $regex: match, $options: "i" },
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

    const list = await OfferMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

// exports.updateOfferMaster = async (req, res) => {
//   try {
//     let logo = req.file
//       ? `uploads/OfferMaster/${req.file.filename}`
//       : null;
//     let fieldvalues = { ...req.body };
//     if (logo != null) {
//       fieldvalues.logo = logo;
//     }
   
//     const update = await OfferMaster.findOneAndUpdate(
//       { _id: req.params._id },
//       fieldvalues,
//       { new: true }
//     );
//     res.json( {isOk: true,
//       data: update,
//       message: "Record updated successfully",});
//   } catch (err) {
//     res.status(400).send(err);
//   }
// };


exports.updateOfferMaster = async (req, res) => {
  try {
    const existingOffer = await OfferMaster.findById(req.params._id);
    if (!existingOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    let logo = null;
    if (req.file) {
      logo = `uploads/OfferMaster/${req.file.filename}`;

      // Remove old logo if it exists
      if (existingOffer.logo) {
        const oldLogoPath = path.join(__basedir, 'uploads', 'OfferMaster', path.basename(existingOffer.logo));
        fs.unlink(oldLogoPath, (err) => {
          if (err) {
            console.error('Error deleting old logo:', err.message);
          } else {
            console.log('Old logo deleted:', oldLogoPath);
          }
        });
      }
    }

    let fieldvalues = { ...req.body };
    if (logo != null) {
      fieldvalues.logo = logo;
    }

    const update = await OfferMaster.findOneAndUpdate(
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

exports.removeOfferMaster = async (req, res) => {
  try {
    const del = await OfferMaster.findByIdAndUpdate(req.params._id,  // Find the product by ID
      { IsActive: false },  // Set IsActive to false instead of deleting the product
      { new: true }  // Return the updated document
      );
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.listActiveOfferMaster = async (req , res) => {
  try {
    const list = await OfferMaster.find({IsActive : true}).sort({ createdAt: 1 }).exec();
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

    return `uploads/OfferMaster/${file.filename}`;
  } catch (error) {
    console.log('Error compressing image:', error);
    return null;
  }
}


