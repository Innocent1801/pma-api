const mongoose = require("mongoose");

const BookModelSchema = new mongoose.Schema(
  {
    name: { type: String },
    country: { type: String },
    state: { type: String },
    from: { type: Date },
    to: { type: Date },
    price: { type: Number },
    jobDescription: { type: String },
    modelId: { type: String },
    clientId: { type: String },
    isAccepted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BookModel", BookModelSchema);
