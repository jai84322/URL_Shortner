const shortId = require("shortid");
const axios = require("axios");
const redis = require("redis");
const urlModel = require("../models/urlModel");
const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  15839,
  "redis-15839.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);

redisClient.auth("rF7jSTe0P11DGm2oYI8SD4A4xyzSsJZn", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//Connection setup for redis
const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//-------------------------------------Create Short URL-------------------------------------
const createShortURL = async function (req, res) {
  try {
    let { longUrl, shortUrl, urlCode } = req.body;
    let obj = {};

    // validating inout from req.body
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

    // checking in cache memory
    let cachedLongUrl = await GET_ASYNC(longUrl);
    // cache hit case
    if (cachedLongUrl)
      return res.status(201).send({
        status: true,
        message: "Url is already shortened",
        data: JSON.parse(cachedLongUrl),
      });
    // cache miss case
    else {
      // validating the URL
      let found = false;
      await axios
        .get(longUrl)
        .then((response) => {
          if (response.status == 200 || response.status == 201) found = true;
        })
        .catch((err) => {});

      if (!found)
        return res
          .status(400)
          .send({ status: "false", message: "Invalid URL" });

      // checking for duplicate longURL
      let checkURL = await urlModel
        .findOne({ longUrl: longUrl })
        .select({ _id: 0, __v: 0 });

      // if longURL is not present in collection, creating new data
      if (!checkURL) {
        obj.longUrl = longUrl;
        obj.urlCode = shortId.generate();

        obj.shortUrl = "http://localhost:3000/".concat(
          obj.urlCode.toLocaleLowerCase()
        );

        // creating new data
        await urlModel.create(obj);
        checkURL = await urlModel.findOne(obj).select({ _id: 0, __v: 0 });
      }

      // set values in cache memory
      await SETEX_ASYNC(`${longUrl}`, 24 * 60 * 60, JSON.stringify(checkURL));
      await SETEX_ASYNC(
        `${checkURL.urlCode}`,
        24 * 60 * 60,
        JSON.stringify(checkURL)
      );

      return res
        .status(201)
        .send({ status: true, message: "success", data: checkURL });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, messgae: err.messgae });
  }
};

//-------------------------------------get Long URL-------------------------------------
const getURL = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    // validating urlCode
    if (!shortId.isValid(urlCode))
      return res
        .status(400)
        .send({ status: false, message: "Enter valid urlCode" });

    // checking in cache memory
    let cachedUrlCode = await GET_ASYNC(urlCode);
    // cache hit case
    if (cachedUrlCode) {
      let data = JSON.parse(cachedUrlCode);
      res.redirect(data.longUrl);
    } else {
      // cache miss case
      let getLongURL = await urlModel.findOne({ urlCode: urlCode });
      if (!getLongURL)
        return res
          .status(404)
          .send({ status: false, message: "urlCode is not found" });

      await SETEX_ASYNC(`${urlCode}`, 24 * 60 * 60, JSON.stringify(getLongURL));
      await SETEX_ASYNC(
        `${getLongURL.longUrl}`,
        24 * 60 * 60,
        JSON.stringify(getLongURL)
      );

      // redirecting to longURL from short URL
      res.redirect(getLongURL.longUrl);
    }
  } catch (err) {
    return res.status(500).send({ status: false, messgae: err.messgae });
  }
};

module.exports = {
  createShortURL,
  getURL,
};
