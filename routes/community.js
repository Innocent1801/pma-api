const router = require("express").Router();
const Community = require("../models/Community");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization } = require("./jwt");
const notification = require("../services/notifications");
const Models = require("../models/Models");
const Client = require("../models/Client");

// Function to shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// make a post
router.post("/post", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const newPost = new Community({
        postBy: user.id,
        post: req.body.post,
        photos: req.body.photos,
        username: user.username,
        name: user.firstName + " " + user.lastName,
        picture: user.picture,
      });

      await newPost.save();

      res
        .status(200)
        .json({ message: "Post sent successfully!", post: newPost });
    } else {
      res.status(403).json("You are not allowed to perform this action");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// react to a post
router.put("/react/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const post = await Community.findById(req.params.id);

      if (post) {
        if (!post.likes.includes(user.id)) {
          await post.updateOne({ $push: { likes: user.id } });
          await post.updateOne({ $push: { users: user.id } });

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

          if (post.postBy !== user.id) {
            if (!post.users.includes(user.id)) {
              await notification.sendNotification({
                notification: {},
                notTitle:
                  user.firstName +
                  " " +
                  user.lastName +
                  " reacted to your post.",
                notId: post.postBy,
                notFrom: user.id,
                role: user.role,
                user: user.role === "model" ? model : { ...others, client },
              });
            }
          }

          res.status(200).json({ message: "You reacted to this post" });
        } else {
          await post.updateOne({ $pull: { likes: user.id } });

          res.status(200).json({ message: "You reacted to this post" });
        }
      } else {
        res.status(404).json("Post not found!");
      }
    } else {
      res.status(403).json("You are not allowed to perform this action");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete a post
router.delete("/delete/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const post = await Community.findById(req.params.id);

      if (post) {
        await Community.findByIdAndDelete(req.params.id);

        res.status(200).json("Post deleted successfully.");
      } else {
        res.status(404).json("Post not found!");
      }
    } else {
      res.status(403).json("You are not allowed to perform this action");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get posts
router.get("/posts", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const { page } = req.query;
      const pageSize = 15;

      // Fetch all posts ordered by date
      const posts = await Community.find()
        .sort({ createdAt: -1 }) // Sort in descending order
        .select()
        .skip((parseInt(page) - 1) * pageSize)
        .limit(pageSize);

      const totalRecords = await Community.countDocuments();

      const totalPages = Math.ceil(totalRecords / pageSize);
      const currentPage = parseInt(page) || 1;

      // Shuffle the posts randomly
      const shuffledPosts = shuffleArray([...posts]);

      const postLikes = posts.flatMap((item) => item.likes);

      let likes = [];
      for (const likeId of postLikes) {
        const postLike = await Users.findById(likeId);

        if (postLike) {
          likes.push(postLike);
        }
      }

      const response = {
        totalPages,
        currentPage,
        length: totalRecords,
        userLike: likes[0],
        posts: posts,
      };

      res.status(200).json(response);
    } else {
      res.status(403).json("You are not allowed to perform this action");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get single post
router.get("/post/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);

    if (user) {
      const post = await Community.findById(req.params.id);

      if (post) {
        res.status(200).json(post);
      } else {
        res.status(404).json("Post not found!");
      }
    } else {
      res.status(403).json("You are not allowed to perform this action");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
