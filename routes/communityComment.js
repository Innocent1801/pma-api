const router = require("express").Router();
const Client = require("../models/Client");
const Community = require("../models/Community");
const CommunityComment = require("../models/CommunityComment");
const Models = require("../models/Models");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization } = require("./jwt");
const notification = require("../services/notifications");

// comment on a post
router.post("/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const post = await Community.findById(req.params.id);

      const model = await Models.findOne({ uuid: user.id });
      const client = await Client.findOne({ uuid: user.id });

      const {
        password,
        transactionPin,
        currentTransactionPin,
        recovery,
        exp,
        ...others
      } = user._doc;

      if (post) {
        const newComment = new CommunityComment({
          comment: req.body.comment,
          user: user.role === "model" ? model : { ...others, client },
          post: post.id,
          userRole: user.role,
          userId: user.id,
        });

        await notification.sendNotification({
          notification: {},
          notTitle:
            user.firstName + " " + user.lastName + " commented on your post.",
          notId: post.postBy,
          notFrom: user.id,
          role: user.role,
          user: user.role === "model" ? model : { ...others, client },
        });

        await newComment.save();

        await post.updateOne({ $push: { comments: user.id } });

        res.status(200).json("You commented on this post.");
      } else {
        res.status(404).json("Post not found");
      }
    } else {
      res.status(403).json("You are not allowed to perform this action");
    }
  } catch (err) {
    console.log("Connection error!");
  }
});

// get post's comments
router.get("/comments/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const { page } = req.query;
      const pageSize = 15;

      const postComments = await CommunityComment.find({
        post: req.params.id,
      })
        .select()
        .skip((parseInt(page) - 1) * pageSize)
        .limit(pageSize);

      const totalRecords = await CommunityComment.countDocuments({
        post: req.params.id,
      });

      const totalPages = Math.ceil(totalRecords / pageSize);
      const currentPage = parseInt(page) || 1;

      const response = {
        totalPages,
        currentPage,
        length: totalRecords,
        comments: postComments,
      };

      res.status(200).json(response);
    } else {
      res.status(403).json("You are not allowed to perform this action");
    }
  } catch (err) {
    console.log("Connection error!");
  }
});

// delete a comment
router.delete("/delete/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const postComment = await CommunityComment.findOne({
        userId: req.params.id,
      });

      if (postComment) {
        res.status(200).json("You delete this comment.");
      } else {
        res.status(404).json("Not found");
      }
    } else {
      res.status(403).json("You are not allowed to perform this action");
    }
  } catch (err) {
    console.log("Connection error!");
  }
});

module.exports = router;
