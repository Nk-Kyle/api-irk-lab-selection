require("dotenv").config();
const express = require("express");
const cors = require("cors");

var app = express();
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://irk-lab-selection.vercel.app",
        ],
    })
);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
app.use(express.json());
app.use("/api", require("./routes/api"));
