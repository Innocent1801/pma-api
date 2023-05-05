const router = require("express").Router();
const Client = require("../models/Client");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./jwt");

// get all clients
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const findClients = await Users.find({ role: "client" });
    if (findClients.length > 0) {
      res.status(200).json(findClients);
    } else {
      res.status(404).json("No model at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// admin get all clients
router.get("/clients", verifyTokenAndAdmin, async (req, res) => {
  try {
    const findClients = await Client.find();
    if (findClients.length > 0) {
      res.status(200).json(findClients);
    } else {
      res.status(404).json("No model at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// admin get single client
router.get("/client/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const findClient = await Client.findById(req.params.id);
    if (findClient) {
      res.status(200).json(findClient);
    } else {
      res.status(404).json("No model at the moment");
    }
  } catch (err) {
    console.log(err)
    res.status(500).json("Connection error!");
  }
});

// client edit portfolio
router.put("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
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
      res.status(200).json({ ...user._doc, client });
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
