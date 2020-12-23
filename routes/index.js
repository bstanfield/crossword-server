const express = require("express");
const bodyParser = require('body-parser');
const url = require('url');
const querystring = require('querystring');
const router = express.Router();

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

const validKeys = ['alpha', 'beta'];
router.get("/secret", (req, res) => {
  const key = req.query.key;
  if (validKeys.includes(key)) {
    console.log('returning 200')
    return res.send({ sent: key }).status(200);
  }
  console.log('returning 404')
  res.send({ error: 'Key not valid', sent: key }).status(404);
});

module.exports = router;
