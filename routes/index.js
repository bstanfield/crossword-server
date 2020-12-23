const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

const validKeys = ['alpha', 'beta'];
router.get("/secret", (req, res) => {
  const key = req.query.key;

  if (validKeys.includes(key)) {
    return res.send({ sent: key }).status(200);
  }

  res.send({ error: 'Key not valid', sent: key }).status(404);
});

module.exports = router;
