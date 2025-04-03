const CatalogueInquiry = require("../../models/CatalogueInquiry/CatalogueInquiry")
const multer = require("multer");
const path = require('path')
const fs = require('fs')
const sharp = require('sharp'); // Add sharp import
// const ejs = require('ejs');
const handlebars = require('handlebars');
// require('web-streams-polyfill');

exports.createCatalogueInquiry = async (req, res) => {
    try {
        const { categoryName, subCategoryName, startPrice, endPrice, quantity, user, productName ,estimatedDate} = req.body

        let newProducts
        if (typeof productName === 'string') {
            newProducts = productName.split(',').filter(id => id).map(id => id.trim());
            //  Participants=NewParticipants 
        } else if (Array.isArray(productName)) {
            newProducts = productName.filter(id => id).map(id => id.trim());
            // Participants=NewParticipants 
        }

        const add = await new CatalogueInquiry({
            categoryName,
            startPrice,
            subCategoryName,
            endPrice,
            quantity,
            user,
            estimatedDate,
            productName: newProducts
        }).save();

        return res.status(200).json({ isOk: true, data: add, message: "Inquiry added successfully" });
    }
    catch (error) {
        return res.status(500).send(error);
    }

}
const mongoose = require('mongoose');

exports.getCatalogueInquiry = async (req, res) => {
    try {
        const find = await CatalogueInquiry.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(req.params._id) } // Match the document by its _id
            },
            {
                $lookup: {
                    from: 'productdetails', // The collection that contains product details
                    localField: 'productName', // The field in `CatalogueInquiry` that references the product
                    foreignField: '_id', // The field in the `Product` collection to match on
                    as: 'productNameDetails' // Store the result in a new field called `productNameDetails`
                }
            },
            {
                $lookup: {
                    from: 'usermasters',
                    localField: 'user', // Assuming 'user' field contains userId
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $lookup: {
                    from: 'subcategorymasters', // Assuming this is the collection for sub-categories
                    localField: 'subCategoryName',
                    foreignField: '_id',
                    as: 'subCategoryNameDetails'
                }
            },
            {
                $lookup: {
                    from: 'categorymasters', // Assuming the main category collection
                    localField: 'categoryName',
                    foreignField: '_id',
                    as: 'categoryNameDetails'
                }
            }
        ]);

        if (find.length === 0) {
            return res.status(404).json({ message: 'Catalogue inquiry not found' });
        }
        console.log(find)

        // Respond with the aggregated result (only one item expected)
        res.json(find[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Error retrieving data', error });
    }
};




exports.listCatalogueInquiryByParams = async (req, res) => {
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
                $lookup: {
                    from: 'subcategorymasters',
                    localField: 'subCategoryName',
                    foreignField: '_id',
                    as: 'subCategoryDetails'
                }
            },
            {
                $unwind: {
                    path: "$subCategoryDetails",
                    preserveNullAndEmptyArrays: true
                },
            },

            {
                $lookup: {
                    from: 'usermasters',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true
                },
            },
            {
                $match: {
                    $or: [
                        {
                            'categoryDetails.categoryName': { $regex: match, $options: "i" },
                        },
                        {
                            'subCategoryDetails.subCategoryName': { $regex: match, $options: "i" },
                        },
                        {
                            'userDetails.Name': { $regex: match, $options: "i" },
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
        // console.log(JSON.stringify(query));
        const list = await CatalogueInquiry.aggregate(query);

        res.json(list);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};


const ExcelJS = require("exceljs");
exports.excelDownloadforHighestLoyaltyPoint = async (req, res) => {
    try {
      let { startDate, endDate } = req.body;
  
      // Parse startDate and endDate to ISO format
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire day of endDate
  
      // Aggregation pipeline
      const query = [
        {
          $match: {
            createdAt: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $lookup: {
            from: "usermasters", // Collection name for UserMaster
            localField: "user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "categorymasters", // Collection name for CategoryMaster
            localField: "categoryName",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $lookup: {
            from: "subcategorymasters", // Collection name for SubCategoryMaster
            localField: "subCategoryName",
            foreignField: "_id",
            as: "subCategoryDetails",
          },
        },
        {
          $lookup: {
            from: "productdetails", // Collection name for ProductDetails
            localField: "productName",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$categoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$subCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
      ];
  
      const catalogues = await CatalogueInquiry.aggregate(query).allowDiskUse(true);
  
      // Create Excel workbook and worksheet
      let workbook = new ExcelJS.Workbook();
      let worksheet = workbook.addWorksheet("Highest Loyalty catalogues");
  
      // Define columns
      worksheet.columns = [
        { header: "Name", key: "name", width: 20 },
        { header: "Category", key: "categoryName", width: 20 },
        { header: "Sub-Category", key: "subCategoryName", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Contact No", key: "contactNo", width: 15 },
        { header: "Address", key: "address", width: 25 },
        { header: "Product Names", key: "productNames", width: 30 }, // New column for product names
      ];
  
      // Add rows
      catalogues.forEach((catalogue) => {
        // Extract product names as a comma-separated string
        const productNames = (catalogue.productDetails || [])
          .map((product) => product.productName || "N/A")
          .join(", ");
  
        worksheet.addRow({
          name: catalogue.userDetails?.Name || "N/A",
          categoryName: catalogue.categoryDetails?.categoryName || "N/A",
          subCategoryName: catalogue.subCategoryDetails?.subCategoryName || "N/A",
          email: catalogue.userDetails?.Email || "N/A",
          contactNo: catalogue.userDetails?.Mobile || "N/A",
          address: catalogue.userDetails?.companyAddress || "N/A",
          productNames: productNames || "N/A", // Add the product names
        });
      });
  
      // Prepare and send Excel file
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
  
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ isOk: false, error: error.message });
    }
  };
  
  