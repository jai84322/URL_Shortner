const express = require("express");
const router = express.Router();

router.post("/url/shorten", createShortURL);

module.exports.router = router;
