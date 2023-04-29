const router = require("express").Router();
const BookModel = require("../models/BookModel");
const Models = require("../models/Models");
const Post = require("../models/Post");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./jwt");

// book model
router.post("/:uuid", verifyTokenAndAuthorization, async (req, res) => {
  const user = await Users.findById(req.user.id);
  const model = await Models.findOne({ uuid: req.params.uuid });
  try {
    if (user && user.isVerified) {
      if (model) {
        const bookModel = new BookModel({
          name: req.body.name,
          country: req.body.country,
          state: req.body.state,
          from: req.body.from,
          to: req.body.to,
          price: req.body.price,
          jobDescription: req.body.jobDescription,
          modelId: model.uuid,
          clientId: user._id,
        });
        await bookModel.save();
        res.status(200).json("Model booked");
      } else {
        res.status(400).json("An error occured");
      }
    } else {
      res.status(400).json("User needs to be verified before proceeding");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all model
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const findModels = await Users.find({ role: "model" });
    if (findModels.length > 0) {
      res.status(200).json(findModels);
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
    const findModels = await Models.find();
    if (findModels.length > 0) {
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

    const models = await Models.find({ isVerified: true });
    if (model.length > 0) {
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

// get all booked model
router.get("/booked-models", verifyTokenAndAuthorization, async (req, res) => {
  const bookedModel = await BookModel.find();
  // const model = await Models.find({ _id: bookedModel.modelId });
  try {
    res.status(200).json(bookedModel);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get singular model
router.get("/:param", async (req, res) => {
  try {
    const model = await Models.findOne({
      $or: [{ uuid: req.params.param }, { _id: req.params.param }],
    });
    const user = await Users.findOne({ _id: model.uuid });

    if (user) {
      res.status(200).json({ ...user._doc, model });
    } else if (!user) {
      res.status(200).json({ model });
    } else {
      res.status(404).json("Model not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});
// get singular model
router.get("/model/:id", async (req, res) => {
  try {
    const model = await Models.findById(req.params.id);
    if (model) {
      res.status(200).json(model);
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
      await user.updateOne({ isUpdated: true });
      res.status(200).json({ ...user._doc, model });
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
router.post("/upload-photo", verifyTokenAndAuthorization, async (req, res) => {
  const model = await Models.findOne({ uuid: req.user.uuid });

  try {
    if (model) {
      if (req.body.videos) {
        await model.updateOne({ $push: { videos: req.body.videos } });
      } else {
        await model.updateOne({ $push: { photos: req.body.photos } });
      }
      res.status(200).json("Photo uploaded");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
