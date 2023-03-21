const router = require("express").Router();
const bcrypt = require("bcrypt");
const Users = require("../models/Users");
const jwt = require("jsonwebtoken");
const Agency = require("../models/Agency");
const Models = require("../models/Models");
const Admin = require("../models/Admin");
const { verifyTokenAndAdmin } = require("./jwt");
const Client = require("../models/Client");

// registration
router.post("/register", async (req, res) => {
  try {
    // encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //   check if user exist
    const findUser = await Users.findOne({ email: req.body.email });

    if (!findUser) {
      const newUser = new Users({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        // username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role,
        mobileNo: req.body.mobileNo,
        referral: req.body.referral,
      });
      await newUser.save();

      const accessToken = jwt.sign(
        {
          id: newUser._id,
          uuid: newUser._id,
          role: newUser.role,
          email: newUser.email,
        },
        process.env.JWT_SEC,
        {
          expiresIn: "30m",
        }
      );
      const { password, ...others } = newUser._doc;

      switch (newUser.role) {
        case "agency":
          const newAgency = new Agency({
            uuid: newUser._id,
            email: newUser.email,
            fullName: newUser.firstName + " " + newUser.lastName,
          });
          await newAgency.save();
          break;

        case "model":
          const newModel = new Models({
            uuid: newUser._id,
            email: newUser.email,
            fullName: newUser.firstName + " " + newUser.lastName,
          });
          await newModel.save();
          break;

        case "client":
          const newClient = new Client({
            uuid: newUser._id,
            email: newUser.email,
          });
          await newClient.save();
          break;

        default:
          await newUser.save();
          break;
      }
      res.status(200).json({ ...others, accessToken });
    } else {
      res.status(400).json("User already exists!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const user = await Users.findOne({ email: req.body.email });
    const agency = await Agency.findOne({ uuid: user?.id });
    const model = await Models.findOne({ uuid: user?.id });
    const client = await Client.findOne({ uuid: user?.id });

    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        const accessToken = jwt.sign(
          { id: user._id, uuid: user._id, role: user.role },
          process.env.JWT_SEC,
          {
            expiresIn: "24h",
          }
        );
        const { password, ...others } = user._doc;
        switch (user.role) {
          case "agency":
            res.status(200).json({ ...others, agency, accessToken });
            break;

          case "model":
            res.status(200).json({ ...others, model, accessToken });
            break;

          default:
            res.status(200).json({ ...others, client, accessToken });
            break;
        }
      } else {
        res.status(400).json("Email or password incorrect");
      }
    } else {
      res.status(400).json("Email or password incorrect");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// admin registration
router.post("/create-pma/admin", verifyTokenAndAdmin, async (req, res) => {
  // encrypt password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  //   check if user exist
  const findUser =
    (await Admin.findOne({ username: req.body.username })) ||
    (await Admin.findOne({ email: req.body.email }));

  try {
    if (!findUser) {
      const newUser = new Admin({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        adminRole: req.body.role,
      });
      await newUser.save();

      res.status(200).json("Registration successful!");
    } else {
      res.status(400).json("User already exists!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// admin login
router.post("/login-pma/admin", async (req, res) => {
  try {
    const user = await Admin.findOne({ email: req.body.email });

    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        const accessToken = jwt.sign(
          { id: user._id, aai: user.aai, role: user.role },
          process.env.JWT_SEC,
          {
            expiresIn: "1h",
          }
        );
        const { password, isAdmin, aai, ...others } = user._doc;
        res.status(200).json({ ...others, accessToken });
      } else {
        res.status(400).json("Email or password incorrect");
      }
    } else {
      res.status(400).json("Email or password incorrect");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
