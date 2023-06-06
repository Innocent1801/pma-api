const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    sender: { type: String },
    senderEmail: { type: String },
    amount: { type: Number },
    desc: { type: String },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", WalletSchema);
