const BannerImages = require("../../models/CMS/BannerImages");
const fs = require("fs");

exports.listBannerImages = async (req, res) => {
  try {
    const list = await BannerImages.find().sort({ createdAt: -1 }).exec();
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

exports.createBannerImages = async (req, res) => {
  try {
    if (!fs.existsSync(`${__basedir}/uploads/BannerImg`)) {
      fs.mkdirSync(`${__basedir}/uploads/BannerImg`);
    }

    let bannerImage = req.file
      ? `uploads/BannerImg/${req.file.filename}`
      : null;

    let { Title, keyWord, Description, IsActive } = req.body;

    const add = await new BannerImages({
      Title,
      keyWord,
      Description,
      bannerImage,
      IsActive,
    }).save();
    res.status(200).json({ isOk: true, data: add, message: "" });
  } catch (err) {
    console.log("error", err);
    res.status(500).json({ isOk: false, message: err });
  }
};

exports.listBannerImagesByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { IsActive: IsActive },
      },

      {
        $match: {
          $or: [
            {
              Title: new RegExp(match, "i"),
            },
            {
              keyWord: new RegExp(match, "i"),
            },

            {
              Description: new RegExp(match, "i"),
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

    const list = await BannerImages.aggregate(query);
    res.json(list);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.removeBannerImages = async (req, res) => {
  try {
    const del = await BannerImages.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

exports.getBannerImages = async (req, res) => {
  try {
    const state = await BannerImages.findOne({ _id: req.params._id }).exec();
    res.json(state);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.updateBannerImages = async (req, res) => {
  try {
    let bannerImage = req.file
      ? `uploads/BannerImg/${req.file.filename}`
      : null;
    let fieldvalues = { ...req.body };
    if (bannerImage != null) {
      fieldvalues.bannerImage = bannerImage;
    }
    const update = await BannerImages.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,

      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(500).send(err);
  }
};
