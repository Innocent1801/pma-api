const mongoose = require("mongoose");

const ModelSchema = new mongoose.Schema(
  {
    uuid: { type: String },
    photos: { type: Array },
    videos: { type: Array },
    picture: { type: String },
    country: { type: String },
    state: { type: String },
    shortDesc: { type: String },
    followers: { type: Array },
    followings: { type: Array },
    ig: { type: String },
    bio: { type: String },
    height: { type: String },
    hip: { type: String },
    shoe: { type: String },
    hairColor: { type: String },
    waist: { type: String },
    eyes: { type: String },
    tattoos: { type: String },
    hairLength: { type: String },
    language: { type: String },
    burst: { type: String },
    size: { type: String },
    gender: { type: String },
    ethnicity: { type: String },
    travel: { type: Boolean },
    interestedJob: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Model", ModelSchema);
