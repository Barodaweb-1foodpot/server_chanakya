const UserReviewSchema=require("../../models/UserReview/UserReview")
exports.createUserReview = async (req, res) => {
  try {
    const { name, address, subject,message } = req.body;
    const addContact = await new UserReviewSchema(req.body).save();
    console.log("create country", addContact);
    res.status(200).json({ isOk: true, data: addContact, message: "" });
  } catch (err) {
    res.status(200).json({ isOk: false, message: "Error creating country" });
  }
};
exports.listUserReviewByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match } = req.body;

    let query = [
      // {
      //   $match: { IsActive: IsActive },
      // },

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
                UserReviewSchema: { $regex: match, $options: "i" },
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

    const list = await UserReviewSchema.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};










