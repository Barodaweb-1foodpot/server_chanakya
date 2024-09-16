const PromocodeMaster = require("../../models/Products/PromocodeMaster");

exports.getPromocodeMaster = async (req, res) => {
  try {
    const find = await PromocodeMaster.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createPromocodeMaster = async (req, res) => {
  try {
    const add = await new PromocodeMaster(req.body).save();
    res.json(add);
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.listPromocodeMaster = async (req, res) => {
  try {
    const list = await PromocodeMaster.find().sort({ createdAt: -1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listActivePromocodeMaster = async (req, res) => {
  try {
    const list = await PromocodeMaster.find({ IsActive: true })
      .sort({ createdAt: -1 })
      .exec();
    if (list) {
      res
        .status(200)
        .json({ isOk: true, data: list, message: "Active Promocode List" });
    } else {
      res.status(400).json({ isOk: false, message: "No Data Found" });
    }
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listPromocodeMasterByParams = async (req, res) => {
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
                PromocodeMaster: { $regex: match, $options: "i" },
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

    const list = await PromocodeMaster.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updatePromocodeMaster = async (req, res) => {
  try {
    const update = await PromocodeMaster.findOneAndUpdate(
      { _id: req.params._id },
      req.body,
      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removePromocodeMaster = async (req, res) => {
  try {
    const del = await PromocodeMaster.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};
