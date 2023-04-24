const router = require("express").Router();
const Users = require("../models/Users");
const bcrypt = require("bcrypt");
const { verifyTokenAndAuthorization } = require("./jwt");
const Models = require("../models/Models");
const Agency = require("../models/Agency");
const Client = require("../models/Client");

// get all users
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  const user = await Users.find();
  const model = await Models.find();
  const agency = await Agency.find();
  const client = await Client.find()

  try {
    if (user.length > 0) {
      res.status(200).json(user);
    } else {
      res.status(404).json("No user found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get single user
router.get("/:id", async (req, res) => {
  const user = await Users.findById(req.params.id);
  try {
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// edit
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      req.body.password = hashedPassword;
    }

    const user = await Users.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(user);
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
