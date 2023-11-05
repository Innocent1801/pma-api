const router = require("express").Router();
const Payment = require("../models/Payment");
const Users = require("../models/Users");
const Client = require("../models/Client");
const Models = require("../models/Models");
const { verifyTokenAndAuthorization } = require("./jwt");
const Invoice = require("../models/Invoice");
const Wallet = require("../models/Wallet");
const bcrypt = require("bcrypt");
const Transfer = require("../models/Transfer");
const Agency = require("../models/Agency");
const notification = require("../services/notifications");
const { PaymentNot } = require("../config/payment.config");
const { WithdrawalNot } = require("../config/withdrawal.config");

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// fund wallet
router.post("/fund_wallet", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Client.findOne({ uuid: req.user.id });

    if (user) {
      const newPayment = new Wallet({
        sender: user.id,
        senderEmail: user.email,
        amount: req.body.amount,
        desc: "Wallet funding",
      });

      await newPayment.save();
      await user.updateOne({ $inc: { wallet: +req.body.amount } });
      await user.updateOne({ $inc: { total: +req.body.amount } });

      res.status(200).json("Payment successful");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get transaction history
router.get("/wallet_history", verifyTokenAndAuthorization, async (req, res) => {
  try {
    // Pagination parameters
    const { query, page } = req.query;
    const pageSize = 10; // Number of items to return per page

    const client = await Client.findOne({ uuid: req.user.id });
    const user = await Users.findById(req.user.id);

    const fundedHistory = await Wallet.find({ sender: client?.id })
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const transferHistory = await Transfer.find({
      $or: [
        { sender: client?.brandName },
        { receiver: user?.username },
        { receiverId: user.id },
      ],
    })
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const withdrawHistory = await Invoice.find({ withdrawBy: user?.email })
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    // Merge the three arrays
    const combinedHistory = [
      ...fundedHistory,
      ...transferHistory,
      ...withdrawHistory,
    ];

    const totalFunded = await Wallet.countDocuments();
    const totalTransfer = await Transfer.countDocuments();
    const totalWithdraw = await Invoice.countDocuments();

    const totalRecords = totalFunded + totalTransfer + totalWithdraw;

    const totalPages = Math.ceil(totalRecords / pageSize);
    const currentPage = parseInt(page) || 1;

    // Sort the combined array by 'createdAt' timestamp in descending order
    combinedHistory.sort((a, b) => b.createdAt - a.createdAt);

    const response = {
      totalPages,
      currentPage,
      length: totalRecords,
      transactions: combinedHistory,
    };

    res.status(200).json(response);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// withdraw from account
router.post("/withdraw", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const model = await Models.findOne({ uuid: req.user.id });
    const user = await Users.findById(model.uuid);
    const agency = await Agency.findOne({ uuid: model?.uuid });

    if (model) {
      if (model.wallet > req.body.amount) {
        if (bcrypt.compareSync(req.body.transactionPin, user.transactionPin)) {
          const newInvoice = new Invoice({
            bankName: req.body.bankName,
            accountName: req.body.accountName,
            accountNo: req.body.accountNo,
            amount: req.body.amount,
            withdrawBy: req.user.email,
          });

          await newInvoice.save();

          await model.updateOne({
            $inc: { wallet: -req.body.amount },
          });

          await model.updateOne({
            $inc: { withdrawn: +req.body.amount },
          });

          if (agency) {
            await agency.updateOne({
              $inc: { wallet: -req.body.amount },
            });

            await agency.updateOne({
              $inc: { withdrawn: +req.body.amount },
            });
          }

          const userObject = { ...user, model };

          await notification.sendNotification({
            notification: {},

            notTitle:
              "Withdrawal request from" + model.fullName
                ? model.fullName
                : agency.fullName +
                  ", kindly check your email for withdrawal details, thanks.",
            notId: "639dc776aafcd38d67b1e2f7",
            notFrom: user.id,
            role: user.role,
            user: userObject,
          });

          const fullName = model.fullName ? model.fullName : agency.fullName;
          const receiverEmail = model.email ? model.email : agency.email;

          WithdrawalNot(
            (from = fullName),
            (email = receiverEmail),
            (amount = newInvoice.amount),
            (bankName = newInvoice.bankName),
            (accountName = newInvoice.accountName),
            (accountNo = newInvoice.accountNo)
          );

          res
            .status(200)
            .json(
              "Withdraw successful, kindly wait for your account to be credited"
            );
        } else {
          res.status(400).json("Invalid pin, try again.");
        }
      } else {
        res.status(400).json("Your wallet balance is insufficient.");
      }
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// send from account to another account
router.post("/transfer", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const client = await Client.findOne({ uuid: req.user.id });
    const currentUser = await Users.findById(client.uuid);

    if (client) {
      if (client.wallet >= req.body.amount) {
        const user = await Users.findOne({ username: req.body.username });

        const model = await Models.findOne({
          $or: [{ uuid: user?._id }, { username: req.body.username }],
        });

        const agency = await Agency.findOne({ uuid: model?.uuid });

        if (model) {
          if (
            bcrypt.compareSync(
              req.body.transactionPin,
              currentUser.transactionPin
            )
          ) {
            await model.updateOne({
              $inc: { wallet: +req.body.amount },
            });

            await model.updateOne({
              $inc: { total: +req.body.amount },
            });

            if (agency) {
              await agency.updateOne({
                $inc: { wallet: +req.body.amount },
              });

              await agency.updateOne({
                $inc: { total: +req.body.amount },
              });
            }

            await client.updateOne({
              $inc: { wallet: -req.body.amount },
            });

            if (client.locked > 0) {
              const newLocked = client.locked - req.body.amount;
              const updatedLocked = newLocked >= 0 ? newLocked : 0;

              await client.updateOne({
                $set: { locked: updatedLocked },
              });
            }

            await client.updateOne({
              $inc: { withdrawn: +req.body.amount },
            });

            const newTransfer = new Transfer({
              sender: client.brandName,
              receiverId: model.uuid,
              receiver: req.body.username,
              amount: req.body.amount,
              remark: req.body.remark,
            });

            await newTransfer.save();

            await notification.sendNotification({
              notification: {},
              notTitle:
                "You just received a payment of NGN" +
                req.body.amount +
                " from " +
                client.brandName,
              notId: model.uuid,
              notFrom: client.id,
              role: currentUser.role,
              user: client,
            });

            const name = model.email ? model.email : agency.email;

            PaymentNot(
              (clientName = client.brandName),
              (modelName = name),
              (amount = newTransfer.amount)
            );

            res.status(200).json("Payment successful");
          } else {
            res.status(400).json("Invalid pin, try again.");
          }
        } else {
          res
            .status(400)
            .json(
              "Oops! The tag input cannot be found, please check and try again."
            );
        }
      } else {
        res.status(400).json("Your wallet balance is insufficient.");
      }
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

// set new/update transaction pin
router.put(
  "/transaction-pin",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      // encrypt transaction pin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.transactionPin, salt);

      const currentUser = await Users.findById(req.user.id);
      if (currentUser.currentTransactionPin) {
        if (
          bcrypt.compareSync(
            req.body.currentTransactionPin,
            currentUser.currentTransactionPin
          )
        ) {
          if (req.body.transactionPin) {
            req.body.transactionPin = hashedPassword;
          }

          const user = await Users.findByIdAndUpdate(
            req.user.id,
            { $set: req.body },
            { new: true }
          );

          await user.updateOne({
            $set: { currentTransactionPin: hashedPassword },
          });

          res.status(200).json(user);
        } else {
          res
            .status(400)
            .json("Current transaction pin is incorrect, try again.");
        }
      } else {
        if (req.body.transactionPin) {
          req.body.transactionPin = hashedPassword;
        }

        const user = await Users.findByIdAndUpdate(
          req.user.id,
          { $set: req.body },
          { new: true }
        );

        await user.updateOne({
          $set: { currentTransactionPin: hashedPassword },
        });

        res.status(200).json(user);
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

module.exports = router;
