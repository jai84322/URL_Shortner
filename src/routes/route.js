const express = require("express");
const router = express.Router();
const {createShortURL} = require("../controllers/urlController")

router.post("/url/shorten", createShortURL);

module.exports = router;
