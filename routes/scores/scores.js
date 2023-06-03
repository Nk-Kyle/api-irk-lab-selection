const express = require("express");
const router = express.Router();
const db = require("../../firebase/firestore");

router.get("/", function (req, res) {
    db.getScores()
        .then((scores) => {
            res.status(200).send({
                status: "OK",
                scores: scores,
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
