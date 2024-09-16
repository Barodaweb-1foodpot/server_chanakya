const BlogsComment = require("../../models/Blogs/BlogComment");
const Blog = require("../../models/Blogs/Blogs");
exports.getBlogsComment = async (req, res) => {
  try {
    const find = await BlogsComment.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createBlogsComment = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const add = await new BlogsComment(req.body).save();
    console.log("add", add);
    const BlogID = add.blogId;
    const id = add._id;
    const blogAdded = await Blog.findOneAndUpdate(
      { _id: BlogID },
      { $addToSet: { comments: id } },
      { new: true }
    );
    console.log("user add", blogAdded);

    // res.json(add);
    res.status(200).json({
      isOk: true,
      message: "blog comment created successfully",
    });
  } catch (err) {
    return res.status(400).json("error in data", err);
  }
};

exports.listBlogsComment = async (req, res) => {
  try {
    const list = await BlogsComment.find().sort({ createdAt: -1 }).exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listBlogsCommentByParams = async (req, res) => {
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
                BlogsComment: { $regex: match, $options: "i" },
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

    const list = await BlogsComment.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateBlogsComment = async (req, res) => {
  try {
    const update = await BlogsComment.findOneAndUpdate(
      { _id: req.params._id },
      req.body,
      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeBlogsComment = async (req, res) => {
  try {
    const del = await BlogsComment.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};
