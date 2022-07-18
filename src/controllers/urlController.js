const urlModel = require("../models/urlModel");

const createShortURL = async function (req, res) {
  try {
  } catch (err) {
    return res.status(500).send({ status: false, messgae: err.messgae });
  }
};

module.exports = {
  createShortURL,
};
