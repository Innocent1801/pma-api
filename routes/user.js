const router = require("express").Router();
const Users = require("../models/Users");
const bcrypt = require("bcrypt");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./jwt");
const Models = require("../models/Models");
const Agency = require("../models/Agency");
const Client = require("../models/Client");

// get all users
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.find();
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
  try {
    const user = await Users.findById(req.params.id);
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

// delete a user
router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await Users.findById(req.params.id);
    if (user.role === "client") {
      await user.delete();
      await Client.findOneAndDelete({ uuid: user._id });
      res.status(200).json("User deleted!");
    } else if (user.role === "model") {
      await user.delete();
      await Models.findOneAndDelete({ uuid: user._id });
      res.status(200).json("User deleted!");
    } else if (user.role === "agency") {
      await user.delete();
      await Agency.findOneAndDelete({ uuid: user._id });
      res.status(200).json("User deleted!");
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
