const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String },
    photo: { type: String },
    likes: { type: Array },
    cat: { type: String },
    paragraphs: [
      {
        text: { type: String },
        image: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
