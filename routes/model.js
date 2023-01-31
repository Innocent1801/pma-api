const router = require("express").Router();
const BookModel = require("../models/BookModel");
const Models = require("../models/Models");
const Payment = require("../models/Payment");
const Post = require("../models/Post");
const Users = require("../models/Users");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./jwt");

// book model
router.post("/:uuid", verifyTokenAndAuthorization, async (req, res) => {
  const user = await Users.findById(req.user.id);
  const model = await Models.findOne({ uuid: req.params.uuid });
  try {
    if (user && user.isVerified) {
      if (model) {
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
        res.status(200).json("Model booked");
      } else {
        res.status(400).json("An error occured");
      }
    } else {
      res.status(400).json("User needs to be verified before proceeding");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all model
router.get("/", verifyTokenAndAuthorization, async (req, res) => {
  const findModels = await Users.find({ role: "model" });
  try {
    if (findModels.length > 0) {
      res.status(200).json(findModels);
    } else {
      res.status(404).json("No model at the moment");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get all booked model
router.get("/booked-models", verifyTokenAndAuthorization, async (req, res) => {
  const bookedModel = await BookModel.find();
  // const model = await Models.find({ _id: bookedModel.modelId });
  try {
    res.status(200).json(bookedModel);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get singular model
router.get("/:uuid", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const model = await Models.findOne({ uuid: req.params.uuid });
    const user = await Users.findOne({ _id: model.uuid });

    if (user) {
      res.status(200).json({ ...user._doc, model });
    } else {
      res.status(404).json("Model not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// model edit portfolio
router.put("/", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const model = await Models.findOneAndUpdate(
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
      res.status(200).json({ ...user._doc, model });
    } else {
      res.status(404).json("User not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// model add photos to portfolio
router.post("/upload-photo", verifyTokenAndAuthorization, async (req, res) => {
  const model = await Models.findOne({ uuid: req.user.uuid });

  try {
    if (model) {
      if (req.body.videos) {
        await model.updateOne({ $push: { videos: req.body.photos } });
      } else {
        await model.updateOne({ $push: { photos: req.body.photos } });
      }
      res.status(200).json("Photo uploaded");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// make payment
router.post("/payment/model", verifyTokenAndAuthorization, async (req, res) => {
  const model = await Models.findOne({ uuid: req.user.uuid });

  try {
    if (model) {
      const newPayment = new Payment({
        sender: model.uuid,
        amount: req.body.amount,
        desc: req.body.desc,
      });
      await newPayment.save();
      res.status(200).json("Payment successful");
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get payments made
router.get("/payment/model", verifyTokenAndAuthorization, async (req, res) => {
  const model = await Models.findOne({ uuid: req.user.uuid });

  try {
    if (model) {
      const payment = await Payment.find({ sender: model.uuid });
      res.status(200).json(payment);
    } else {
      res.status(400).json("Oops! An error occured");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// TODO: community post
// make a new post
router.post("/new/post", verifyTokenAndAuthorization, async (req, res) => {
  const user = await Users.findById(req.user.id);

  if (user.role === "model") {
    try {
      const newPost = new Post({
        postBy: user.id,
        title: req.body.title,
        text: req.body.text,
        photo: req.body.photo,
      });

      await newPost.save();
      res.status(200).json(newPost);
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  } else {
    res.status(400).json("Oops! An error occured");
  }
});

// get all posts posted
router.get("/posts/all", verifyTokenAndAuthorization, async (req, res) => {
  const posts = await Post.find();
  try {
    if (posts.length > 0) {
      res.status(200).json(posts);
    } else {
      res.status(400).json("No posts found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get posts posted
router.get("/posts/posted", verifyTokenAndAuthorization, async (req, res) => {
  const user = await Users.findById(req.user.id);
  const posts = await Post.find({ postBy: user.id });
  try {
    if (posts.length > 0) {
      res.status(200).json(posts);
    } else {
      res.status(400).json("No posts found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get a single post
router.get("/post/:id", verifyTokenAndAuthorization, async (req, res) => {
  const post = await Post.findById(req.params.id);
  try {
    if (post) {
      res.status(200).json(post);
    } else {
      res.status(404).json("Post not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete a post by the admin
router.delete("/post/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (post) {
      res.status(200).json("Post deleted successfully");
    } else {
      res.status(404).json("Not found, job might have been recently deleted!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
