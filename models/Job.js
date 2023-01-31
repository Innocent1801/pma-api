const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    postBy: { type: String },
    title: { type: String },
    desc: { type: String },
    type: { type: String },
    collaboration: { type: Boolean },
    location: { type: String },
    country: { type: String },
    state: { type: String },
    paymentInfo: { type: String },
    product: { type: String },
    gender: { type: String },
    isPaid: { type: Boolean, default: false },
    photos: { type: Array },
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
