var express = require("express");
var router = express.Router();

router
    .get("/", function (req, res) {})
    .use("/auth", require("./auth/auth.js"))
    .use("/task", require("./task/task.js"))
    .use("/tasks", require("./tasks/tasks.js"));

module.exports = router;
