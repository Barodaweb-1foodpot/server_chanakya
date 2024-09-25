const ProductsDetails = require("../../models/Products/ProductsDetails");
const fs = require("fs");

exports.getProductsDetails = async (req, res) => {
  try {
    const find = await ProductsDetails.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createProductsDetails = async (req, res) => {
  try {
    if (!fs.existsSync(`${__basedir}/uploads/Products`)) {
      fs.mkdirSync(`${__basedir}/uploads/Products`);
    }

    let productImage = req.file
      ? `uploads/Products/${req.file.filename}`
      : null;

    let {
      categoryName,
      subCategoryName,
      brandName,
      productName,
      SKU,
      price,
      IsActive,
      isAvailable,
    } = req.body;

    const alreadyExist = await ProductsDetails.findOne({
      SKU: req.body.SKU,
    }).exec();
    console.log(alreadyExist)
    if(alreadyExist)
    {
      return res.status(200).json({message:"SKU already exist ", isOk:false})
    }

    const add = await new ProductsDetails({
      categoryName,
      subCategoryName,
      brandName,
      productImage,
      SKU,
      productName,price,
      IsActive,
      isAvailable,
    }).save();
    res.status(200).json({ isOk: true, data: add, message: "" });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};

exports.listProductsDetails = async (req, res) => {
  try {
    const list = await ProductsDetails.find().sort({ productName: 1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listProductByCategory = async (req, res) => {
  try {
    const list = await ProductsDetails.find({
      categoryName: req.params.categoryId,
      IsActive: true,
    })
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

exports.listProductsDetailsByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { IsActive: IsActive },
      },
      {
        $lookup: {
          from: "categorymasters",
          localField: "categoryName",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subcategorymasters",
          localField: "subCategoryName",
          foreignField: "_id",
          as: "SubCategoryDetail",
        },
      },
      {
        $unwind: {
          path: "$SubCategoryDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "brandmasters",
          localField: "brandName",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: {
          $or: [
            {
              productName: { $regex: match, $options: "i" },
            },
            {
              "category.categoryName": { $regex: match, $options: "i" },
            },
          ],
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

    const list = await ProductsDetails.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateProductsDetails = async (req, res) => {
  try {
    let productImage = req.file
      ? `uploads/Products/${req.file.filename}`
      : null;
    let fieldvalues = { ...req.body };
    if (productImage != null) {
      fieldvalues.productImage = productImage;
    }

    const update = await ProductsDetails.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,

      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeProductsDetails = async (req, res) => {
  try {
    const del = await ProductsDetails.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.CategoryProductList = async (req, res) => {
  try {
    const { option, categoryid } = req.params;

    const list = await ProductsDetails.find({
      categoryName: categoryid,
      IsActive: true,
    })
      .sort({ createdAt: -1 })
      .exec();

    let sortedList;

    switch (option) {
      case "1": // Newest
        sortedList = list;
        break;
      case "2": // Price low to high
        sortedList = list.sort((a, b) => a.price - b.price);
        break;
      case "3": // Price high to low
        sortedList = list.sort((a, b) => b.price - a.price);

        break;
      case "4": // A to Z
        sortedList = list.sort((a, b) =>
          a.productName.localeCompare(b.productName)
        );
        break;
      case "5": // Z to A
        sortedList = list.sort((a, b) =>
          b.productName.localeCompare(a.productName)
        );
        break;
      default:
        // Default sorting, perhaps by createdAt descending
        sortedList = list;
    }

    if (sortedList) {
      res.status(200).json({ isOk: true, data: sortedList, message: "" });
    } else {
      res.status(200).json({ isOk: false, message: "No data Found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
};

exports.brandCount = async (req, res) => {
  let query = [
    {
      $group: {
        _id: "$brandName", 
        count: { $sum: 1 } 
      }
    },
    {
      $lookup: {
        localField: "_id", 
        foreignField: "_id", 
        as: "brandDetails"
      }
    },
    
    
    {
      $sort: { count: -1 }
    }
  ];


  try {
    const result = await ProductsDetails.aggregate(query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching brand counts." });
  }
};



exports.getUniquefilters = async (req, res) => {
  try {
    const uniqueValues = await ProductsDetails.aggregate([
      {
        $group: {
          _id: null,
          uniqueCategoryNames: { $addToSet: "$categoryName" }, // Collect unique category ids
          uniqueSubCategoryNames: { $addToSet: "$subCategoryName" }, // Collect unique subcategory ids
          uniqueBrandNames: { $addToSet: "$brandName" }, // Collect unique brand ids
          uniquePrices: { $addToSet: "$price" }, // Collect unique prices
        }
      },
      {
        $lookup: {
          from: "categorymasters", // Collection name for CategoryMaster
          localField: "uniqueCategoryNames",
          foreignField: "_id",
          as: "categories"
        }
      },
      {
        $lookup: {
          from: "subcategorymasters", // Collection name for SubCategoryMaster
          localField: "uniqueSubCategoryNames",
          foreignField: "_id",
          as: "subCategories"
        }
      },
      {
        $lookup: {
          from: "brandmasters", // Collection name for BrandMaster
          localField: "uniqueBrandNames",
          foreignField: "_id",
          as: "brands"
        }
      },
      {
        $project: {
          _id: 0,
          categories: 1, // Include categories after lookup
          subCategories: 1, // Include subCategories after lookup
          brands: 1, // Include brands after lookup
          uniquePrices: 1
        }
      }
    ]);

    res.status(200).json(uniqueValues);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching unique product details." });
  }
};
