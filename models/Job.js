const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    postBy: { type: String },
    title: { type: String },
    desc: { type: String },
    paymentInfo: { type: String },
    payMoreDetails: { type: String },
    price: { type: Number, default: 0 },
    type: { type: String },
    location: { type: String },
    country: { type: String },
    state: { type: String },
    expire: { type: String }, 
    product: { type: String },
    gender: { type: String },
    age: { type: String },
    height: { type: String },
    isPaid: { type: Boolean, default: false },
    photos: { type: Array },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
