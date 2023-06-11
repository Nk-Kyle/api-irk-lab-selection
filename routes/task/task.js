const express = require("express");
const router = express.Router();
const db = require("../../firebase/firestore");
const verifyToken = require("../../middlewares/verifyToken");

const https = require("https");
require("dotenv").config();
const TOKEN = process.env.LINE_ACCESS_TOKEN;

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
                    if (result[2]) {
                        pushMessage(
                            result[1],
                            `New Submission by ${user.email}\nSubmission link:\n${link}\n\nPlease score the submission at ${process.env.FRONTEND_URL}/manage`,
                        );
                    } else {
                        pushMessage(
                            result[1],
                            `Updated Submission by ${user.email}\nSubmission Link:\n${link}\n\nPlease score the submission at ${process.env.FRONTEND_URL}/manage`,
                        );
                    }

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

const pushMessage = async (assistantEmail, message) => {
    const assistant = await db.getAssistantByEmail(assistantEmail);
    const userId = assistant.linehook;
    if (userId) {
        const data = JSON.stringify({
            to: userId,
            messages: [
                {
                    type: "text",
                    text: message,
                },
            ],
        });

        const options = {
            hostname: "api.line.me",
            path: "/v2/bot/message/push",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + TOKEN,
            },
            body: data,
        };

        const request = https.request(options);

        request.on("error", (error) => {
            console.error(error);
        });

        request.write(data);
        request.end();
    }
};

module.exports = router;
