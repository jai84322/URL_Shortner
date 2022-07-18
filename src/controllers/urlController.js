const urlModel = require("../models/urlModel");
const validUrl = require("valid-url")
const shortId = require('shortid')

const createShortURL = async function (req, res) {
  try {
    let {longUrl, shortUrl, urlCode } = req.body
    let obj = {}

    if (Object.keys(req.body).length == 0) {
      return res.status(400).send({status: false, message: "please enter valid request input"})
    }

    if (shortUrl || urlCode) {
      return res.status(400).send({status: false, message: "please enter longUrl only"})
    }
    
    if (!longUrl) {
      return res.status(400).send({status: false, message: "longUrl is missing"})
    }

    if (!/(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/.test(longUrl)
    ) {
      return res.status(400).send({status: false, message: "please enter valid url"})
    }

    // if (!validUrl.isUri(longUrl)) {
    //   return res.status(400).send({status: false, message: "please enter valid url"})
    // }

    let checkURL = await urlModel.findOne({longUrl : longUrl}).select({_id:0, __v:0})
    if (checkURL) {
      return res.status(201).send({status: true, message: "Url is already shortened", data: checkURL})
    }
    obj.longUrl = longUrl

    let baseUrl = "http://localhost:3000/"

    obj.urlCode = shortId.generate()

    obj.shortUrl = baseUrl.concat(obj.urlCode.toLocaleLowerCase())


    let savedData = await urlModel.create(obj)
    let finalData = await urlModel.findOne(obj).select({_id: 0, __v:0})
    return res.status(201).send({status: true, message: "success", data: finalData})

  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, messgae: err.messgae });
  }
};
 

module.exports = {
  createShortURL,
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


