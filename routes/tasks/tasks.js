const express = require("express");
const router = express.Router();
const db = require("../../firebase/firestore");

router.get("/", function (req, res) {
    db.getTasks()
        .then((data) => {
            res.status(200).send({
                status: "OK",
                tasks: data.tasks,
                setting: data.setting,
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
