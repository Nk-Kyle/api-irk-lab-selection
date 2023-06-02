const express = require("express");
const router = express.Router();
const db = require("../../firebase/firestore");
const verifyToken = require("../../middlewares/verifyToken");

router
    .get("/", verifyToken, function (req, res) {
        // GET route handling logic
        const { user } = req;
        db.getAssistantTask(user.email)
            .then((assistantTask) => {
                res.status(200).send({
                    status: "OK",
                    task: assistantTask,
                });
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send({
                    status: "ERROR",
                    message: "Internal server error",
                });
            });
    })
    .post("/", verifyToken, function (req, res) {
        const { user } = req;
        const task = req.body;
        db.createOrUpdateTask(user, task)
            .then((newTask) => {
                res.status(200).send({
                    status: "OK",
                    task: newTask,
                });
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send({
                    status: "ERROR",
                    message: "Internal server error",
                });
            });
    });

module.exports = router;
