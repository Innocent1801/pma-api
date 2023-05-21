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
    const findModels = await Users.find({ isUpdated: true });
    const users = findModels.map((item) => item.id);
    const user = await Models.find({ uuid: { $in: users } });
    if (findModels.length > 0) {
      res.status(200).json(user);
    } else {
      res.status(404).json("No model at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// admin get all model
router.get("/models", verifyTokenAndAdmin, async (req, res) => {
  try {
    // filter models
    const { model } = req.query;
    const keys = ["fullName", "email"];

    const search = (data) => {
      return data?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(model))
      );
    };

    const findModels = await Models.find();
    if (model) {
      res.status(200).json(search(findModels));
    } else if (findModels) {
      res.status(200).json(findModels);
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
    const { model } = req.query;
    const keys = ["country", "state"];

    const search = (data) => {
      return data?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(model))
      );
    };

    const user = await Users.find({ isUpdated: true });
    const userIds = user.map((item) => item.id);
    const models = await Models.find({ uuid: { $in: userIds } });
    if (model) {
      res.status(200).json(search(models));
    } else if (models) {
      res.status(200).json(models);
    } else {
      res.status(404).json("No model at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
    console.log(err);
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
      res.status(200).json({ ...user._doc, model });
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
    console.log(err);
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
    console.log(err);
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
    console.log(err);
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
      res.status(200).json("Photo uploaded");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    console.log(err);
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
