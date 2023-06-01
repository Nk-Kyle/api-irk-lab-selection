const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);

async function verifyToken(req, res, next) {
    try {
        const token = req.headers["irk-token"];
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.OAUTH_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        req.user = payload;
        next();
    } catch (err) {
        res.status(403).send({
            status: "ERROR",
            message: "Invalid token",
        });
    }
}

module.exports = verifyToken;
