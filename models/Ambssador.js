const mongoose = require("mongoose");

const AmbassadorSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phoneNo: { type: String },
    start: { type: String },
    end: { type: String },
    location: { type: String },
    picture: { type: String },
    code: { type: String },
    models: { type: Array },
    activeModels: { type: Number, default: 0 },
    pendingModels: { type: Number, default: 0 },
    totalEarning: { type: Number, default: 0 },
    availableBal: { type: Number, default: 0 },
    payout: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ambassador", AmbassadorSchema);
