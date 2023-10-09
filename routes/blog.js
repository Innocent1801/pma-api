const router = require("express").Router();
const Blog = require("../models/Blog");
const Comment = require("../models/Comment");
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
router.get("/blogs", async (req, res) => {
  try {
    // Pagination parameters
    const { query, page } = req.query;
    const pageSize = 10; // Number of items to return per page

    const blog = await Blog.find()
      .sort({ createdAt: -1 }) // Sort in descending order
      .select()
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const totalRecords = await Blog.countDocuments();

    const totalPages = Math.ceil(totalRecords / pageSize);
    const currentPage = parseInt(page) || 1;

    let result = [];
    if (query) {
      result = search(blog);
    } else {
      result = blog;
    }

    const response = {
      totalPages,
      currentPage,
      length: totalRecords,
      blog: result,
    };

    if (response.length > 0) {
      res.status(200).json(response);
    } else {
      res.status(400).json("No blog found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get a single blog
router.get("/blog/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (blog) {
      res.status(200).json(blog);
    } else {
      res.status(404).json("Blog not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// get blogs by query category
router.get("/blogs/query", async (req, res) => {
  try {
    // Pagination parameters
    const { queryB, page } = req.query;
    const pageSize = 10; // Number of items to return per page

    const query = await Blog.find({ cat: req.query.cat });

    let result = [];
    if (queryB) {
      result = search(query);
    } else {
      result = query;
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
      blog: slicedResult,
    };

    if (response.length > 0) {
      res.status(200).json(response);
    } else {
      res.status(404).json("Blog not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// comment on a blog
router.post(
  "/blog/comment/:id",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const user = req.user;

      if (user) {
        const blog = await Blog.findById(req.params.id);

        if (blog) {
          const comment = new Comment({
            comment: req.body.comment,
            by: user.id,
            blog: blog._id,
          });

          comment.save();

          res.status(200).json("You commented on this blog!");
        } else {
          res.status(404).json("Blog has been removed!");
        }
      } else {
        res.status(400).json("Please login to continue");
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

// get a blog comments
router.get("/blog/comments/:id", async (req, res) => {
  try {
    // Pagination parameters
    const { query, page } = req.query;
    const pageSize = 10; // Number of items to return per page

    const blog = await Blog.findById(req.params.id);
    const comments = await Comment.find({ blog: blog._id });

    let result = [];
    if (query) {
      result = search(comments);
    } else {
      result = comments;
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
      jobs: slicedResult,
    };

    if (blog) {
      res.status(200).json(response);
    } else {
      res.status(404).json("Blog not found!");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// like a blog
router.put("/blog/like/:id", verifyTokenAndAuthorization, async (req, res) => {
  try {
    const user = req.user;

    if (user) {
      const blog = await Blog.findById(req.params.id);
      await blog.updateOne({ $push: { likes: user.id } });

      if (blog) {
        res.status(200).json("You like this blog");
      } else {
        res.status(404).json("Blog has been removed!");
      }
    } else {
      res.status(400).json("Please login to continue");
    }
  } catch (err) {
    res.status(500).json("Connection error!");
  }
});

// unlike a blog
router.put(
  "/blog/unlike/:id",
  verifyTokenAndAuthorization,
  async (req, res) => {
    try {
      const user = req.user;

      if (user) {
        const blog = await Blog.findById(req.params.id);
        await blog.updateOne({ $pull: { likes: user.id } });

        if (blog) {
          res.status(200).json("You unlike this blog");
        } else {
          res.status(404).json("Blog has been removed!");
        }
      } else {
        res.status(400).json("Please login to continue");
      }
    } catch (err) {
      res.status(500).json("Connection error!");
    }
  }
);

// update a blog by the admin
router.put("/blog/edit", verifyTokenAndAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      { _id: req.query._id },
      { $set: req.body },
      { new: true }
    );

    res.status(200).json(blog);
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
