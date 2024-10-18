const ContactUsInquiry = require("../../models/ContactUsInquiry/ContactUsInquiry");
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');


exports.getContactUsInquiry = async (req, res) => {
    try {
        const find = await ContactUsInquiry.findOne({ _id: req.params._id }).exec();
        res.json(find);
    } catch (error) {
        return res.status(500).send(error);
    }
};

exports.createContactUsInquiry = async (req, res) => {
    try {

        let {
            message,
            subject,
            IsActive,
            contact,
            email_1,
            username
        } = req.body;

        const newCategory = new ContactUsInquiry({
            message,
            subject,
            IsActive,
            contact,
            email_1,
            username
        });

        const Category = await newCategory.save();

        return res.status(200).json({
            isOk: true,
            Category,
            message: "Inquiry created successfully",
        });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};


exports.listContactUsInquiry = async (req, res) => {
    try {
        const list = await ContactUsInquiry.find({ IsActive: true }).sort({ createdAt: -1 }).exec();
        res.json(list);
    } catch (error) {
        return res.status(400).send(error);
    }
};

exports.listContactUsInquiryByParams = async (req, res) => {
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
                                email_1: { $regex: match, $options: "i" },
                            },
                            {
                                username: { $regex: match, $options: "i" },
                            },
                            {
                                contact: { $regex: match, $options: "i" },
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

        const list = await ContactUsInquiry.aggregate(query);

        res.json(list);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

exports.updateContactUsInquiry = async (req, res) => {
    try {
        
        const update = await ContactUsInquiry.findOneAndUpdate(
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

exports.removeContactUsInquiry = async (req, res) => {
    try {
        const del = await ContactUsInquiry.findOneAndRemove({
            _id: req.params._id,
        });
        res.json(del);
    } catch (err) {
        res.status(400).send(err);
    }
};

exports.listActiveClients = async (req, res) => {
    try {
        const list = await ContactUsInquiry.find({ IsActive: true }).sort({ createdAt: -1 }).exec();
        res.json(list);
    } catch (err) {
        res.status(400).send(err)
    }
}

 


