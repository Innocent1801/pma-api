const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String },
    email: { type: String },
    password: { type: String },
    role: { type: String, default: "client" },
    mobileNo: { type: String },
    picture: { type: String },
    referral: { type: String },
    country: { type: String },
    state: { type: String },
    isVerified: { type: Boolean, default: false },
    isUpdated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
