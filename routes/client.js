const router = require("express").Router();
const Client = require("../models/Client");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./jwt");
const notification = require("../services/notifications");

// get all clients
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    // Pagination parameters
    const { query, page } = req.query;
    const pageSize = 10; // Number of items to return per page

    const findClients = await Users.find({ role: "client" });

    let result = [];
    if (query) {
      result = search(findClients);
    } else {
      result = findClients;
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
      clients: slicedResult,
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

// admin get all clients
router.get("/clients", verifyTokenAndAdmin, async (req, res) => {
  try {
    // filter client
    const { client, page } = req.query;
    const keys = ["email"];
    const pageSize = 10; // Number of items to return per page

    const search = (data) => {
      return data?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(client))
      );
    };

    const findClients = await Client.find();

    let result = [];
    if (client) {
      result = search(findClients);
    } else {
      result = findClients;
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
      clients: slicedResult,
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
    console.log(err);
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
      await user.updateOne({ $set: { isUpdated: true } });

      res.status(200).json({ ...user._doc, client });

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

// client job photos
router.put("/upload-photo", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = Client.findOne({ uuid: req.user.id });

    if (user) {
      await user.updateOne({
        $push: { jobPhotos: { $each: req.body.jobPhotos } },
      });

      res.status(200).json("Upload successful");
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
