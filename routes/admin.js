const router = require("express").Router();
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const Payment = require("../models/Payment");
const Users = require("../models/Users");
const { verifyTokenAndAdmin } = require("./jwt");
const Client = require("../models/Client");
const Models = require("../models/Models");
const Agency = require("../models/Agency");
const { sendConfirmationEmail } = require("../config/nodemailer.config");
const UserLogin = require("../models/UserLogin");
const Ambssador = require("../models/Ambssador");
const uuid = require("uuid");
const { createAmbassador } = require("../config/newAmbassador");

// get users stat
router.get("/stats", async (req, res) => {
  try {
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

    const data = await Users.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get login stat
router.get("/login/stats", async (req, res) => {
  try {
    const login = await UserLogin.findOne({ _id: "64642190c062e98f1d5ba23e" });
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

    const data = await UserLogin.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          login: 1,
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { loginId: login._id, month: "$month" },
          login: { $sum: "$login" },
        },
      },
      {
        $project: {
          _id: 0,
          loginId: "$_id.loginId",
          month: "$_id.month",
          login: 1,
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json("Connection error!");
  }
});

// edit
router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;
  }

  try {
    const user = await Admin.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// add a user
router.post("/add-user", verifyTokenAndAdmin, async (req, res) => {
  try {
    // encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //   check if user exist
    const findUser = await Users.findOne({ email: req.body.email });

    if (!findUser) {
      const newUser = new Users({
        isSubscribed: true,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role,
        mobileNo: req.body.mobileNo,
        referral: req.body.referral,
      });

      await newUser.save();

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
      res.status(200).json({ ...others });

      sendConfirmationEmail((email = newUser.email));
    } else {
      res.status(400).json("User already exists!");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// edit a user
router.put("/:id/edit-user", verifyTokenAndAdmin, async (req, res) => {
  try {
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      req.body.password = hashedPassword;
    }

    const user = await Users.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (user.role === "model") {
      const model = await Models.findOneAndUpdate(
        { uuid: user._id },
        { $set: req.body },
        { new: true }
      );

      await model.updateOne({
        $set: { fullName: user.firstName + " " + user.lastName },
      });

      await model.updateOne({ $set: { email: user.email } });
    } else if (user.role === "agency") {
      const agency = await Agency.findOneAndUpdate(
        { uuid: user._id },
        { $set: req.body },
        { new: true }
      );

      await agency.updateOne({
        $set: { fullName: user.firstName + " " + user.lastName },
      });

      await agency.updateOne({ $set: { email: user.email } });
    } else if (user.role === "client") {
      const client = await Client.findOneAndUpdate(
        { uuid: user._id },
        { $set: req.body },
        { new: true }
      );
      await client.updateOne({ $set: { email: user.email } });
    }

    res.status(200).json("Data uploaded successfully!");
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all payments made
router.get("/payment/all", verifyTokenAndAdmin, async (req, res) => {
  try {
    // Pagination parameters
    const { query, page } = req.query;
    const pageSize = 10; // Number of items to return per page

    const payment = await Payment.find();

    let result = [];
    if (query) {
      result = search(payment);
    } else {
      result = payment;
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
      payment: slicedResult,
    };

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get single payment
router.get("/payment/:id", verifyTokenAndAdmin, async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  const user = await Users.findOne({ _id: payment?.sender });

  const { password, isVerified, createdAt, updatedAt, _id, ...others } =
    user._doc;

  try {
    if (payment) {
      res.status(200).json({ ...payment._doc, user: others });
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete an agency
router.delete("/agency/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await Agency.findById(req.params.id);

    if (user) {
      await user.delete();
      await Users.findOneAndDelete({ _id: user.uuid });

      res.status(200).json("User deleted!");
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete a model
router.delete("/model/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await Models.findById(req.params.id);

    if (user) {
      await user.delete();
      await Users.findOneAndDelete({ _id: user.uuid });

      res.status(200).json("User deleted!");
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete a client
router.delete("/client/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const user = await Client.findById(req.params.id);

    if (user) {
      await user.delete();
      await Users.findOneAndDelete({ _id: user.uuid });

      res.status(200).json("User deleted!");
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// admin create an ambassador
router.post("/create-ambassador", verifyTokenAndAdmin, async (req, res) => {
  try {
    const ambassador = await Ambssador.findOne({ email: req.body.email });

    const newCode = uuid.v4();

    const slicedCode = newCode.slice(0, 8);

    if (!ambassador) {
      const newAmbassador = new Ambssador({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNo: req.body.phoneNo,
        start: req.body.start,
        end: req.body.end,
        location: req.body.location,
        picture: req.body.picture,
        code: slicedCode,
      });

      await newAmbassador.save();

      res
        .status(200)
        .json(`Ambassador successfully created. Amb code is ${slicedCode}`);

      createAmbassador(
        (ambName = newAmbassador.firstName),
        (code = slicedCode),
        (ambEmail = newAmbassador.email)
      );
    } else {
      res
        .status(400)
        .json(
          "Ambassador with the email already exist, kindly try another email."
        );
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get ambassadors
router.get("/ambassadors/all", verifyTokenAndAdmin, async (req, res) => {
  try {
    const { page } = req.query;
    const pageSize = 20;

    const amb = await Ambssador.find()
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const totalRecords = await Ambssador.countDocuments();

    const totalPages = Math.ceil(totalRecords / pageSize);
    const currentPage = parseInt(page) || 1;

    const response = {
      totalPages,
      currentPage,
      length: totalRecords,
      models: amb,
    };

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// edit amb
router.put("/amb-edit/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const amb = await Ambssador.findById(req.params.id);

    if (amb) {
      const editAmb = await Ambssador.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      res.status(200).json(editAmb);
    } else {
      res.status(404).json("Not found!");
    }
  } catch (error) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
