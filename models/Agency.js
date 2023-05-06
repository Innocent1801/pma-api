const mongoose = require("mongoose");

const AgencySchema = new mongoose.Schema(
  {
    uuid: { type: String },
    fullName: { type: String },
    email: { type: String },
    agencyName: { type: String },
    agencyUrl: { type: String },
    country: { type: String },
    state: { type: String },
    address: { type: String },
    followers: { type: Array },
    followings: { type: Array },
    picture: { type: String },
    coverPhoto: { type: String },
    about: { type: String },
    models: { type: Array },
    instagram: { type: String },
    jobPhotos:{type: Array},
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agency", AgencySchema);
