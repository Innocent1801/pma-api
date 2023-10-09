const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    sender: { type: String },
    senderEmail: { type: String },
    amount: { type: Number },
    desc: { type: String },
    isApproved: { type: Boolean, default: true },
    endDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
