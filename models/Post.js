const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    postBy: { type: String },
    title: { type: String },
    text: { type: String },
    photo: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);
