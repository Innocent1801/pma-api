const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema(
  {
    uuid: { type: String },
    email: { type: String },
    picture: { type: String },
    coverPicture: { type: String },
    brandName: { type: String },
    brandUrl: { type: String },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    industry: { type: String },
    bio: { type: String },
    instagram: { type: String },
    jobPhotos:{type: Array},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", ClientSchema);
