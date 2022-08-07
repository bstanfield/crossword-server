const express = require("express");
const router = express.Router();
const { getValidKeys } = require('../db');
const {
  findPuzzleBySearchString
} = require("../data");

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

router.get("/secret", async (req, res) => {
  const key = req.query.key;

  const validKeys = (await getValidKeys()).map(key => key.name);

  if (validKeys.includes(key)) {
    return res.send({ sent: key }).status(200);
  }

  res.send({ error: 'Key not valid', sent: key }).status(404);
});

router.get("/search", async (req, res) => {
  const string = req.query.string;

  console.log('searching for ', string);

  const relevantPuzzlesBasedOnSearch = await findPuzzleBySearchString(string);

  res.send({ puzzles: relevantPuzzlesBasedOnSearch }).status(200);
})

module.exports = router;
