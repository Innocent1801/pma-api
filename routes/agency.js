const router = require("express").Router();
const Agency = require("../models/Agency");
const Models = require("../models/Models");
const Payment = require("../models/Payment");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization } = require("./jwt");
const notification = require("../services/notifications");

// agency edit
router.put("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const agency = await Agency.findOneAndUpdate(
      { uuid: req.user.uuid },
      { $set: req.body },
      { new: true }
    );

    const user = await Users.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    );

    if (user) {
      await user.updateOne({ $set: { isUpdated: true } });

      res.status(200).json({ ...user._doc, agency });

      await notification.sendNotification({
        notification: {},
        notTitle:
          user.firstName +
          " " +
          user.lastName +
          " just updated their kyc, kindly review.",
        notId: "639dc776aafcd38d67b1e2f7",
        notFrom: user.id,
        role: user.role,
        user: user,
      });
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// get all agencies
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    // filter agency
    const { agency, page } = req.query;
    const keys = ["fullName", "email"];
    const pageSize = 10; // Number of items to return per page

    const search = (data) => {
      return data?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(agency))
      );
    };

    const findAgency = await Agency.find();

    let result = [];
    if (agency) {
      result = search(findAgency);
    } else {
      result = findAgency;
    }

    // Sort results in descending order based on createdAt date
    result.sort((a, b) => b.createdAt - a.createdAt);

    const totalPages = Math.ceil(result.length / pageSize);
    const currentPage = parseInt(page) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const slicedResult = result.slice(startIndex, endIndex);

    const response = {
      totalPages,
      currentPage,
      length: result.length,
      agency: slicedResult,
    };

    if (response.length > 0) {
      res.status(200).json(response);
    } else {
      res.status(404).json("No agency at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get single agency
router.get("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const findAgency = await Agency.findById(req.params.id);

    if (findAgency) {
      res.status(200).json(findAgency);
    } else {
      res.status(404).json("Not found");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// create a model
router.post("/create", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const agency = await Agency.findOne({ uuid: req.user.id });

    if (agency && agency.models.length < 50) {
      const newModel = new Models(req.body);
      await newModel.save();
      await newModel.updateOne({ $set: { uuid: agency.uuid } });
      await agency.updateOne({ $push: { models: newModel.id } });

      res.status(200).json("Registration successful!");
    } else {
      res
        .status(403)
        .json("Oops sorry! You cannot register more than 50 models!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all created models by an agency
router.get("/models/all", verifyTokenAndAuthorization, async (req, res) => {
  try {
    // Pagination parameters
    const { query, page } = req.query;
    const pageSize = 10; // Number of items to return per page

    const agency = await Agency.findOne({ uuid: req.user.id });
    const model = await Models.find({ _id: agency?.models });

    let result = [];
    if (query) {
      result = search(model);
    } else {
      result = model;
    }

    // Sort results in descending order based on createdAt date
    result.sort((a, b) => b.createdAt - a.createdAt);

    const totalPages = Math.ceil(result.length / pageSize);
    const currentPage = parseInt(page) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const slicedResult = result.slice(startIndex, endIndex);

    const response = {
      totalPages,
      currentPage,
      length: result.length,
      model: slicedResult,
    };

    if (model && response?.length > 0) {
      // console.log(model)
      res.status(200).json(response);
    } else {
      res.status(404).json("Model not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// agency edit model portfolio
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const agency = await Agency.findOne({ uuid: req.user.uuid });

    const model = await Models.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (agency && agency.models.includes(model._id)) {
      res.status(200).json(model);
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// agency delete model
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const agency = await Agency.findOne({ uuid: req.user.uuid });

    const model = await Models.findById(req.params.id);

    if (agency && agency.models.includes(model._id)) {
      await Models.findByIdAndDelete(req.params.id);

      res.status(200).json("Account successfully deleted!");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// agency add photo to job photos
router.put(
  "/add_job_photo/:uuid",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const agency = await Agency.findOne({ uuid: req.user.uuid });

      if (agency) {
        await agency.updateOne({
          $push: { jobPhotos: { $each: req.body.jobPhotos } },
        });

        res.status(200).json("Upload successful");
      } else {
        res.status(400).json("Oops! An error occured");
      }
    } catch (err) {
      // console.log(err);
      res.status(500).json("Connection error!");
    }
  }
);

// agency add photos to model portfolio
router.put(
  "/add_model_photo/:id",
  verifyTokenAndAuthorization,
  async (req, res) => {
    const agency = await Agency.findOne({ uuid: req.user.id });
    const model = await Models.findById(req.params.id);

    try {
      if (agency && agency.models.includes(model._id)) {
        if (req.body.photos) {
          await model.updateOne({
            $push: { photos: { $each: req.body.photos } },
          });
        }

        if (req.body.polaroids) {
          await model.updateOne({
            $push: { polaroids: { $each: req.body.polaroids } },
          });
        }

        if (req.body.videos) {
          await model.updateOne({
            $push: { videos: { $each: req.body.videos } },
          });
        }

        res.status(200).json("Photos uploaded");
      } else {
        res.status(400).json("Oops! An error occured");
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

module.exports = router;
