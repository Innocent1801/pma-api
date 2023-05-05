const Payment = require("../models/Payment");
const Users = require("../models/Users");
const Client = require("../models/Client");
const Models = require("../models/Models");
const { verifyTokenAndAuthorization } = require("./jwt");
const Invoice = require("../models/Invoice");

const router = require("express").Router;

// fund wallet
router.post("/fund_wallet", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Client.findOne({ uuid: req.user.id });

    if (user) {
      const newPayment = new Payment({
        sender: user.id,
        senderEmail: user.email,
        amount: req.body.amount,
        desc: "Wallet funding",
      });
      await newPayment.save();
      await user.updateOne({ $set: { wallet: wallet + req.body.amount } });
      res.status(200).json("Payment successful");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// withdraw from account
router.post("/withdraw", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Models.findOne({ uuid: req.user.id });

    if (user) {
      if (user.wallet > req.body.amount) {
        const newInvoice = new Invoice({
          bankName: req.body.bankName,
          accountName: req.body.accountName,
          accountNo: req.body.accountNo,
          amount: req.body.amount,
          withdrawBy: req.user.email,
        });
        await newInvoice.save();
        await user.updateOne({ $set: { wallet: wallet - req.body.amount } });
        res.status(200).json("Payment successful");
      } else {
        res.status(400).json("Your wallet balance is insufficient.");
      }
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// send from account to another account
router.post("/withdraw", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const client = await Client.findOne({ uuid: req.user.id });

    if (client) {
      if (client.wallet > req.body.amount) {
        const user = await Users.findOne({ email: req.body.email });
        const model = await Models.findOne({ uuid: user._id });
        if (model) {
          await model.updateOne({ $set: { wallet: wallet + req.body.amount } });
          await client.updateOne({ $set: { wallet: wallet - req.body.amount } });
          res.status(200).json("Payment successful");
        } else {
          res.status(400).json("Oops! An error occured");
        }
      } else {
        res.status(400).json("Your wallet balance is insufficient.");
      }
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.export = router;
