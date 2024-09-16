const newProjects=require("../../models/NewProject/NewProjects")

exports.createNewProject = async (req, res) => {
    try {
      // Adjust file paths based on uploaded files
      let newImage = req.file
      ? `uploads/newProjectImages/${req.file.filename}`
      : null;
  
      console.log("New Project Image:", newImage);
  
      // Destructure the rest of the form data from req.body
      let { solarRoofType, capacity, description, shortDescription } = req.body;
  
      console.log("Request Body:", req.body);
  
      // Create a new project with the provided data and file paths
      const newProject = await new newProjects({
        solarRoofType,
        capacity,
        description,
        shortDescription,
        newImage,
      }).save();
  
      res.status(200).json({
        isOk: true,
        data: newProject,
        message: "New project created successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ isOk: false, error: "Internal server error" });
    }
  };


  

  exports.listNewProjectsByParams = async (req, res) => {
    try {
      let { skip, per_page, sorton, sortdir, match } = req.body;
  
      let query = [
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
                  solarRoofType: { $regex: match, $options: "i" },
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
  
      const list = await newProjects.aggregate(query);
  
      res.json(list);
    } catch (error) {
      res.status(500).send(error);
    }
  };
  



  