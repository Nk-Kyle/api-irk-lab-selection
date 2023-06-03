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
    .get("/:id", verifyToken, function (req, res) {
        // GET route handling logic
        const { user } = req;
        const { id } = req.params;
        db.getTask(user, id)
            .then((task) => {
                if (task === null) {
                    res.status(404).send({
                        status: "ERROR",
                        message: "Task not found",
                    });
                } else {
                    res.status(200).send({
                        status: "OK",
                        task: task,
                    });
                }
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
    })
    .post("/:id", verifyToken, function (req, res) {
        const { user } = req;
        const { id } = req.params;
        const link = req.body.link;
        db.createOrUpdateSubmission(user, id, link)
            .then((result) => {
                if (result === null) {
                    res.status(404).send({
                        status: "ERROR",
                        message: "Task not found",
                    });
                } else if (result === false) {
                    res.status(403).send({
                        status: "ERROR",
                        message: "Task already scored",
                    });
                } else {
                    res.status(200).send({
                        status: "OK",
                        link: link,
                    });
                }
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
