const router = require("express").Router();

const authRoute = require("./auth");
const modelRoute = require("./model");
const clientRoute = require("./client");
const AgencyRoute = require("./agency");
const UserRoute = require("./user");
const AdminRoute = require("./admin");
const JobRoute = require("./job");
const BlogRoute = require("./blog");

router.use("/api/auth", authRoute);
router.use("/api/model", modelRoute);
router.use("/api/client", clientRoute);
router.use("/api/agency", AgencyRoute);
router.use("/api/user", UserRoute);
router.use("/api/admin", AdminRoute);
router.use("/api/job", JobRoute);
router.use("/api/blog", BlogRoute);

module.exports = router;
