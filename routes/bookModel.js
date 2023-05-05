const router = require("express").Router();
const notification = require("../services/notifications");
const Conversation = require("../models/Conversation");
const Client = require("../models/Client");
const Users = require("../models/Users");
const Models = require("../models/Models");
const Agency = require("../models/Agency");
const { verifyTokenAndAuthorization } = require("./jwt");
const BookModel = require("../models/BookModel");

// book model
router.post("/book/:param", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    const model = await Models.findOne({
      $or: [{ uuid: req.params.param }, { _id: req.params.param }],
    });
    // const agency = await Agency.findOne({ uuid: model.uuid });
    const client = await Client.findOne({ uuid: user._id });

    if (user && user.isVerified && user.role === "client") {
      if (model) {
        if (
          client.wallet >= req.body.price &&
          model.minPrice <= req.body.price
        ) {
          const walletBal = client.wallet - client.locked;
          if (
            walletBal <= client.wallet &&
            walletBal >= req.body.price &&
            walletBal >= model.minPrice
          ) {
            const bookModel = new BookModel({
              name: req.body.name,
              country: req.body.country,
              state: req.body.state,
              from: req.body.from,
              to: req.body.to,
              price: req.body.price,
              jobDescription: req.body.jobDescription,
              modelId: model.uuid,
              clientId: user._id,
            });
            await bookModel.save();
            await notification.sendNotification({
              notification: bookModel,
              notTitle: bookModel.name + " requested for your service",
              notId: model.uuid,
            });
            await client.updateOne({
              $set: { locked: client.locked + bookModel.price },
            });
            res.status(200).json("Model booked");
          } else {
            res
              .status(403)
              .json(
                "You cannot proceed with this booking, have booked client(s) that you have not settled their payment."
              );
          }
        } else {
          res
            .status(403)
            .json("Your balance is not sufficient to book this model.");
        }
      } else {
        res.status(400).json("An error occured");
      }
    } else {
      res
        .status(403)
        .json("You do not have permission to perform this action.");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Connection error!");
  }
});

// model accept booked
router.put("/accept/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;
    if (user?.role === "model" || user?.role === "agency") {
      const findBookModel = await BookModel.findById(req.params.id);
      if (findBookModel && !findBookModel.isAccepted) {
        if (!findBookModel.isRejected) {
          const findModel = await Models.findOne({
            uuid: findBookModel.modelId,
          });
          const findClient = await Client.findOne({
            uuid: findBookModel.clientId,
          });
          await findBookModel.updateOne({ $set: { isAccepted: true } });
          const newConversation = new Conversation({
            sender: findBookModel.modelId,
            receiver: findBookModel.clientId,
          });
          await newConversation.save();
          await notification.sendNotification({
            notification: {},
            notTitle:
              findModel.fullName +
              " accepted your request for their service, you both can now start a conversation. Go to conversation page to start a conversation",
            notId: findClient.uuid,
          });
          await findModel.updateOne({
            $push: { acceptedJobs: findBookModel.id },
          });
          res
            .status(200)
            .json(
              "Request accepted! You both can now start a conversation. Go to conversation page to start a conversation"
            );
        } else {
          res
            .status(400)
            .json("Request has been declined already, cannot be accepted.");
        }
      } else {
        res.status(400).json("Request has been accepted!");
      }
    } else {
      res
        .status(403)
        .json("You do not have permission to perform this action.");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Connection error!");
  }
});

// model decline booked
router.put("/decline/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;
    if (user && user.role === "model") {
      const findBookModel = await BookModel.findById(req.params.id);
      if (findBookModel && !findBookModel.isRejected) {
        const findClient = await Client.findOne({
          uuid: findBookModel.clientId,
        });
        const findModel = await Models.findOne({ uuid: findBookModel.modelId });
        if (!findBookModel.isAccepted) {
          await findBookModel.updateOne({ $set: { isRejected: true } });
          if (findClient.locked > 0) {
            await findClient.updateOne({
              $set: { locked: findClient.locked - findBookModel.price },
            });
          }
          await findModel.updateOne({
            $push: { rejectedJobs: findBookModel.id },
          });
          await notification.sendNotification({
            notification: {},
            notTitle:
              findModel.fullName +
              " declined your request for their service, you can go ahead to book another model.",
            notId: findClient.uuid,
          });
          res.status(200).json("Request declined!");
        } else {
          res
            .status(400)
            .json("Request has been accepted already, cannot be declined.");
        }
      } else {
        res.status(400).json("Request has been declined!");
      }
    } else {
      res
        .status(403)
        .json("You do not have permission to perform this action.");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// client mark job done
router.put(
  "/mark_job_done/:id",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const user = req.user;
      if (user && user.role === "client") {
        const findBookModel = await BookModel.findById(req.params.id);
        if (findBookModel && findBookModel.isAccepted) {
          await findBookModel.updateOne({ $set: { isJobDone: true } });
          res
            .status(200)
            .json("Job marked done, thanks for your confirmation.");
        } else {
          res
            .status(400)
            .json(
              "This job has been rejected or not yet accepted, cannot be marked done."
            );
        }
      } else {
        res
          .status(403)
          .json("You do not have permission to perform this action.");
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

// get a booking
router.get("/booking/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      const findBookModel = await BookModel.findById(req.params.id);
      if (findBookModel) {
        res.status(200).json(findBookModel);
      } else {
        res.status(404).json("Booking not found!");
      }
    } else {
      res
        .status(403)
        .json("You do not have permission to perform this action.");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all booking information
router.get("/bookings", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const bookedModel = await BookModel.find();
    // const model = await Models.find({ _id: bookedModel.modelId });
    res.status(200).json(bookedModel);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
