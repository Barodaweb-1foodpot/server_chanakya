const CompanyLocation = require("../../models/Location/Location");
const fs = require("fs");

exports.listLocation = async (req, res) => {
  try {
    const list = await CompanyLocation.find().sort({ createdAt: -1 }).exec();
    res.json(list);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

exports.createLocation = async (req, res) => {
  try {
    if (!fs.existsSync(`${__basedir}/uploads/StoreLogo`)) {
      fs.mkdirSync(`${__basedir}/uploads/StoreLogo`);
    }

    let StoreLogo = req.file ? `uploads/StoreLogo/${req.file.filename}` : null;

    let {
      CityID,
      StateID,
      CountryID,
      Area,
      Address,
      Location,
      latitude,
      longitude,
      IsActive,
    } = req.body;


    const add = await new CompanyLocation({
      CityID,
      StateID,
      CountryID,
      StoreLogo,
      Area,
      Address,
      Location,
      latitude,
      longitude,
      IsActive,
    }).save();
    res.status(200).json({ isOk: true, data: add, message: "" });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ isOk: false, message: err});
  }
};

exports.listLocationByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let query = [
      {
        $match: { IsActive: isActive },
      },
      {
        $lookup: {
          from: "countries",
          localField: "CountryID",
          foreignField: "_id",
          as: "countryname",
        },
      },
      {
        $unwind: {
          path: "$countryname",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          countryname: "$countryname.CountryName",
        },
      },
      {
        $lookup: {
          from: "states",
          localField: "StateID",
          foreignField: "_id",
          as: "statename",
        },
      },
      {
        $unwind: {
          path: "$statename",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          statename: "$statename.StateName",
        },
      },

      {
        $match: {
          $or: [
            {
              Area: new RegExp(match, "i"),
            },
            {
              Address: new RegExp(match, "i"),
            },

            {
              Location: new RegExp(match, "i"),
            },
            {
              countryname: new RegExp(match, "i"),
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

    const list = await CompanyLocation.aggregate(query);
    res.json(list);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.removeLocation = async (req, res) => {
  try {
    const del = await CompanyLocation.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

exports.getLocation = async (req, res) => {
  try {
    const state = await CompanyLocation.findOne({ _id: req.params._id }).exec();
    res.json(state);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.updateLocation = async (req, res) => {
  try {
    let StoreLogo = req.file ? `uploads/StoreLogo/${req.file.filename}` : null;
    let fieldvalues = { ...req.body };
    if (StoreLogo != null) {
      fieldvalues.StoreLogo = StoreLogo;
    }
    const update = await CompanyLocation.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,

      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.findLocation = async (req, res) => {
  try {
    const find = await CompanyLocation.find({
      CountryID: req.params.country,
      CityID: req.params.city,
    }).exec();
    res.json(find);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};


