const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

const validKeys = ['alpha', 'beta', 'svalbard', 'circle_sm', 'new_york', 'mississippi', 'sunderman', 'albina', 'bonsai', 'black_jeep', '2802', 'tahoe', '3_nights', 'bird_watcher', 'not_the_continent', 'nipomo', 'gridflower', 'campfire', 'persimmon', 'talbot', 'banjo', 'minions', 'beemsterboss'];

router.get("/secret", (req, res) => {
  const key = req.query.key;

  if (validKeys.includes(key)) {
    return res.send({ sent: key }).status(200);
  }

  res.send({ error: 'Key not valid', sent: key }).status(404);
});

module.exports = router;
