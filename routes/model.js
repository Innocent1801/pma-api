const router = require("express").Router();
const BookModel = require("../models/BookModel");
const Models = require("../models/Models");
const Users = require("../models/Users");
const notification = require("../services/notifications");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./jwt");

// get model's visitors stat
router.get("/stats", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Models.findOne({ uuid: req.user.id });
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

    const data = await Models.aggregate([
      { $match: { uuid: user.uuid, createdAt: { $gte: lastYear } } },
      {
        $project: {
          visitors: 1,
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { userId: user.uuid, month: "$month" },
          visitors: { $sum: "$visitors" },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id.userId",
          month: "$_id.month",
          visitors: 1,
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json("Connection error!");
  }
});

// get all model
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    // Pagination parameters
    const { query, page } = req.query;
    const keys = ["country", "state", "gender"];
    const pageSize = 10; // Number of items to return per page

    const search = (items) => {
      return items?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(query))
      );
    };

    const findModels = await Users.find({ isUpdated: true });

    const userUuids = findModels.map((item) => item.id);

    const models = await Models.find({ uuid: { $in: userUuids } })
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const totalRecords = await Models.countDocuments({
      uuid: { $in: userUuids },
    });

    const totalPages = Math.ceil(totalRecords / pageSize);
    const currentPage = parseInt(page) || 1;

    let result = models;
    if (query) {
      result = search(models);
    } else {
      result = models;
    }

    const response = {
      totalPages,
      currentPage,
      length: totalRecords,
      models: result,
    };

    res.status(200).json(response);
  } catch (err) {
    // console.error(err);
    res.status(500).json("Connection error!");
  }
});

// admin get all model
router.get("/models", verifyTokenAndAdmin, async (req, res) => {
  try {
    // filter models
    const { model, page } = req.query;
    const keys = ["fullName", "email"];
    const pageSize = 10; // Number of items to return per page

    const search = (items) => {
      return items?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(query))
      );
    };

    const findModels = await Models.find()
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const totalRecords = await Models.countDocuments();

    let result = [];
    if (model) {
      result = search(findModels);
    } else {
      result = findModels;
    }

    const response = {
      totalPages,
      currentPage,
      length: totalRecords,
      models: result,
    };

    if (response.length > 0) {
      res.status(200).json(response);
    } else {
      res.status(404).json("No model at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all model without authorization
router.get("/find/models", async (req, res) => {
  try {
    // filter models
    const { model, page } = req.query;
    const keys = ["country", "state"];
    const pageSize = 10; // Number of items to return per page

    const search = (data) => {
      return data?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(model))
      );
    };

    const user = await Users.find({ isUpdated: true });
    const userIds = user.map((item) => item.id);
    const models = await Models.find({ uuid: { $in: userIds } });

    let result = [];
    if (model) {
      result = search(models);
    } else {
      result = models;
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
      models: slicedResult,
    };

    if (response.length > 0) {
      res.status(200).json(response);
    } else {
      res.status(404).json("No model at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
    // console.log(err);
  }
});

// get singular model
router.get("/:param", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const loggedUser = await Users.findById(req.user.id);

    const model = await Models.findOne({
      $or: [{ uuid: req.params.param }, { _id: req.params.param }],
    });

    const user = await Users.findOne({ _id: model.uuid });

    if (user) {
      if (user.id !== req.user.id) {
        await model.updateOne({ $set: { visitors: model.visitors + 1 } });

        // await notification.sendNotification({
        //   notification: {},
        //   notTitle:
        //     loggedUser.firstName +
        //     " " +
        //     loggedUser.lastName +
        //     " viewed your portfolio.",
        //   notId: model.uuid,
        //   notFrom: loggedUser.id,
        // });
      }

      res.status(200).json({ ...user._doc, model });
    } else if (!user) {
      await model.updateOne({ $set: { visitors: visitors + 1 } });

      await notification.sendNotification({
        notification: {},

        notTitle:
          loggedUser.firstName +
          " " +
          loggedUser.lastName +
          " viewed your portfolio.",
        notId: model.uuid,
        notFrom: loggedUser.id,
      });

      res.status(200).json({ model });
    } else {
      res.status(404).json("Model not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get singular model without authentication
router.get("/model/:param", async (req, res) => {
  try {
    const model = await Models.findOne({
      $or: [{ uuid: req.params.param }, { _id: req.params.param }],
    });

    const user = await Users.findOne({ _id: model.uuid });

    if (user) {
      await model.updateOne({ $set: { visitors: model.visitors + 1 } });
      await notification.sendNotification({
        notification: {},
        notTitle: "Someone viewed your portfolio.",
        notId: model.uuid,
        notFrom: "",
      });

      res.status(200).json({ ...user._doc, model });
    } else if (!user) {
      await model.updateOne({ $set: { visitors: visitors + 1 } });

      await notification.sendNotification({
        notification: {},
        notTitle: "Someone viewed your portfolio.",
        notId: model.uuid,
        notFrom: "",
      });

      res.status(200).json({ model });
    } else {
      res.status(404).json("Model not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// model edit portfolio
router.put("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const model = await Models.findOneAndUpdate(
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

      const { password, ...others } = user._doc;

      res.status(200).json({ ...others, model });

      await notification.sendNotification({
        notification: {},

        notTitle:
          user.firstName +
          " " +
          user.lastName +
          " just updated their kyc, kindly review.",
        notId: "639dc776aafcd38d67b1e2f7",
        notFrom: user.id,
      });
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// model activate feature
router.put("/feature/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const model = await Models.findById(req.params.id);

    if (model) {
      await model.updateOne({ $set: { isFeatured: true } });

      res.status(200).json(model);
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// model deactivate feature
router.put("/unfeature/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const model = await Models.findById(req.params.id);

    if (model) {
      await model.updateOne({ $set: { isFeatured: false } });

      res.status(200).json(model);
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// model add photos to portfolio
router.put("/upload-photo", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const model = await Models.findOne({ uuid: req.user.uuid });

    if (model) {
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
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// model remove photos from portfolio
router.put("/remove/photo", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const model = await Models.findOne({ uuid: req.user.uuid });

    if (model) {
      if (req.body.photo) {
        await model.updateOne({ $pull: { photos: req.body.photo } });
        await model.updateOne({ $pull: { polaroids: req.body.photo } });
        await model.updateOne({ $pull: { videos: req.body.photo } });
      }

      res.status(200).json("Photo deleted!");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
