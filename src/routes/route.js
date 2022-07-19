const express = require("express");
const router = express.Router();
const { createShortURL, getURL } = require("../controllers/urlController");

router.post("/url/shorten", createShortURL);
router.get("/:urlCode", getURL);

// validating the route
router.all("/*", function (req, res) {
  res.status(400).send({ status: false, message: "invalid http request" });
});

module.exports = router;
