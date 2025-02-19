var express = require("express");
var router = express.Router();

router
    .get("/", function (req, res) {})
    .use("/auth", require("./auth/auth.js"))
    .use("/task", require("./task/task.js"))
    .use("/tasks", require("./tasks/tasks.js"))
    .use("/submissions", require("./submissions/submissions.js"))
    .use("/scores", require("./scores/scores.js"))
    .use("/contacts", require("./contacts/contacts.js"));

module.exports = router;
