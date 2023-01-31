const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    sender: { type: String },
    amount: { type: Number },
    desc: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
