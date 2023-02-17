const mongoose = require("mongoose");

const AgencySchema = new mongoose.Schema(
  {
    uuid: { type: String },
    fullName: { type: String },
    country: { type: String },
    followers: { type: Array },
    followings: { type: Array },
    photo: { type: String },
    about: { type: String },
    models: { type: Array },
    ig: { type: String },
    fb: { type: String },
    tw: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agency", AgencySchema);
