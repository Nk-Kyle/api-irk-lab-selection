const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);
const student_regexp = new RegExp(".*(@std.stei.itb.ac.id)$");
var express = require("express");
var router = express.Router();
var db = require("../../firebase/firestore");

router
    .get("/", function (req, res) {})
    .post("/", function (req, res) {
        token = req.headers["irk-token"];

        verify(token)
            .then((data) => {
                // Check if user is a student
                if (student_regexp.test(data.email)) {
                    db.getOrCreateUser(data)
                        .then((user) => {
                            res.status(200).send({
                                status: "OK",
                                user: user,
                            });
                        })
                        .catch((err) => {
                            res.status(500).send({
                                status: "ERROR",
                                message: "Internal server error",
                            });
                        });
                } else {
                    res.status(403).send({
                        status: "ERROR",
                        message: "User is not a student",
                    });
                }
            })
            .catch((err) => {
                console.log(err);
                res.status(403).send({
                    status: "ERROR",
                    message: "Invalid token",
                });
            });
    });

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
}

module.exports = router;
