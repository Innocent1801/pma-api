const router = require("express").Router();
const bcrypt = require("bcrypt");
const Agency = require("../models/Agency");
const Models = require("../models/Models");
const Payment = require("../models/Payment");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization } = require("./jwt");

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
      await user.updateOne({ isUpdated: true });
      res.status(200).json({ ...user._doc, agency });
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
    const findAgency = await Users.find({ role: "agency" });
    if (findAgency.length > 0) {
      res.status(200).json(findAgency);
    } else {
      res.status(404).json("No agency at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// create a model
router.post("/create", verifyTokenAndAuthorization, async (req, res) => {
  // agency
  const agency = await Agency.findOne({ uuid: req.user.id });

  // encrypt password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  //   check if user/model exist
  const user =
    (await Users.findOne({ username: req.body.username })) ||
    (await Users.findOne({ email: req.body.email }));

  try {
    if (agency && agency.models.length < 2) {
      if (!user) {
        const newUser = new Users({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          username: req.body.username,
          email: req.body.email,
          password: hashedPassword,
          role: "model",
        });
        await newUser.save();

        const newModel = new Models({
          uuid: newUser._id,
          email: newUser.email,
          fullName: newUser.firstName + " " + newUser.lastName,
        });
        await newModel.save();
        await agency.updateOne({ $push: { models: newModel.id } });

        res.status(200).json("Registration successful!");
      } else {
        res.status(400).json("User already exists");
      }
    } else {
      res
        .status(403)
        .json("Oops sorry! You cannot register more than 50 models!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all created models by an agents
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const agency = await Agency.findOne({ uuid: req.user.id });
    const model = await Models.find({ _id: agency?.models });

    if (model && model?.length > 0) {
      res.status(200).json(model);
    } else {
      res.status(404).json("Model not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// agency edit model portfolio
router.put("/:uuid", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const agency = await Agency.findOne({ uuid: req.user.uuid });

    const model = await Models.findOneAndUpdate(
      { uuid: req.params.uuid },
      { $set: req.body },
      { new: true }
    );
    const user = await Users.findOneAndUpdate(
      { _id: req.params.uuid },
      { $set: req.body },
      { new: true }
    );

    if (agency && agency.models.includes(model._id)) {
      res.status(200).json({ ...user._doc, model });
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// agency add photos to model portfolio
router.post("/:uuid", verifyTokenAndAuthorization, async (req, res) => {
  const agency = await Agency.findOne({ uuid: req.user.id });
  const model = await Models.findOne({ uuid: req.params.uuid });

  try {
    if (agency && agency.models.includes(model._id)) {
      if (req.body.videos) {
        await model.updateOne({ $push: { videos: req.body.photos } });
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

// // agency add photos to job photos
// router.post("/add/job-photos", verifyTokenAndAuthorization, async (req, res) => {
//   try {
//     const agency = await Agency.findOne({ uuid: req.user.id });

//     if (agency) {
//       await agency.updateOne({ $push: { jobPhotos: req.body.jobPhotos } });
//       res.status(200).json("Photo uploaded");
//     } else {
//       res.status(400).json("Oops! An error occured");
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500).json("Connection error!");
//   }
// });

// make payment
router.post("/payment/agency", async (req, res) => {
  try {
    const agency = await Agency.findOne({ uuid: req.body.uuid });
    // console.log(agency)

    if (agency) {
      const newPayment = new Payment({
        sender: agency.uuid,
        amount: req.body.amount,
        desc: "Agency subscription",
      });
      await newPayment.save();
      res.status(200).json("Payment successful");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get payments made
router.get("/payment/agency", verifyTokenAndAuthorization, async (req, res) => {
  const agency = await Agency.findOne({ uuid: req.user.uuid });

  try {
    if (agency) {
      const payment = await Payment.find({ sender: agency.uuid });
      res.status(200).json(payment);
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
