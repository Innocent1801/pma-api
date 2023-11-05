const router = require("express").Router();
const BookModel = require("../models/BookModel");
const Notification = require("../models/Notification");
const { verifyTokenAndAuthorization } = require("./jwt");

// get notifications of a user
router.get("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;

    const { query, page } = req.query;
    const pageSize = 20;

    const notifications = await Notification.find({ notId: req.params.id })
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const totalRecords = await Notification.countDocuments({
      notId: req.params.id,
    });

    const totalPages = Math.ceil(totalRecords / pageSize);
    const currentPage = parseInt(page) || 1;

    const response = {
      totalPages,
      currentPage,
      length: totalRecords,
      notifications: notifications,
    };

    if (user.id === req.params.id) {
      res.status(200).json(response);
    } else {
      res
        .status(403)
        .json("You do not have permission to perform this action.");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get single notification
router.get("/single-not/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;
    const notifications = await Notification.findById(req.params.id);

    if (user.id === notifications.notId) {
      await notifications.updateOne({ $set: { isRead: true } });

      res.status(200).json(notifications);
    } else {
      res
        .status(403)
        .json("You do not have permission to perform this action.");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete a notifications
router.delete("/delete/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;
    const notification = await Notification.findById(req.params.id);

    if (notification) {
      if (user.id === notification.notId) {
        const bookId = notification?.notification?._id.toString();

        if (bookId) {
          const findBookModel = await BookModel.findById(bookId);

          if (findBookModel) {
            if (findBookModel.isAccepted || findBookModel.isRejected) {
              notification.delete();

              res.status(200).json("Notification removed");
            } else {
              res
                .status(400)
                .json(
                  "Accept or reject job request before you proceed with this action"
                );
            }
          }
        } else {
          notification.delete();
          res.status(200).json("Notification removed");
        }
      } else {
        res
          .status(403)
          .json("You do not have permission to perform this action.");
      }
    } else {
      res.status(404).json("Notification cannot be found");
    }
  } catch (err) {
    // console.log(err);
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
