const express = require("express");
const router = express.Router();
const db = require("../../firebase/firestore");
const verifyToken = require("../../middlewares/verifyToken");

router
    .get("/", verifyToken, function (req, res) {
        const { user } = req;
        db.getTaskSubmissionsForAssistant(user)
            .then((submissions) => {
                res.status(200).send({
                    status: "OK",
                    submissions: submissions,
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
        const student_email = req.body.student_email;
        const score = req.body.score;
        db.scoreSubmission(user, student_email, score)
            .then((result) => {
                if (result === null) {
                    res.status(404).send({
                        status: "ERROR",
                        message: "Task not found",
                    });
                } else {
                    res.status(200).send({
                        status: "OK",
                        message: "Task scored",
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
