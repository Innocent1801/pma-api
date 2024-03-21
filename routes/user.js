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
    // filter users
    const { user, page } = req.query;
    const keys = ["email"];

    const pageSize = 10; // Number of items to return per page

    const search = (data) => {
      return data?.filter((item) =>
        keys.some((key) => item[key]?.toLowerCase()?.includes(user))
      );
    };

    const users = await Users.find();

    let result = [];
    if (query) {
      result = search(users);
    } else {
      result = users;
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
      users: slicedResult,
    };

    if (response.length > 0) {
      res.status(200).json(response);
    } else {
      res.status(404).json("No user found!");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// get single user
router.get("/user/:id", async (req, res) => {
  try {
    const user = await Users.findById(req.params.id);

    const { password, transactionPin, currentTransactionPin, ...others } =
      user._doc;

    if (user) {
      res.status(200).json({ ...others });
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// by role
router.get("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.params.id);

    const { password, transactionPin, currentTransactionPin, ...others } =
      user._doc;

    if (user) {
      if (user.role === "model") {
        const model = await Models.findOne({ uuid: req.params.id });

        res.status(200).json({ ...others, model });
      } else if (user.role === "agency") {
        const agency = await Agency.findOne({ uuid: req.params.id });

        res.status(200).json({ ...others, agency });
      } else if (user.role === "client") {
        const client = await Client.findOne({ uuid: req.params.id });

        res.status(200).json({ ...others, client });
      }
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

// edit password
router.put("/:id/password", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (bcrypt.compareSync(req.body.currentPassword, user.password)) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      req.body.password = hashedPassword;

      const user = await Users.findByIdAndUpdate(
        req.user.id,
        { $set: req.body },
        { new: true }
      );

      res.status(200).json(user);
    } else {
      res.status(400).json("Current password does not match");
    }
  } catch (err) {
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

router.post("/account/delete", async (req, res) => {
  try {
    const user = await Users.findOne({ email: req.body.email });

    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        if (user.role === "client") {
          await Client.findOneAndDelete({ uuid: user._id });

          await user.delete();

          res.status(200).json("Account deleted successfully!");
        } else if (user.role === "model") {
          await Models.findOneAndDelete({ uuid: user._id });

          await user.delete();

          res.status(200).json("Account deleted successfully!");
        } else if (user.role === "agency") {
          await Agency.findOneAndDelete({ uuid: user._id });

          await user.delete();

          res.status(200).json("Account deleted successfully!");
        } else {
          await user.delete();

          res.status(200).json("Account deleted successfully!");
        }
      } else {
        res.status(400).json("Password does not match with account.");
      }
    } else {
      res.status(404).json("Account not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
