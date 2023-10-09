const router = require("express").Router();

const authRoute = require("./auth");
const modelRoute = require("./model");
const clientRoute = require("./client");
const AgencyRoute = require("./agency");
const UserRoute = require("./user");
const AdminRoute = require("./admin");
const JobRoute = require("./job");
const BlogRoute = require("./blog");
const NotificationRoute = require("./notification");
const PaymentRoute = require("./payment");
const ConversationRoute = require("./conversation");
const BookModelRoute = require("./bookModel");
const TransactionRoute = require("./transaction");
const CommunityRoute = require("./community");

router.use("/api/v2/auth", authRoute);
router.use("/api/v2/model", modelRoute);
router.use("/api/v2/client", clientRoute);
router.use("/api/v2/agency", AgencyRoute);
router.use("/api/v2/user", UserRoute);
router.use("/api/v2/admin", AdminRoute);
router.use("/api/v2/job", JobRoute);
router.use("/api/v2/blog", BlogRoute);
router.use("/api/v2/notification", NotificationRoute);
router.use("/api/v2/payment", PaymentRoute);
router.use("/api/v2/conversation", ConversationRoute);
router.use("/api/v2/book", BookModelRoute);
router.use("/api/v2/transaction", TransactionRoute);
router.use("/api/v2/community", CommunityRoute);

module.exports = router;
