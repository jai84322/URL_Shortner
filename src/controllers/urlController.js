const urlModel = require("../models/urlModel");
const shortId = require("shortid");
const axios = require("axios");

const createShortURL = async function (req, res) {
  try {
    let { longUrl, shortUrl, urlCode } = req.body;
    let obj = {};

    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "please enter valid request input" });
    }

    if (shortUrl || urlCode) {
      return res
        .status(400)
        .send({ status: false, message: "please enter longUrl only" });
    }

    if (!longUrl) {
      return res
        .status(400)
        .send({ status: false, message: "longUrl is missing" });
    }

    let found = false;
    await axios
      .get(longUrl)
      .then((response) => {
        if (response.status == 200 || response.status == 201) found = true;
      })
      .catch((err) => {});

    if (!found)
      return res.status(400).send({ status: "false", message: "Invalid URL" });

    let checkURL = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ _id: 0, __v: 0 });
    if (checkURL) {
      return res.status(201).send({
        status: true,
        message: "Url is already shortened",
        data: checkURL,
      });
    }
    obj.longUrl = longUrl;
    obj.urlCode = shortId.generate();

    obj.shortUrl = "http://localhost:3000/".concat(
      obj.urlCode.toLocaleLowerCase()
    );

    await urlModel.create(obj);
    let finalData = await urlModel.findOne(obj).select({ _id: 0, __v: 0 });
    return res
      .status(201)
      .send({ status: true, message: "success", data: finalData });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, messgae: err.messgae });
  }
};

const getURL = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    if (!shortId.isValid(urlCode))
      return res
        .status(400)
        .send({ status: false, message: "Enter valid urlCode" });

    let getLongURL = await urlModel.findOne({ urlCode: urlCode });

    if (!getLongURL)
      return res
        .status(404)
        .send({ status: false, message: "urlCode is not found" });

    res
      .status(302)
      .redirect(getLongURL.longUrl, 302)
      .send(`Found. Redirecting to ${getLongURL.longUrl}`);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, messgae: err.messgae });
  }
};

module.exports = {
  createShortURL,
  getURL,
};

// const shortUrl = `http://localhost:3000/${urlCode}`;
//             const data = {};
//             data["longUrl"] = longUrl;
//             data["shortUrl"] = shortUrl;
//             data["urlCode"] = urlCode;

//             let profile = await urlModel.create(data);
//             await SET_ASYNC(`${longUrl}`, JSON.stringify(profile));
//             await SET_ASYNC(`${urlCode}`, JSON.stringify(profile));
//             let profile1=await urlModel.findOne({urlCode:urlCode}).select({ _id:0,createdAt: 0, updatedAt: 0, __v: 0 })
//             res.status(201).send({ data: profile1 });
