const router = require("express").Router();
const Blog = require("../models/Blog");
const { verifyTokenAndAdmin, verifyTokenAndAuthorization } = require("./jwt");

// post a new blog
router.post("/post-blog", verifyTokenAndAdmin, async (req, res) => {
  try {
    const newBlog = new Blog(req.body);
    await newBlog.save();
    res.status(200).json(newBlog);
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get blogs posted
router.get("/blogs", verifyTokenAndAuthorization, async (req, res) => {
  const blog = await Blog.find();
  try {
    if (blog.length > 0) {
      res.status(200).json(blog);
    } else {
      res.status(400).json("No blog found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get a single blog
router.get("/blog/:id", verifyTokenAndAuthorization, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  try {
    if (blog) {
      res.status(200).json(blog);
    } else {
      res.status(404).json("Blog not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// delete a blog by the admin
router.delete("/blog/:id", verifyTokenAndAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (blog) {
      res.status(200).json("Blog deleted successfully");
    } else {
      res.status(404).json("Not found, blog might have been recently deleted!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

module.exports = router;
