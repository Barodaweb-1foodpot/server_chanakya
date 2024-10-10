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
                    from: 'subcategorymaster', // Assuming this is the collection for sub-categories
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