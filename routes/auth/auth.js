const express = require("express");
const router = express.Router();
const db = require("../../firebase/firestore");
const verifyToken = require("../../middlewares/verifyToken");

router
    .get("/", function (req, res) {
        // GET route handling logic
    })
    .post("/", verifyToken, function (req, res) {
        const { user } = req;
        const student_regexp = new RegExp(".*(@std.stei.itb.ac.id)$");
        const isStudent = student_regexp.test(user.email);

        // Check if user is a student
        db.getOrCreateUser(user, isStudent)
            .then((user) => {
                res.status(200).send({
                    status: "OK",
                    user: user,
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
