const mongoose = require("mongoose");

const CommunityCommentSchema = new mongoose.Schema(
  {
    comment: { type: String },
    user: { type: Object },
    userRole: { type: String },
    userId: { type: String },
    post: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CommunityComment", CommunityCommentSchema);
